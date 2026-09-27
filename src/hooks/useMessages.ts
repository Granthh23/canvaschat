'use client';

import { useState, useCallback, useEffect } from 'react';
import { Message, MessageReaction } from '@/types/chat';
import { getStoredMessages, saveStoredMessages } from '@/lib/storage';
import { CURRENT_USER } from '@/lib/mock-data';
import { getAllConversationsList } from './useConversations';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import {
  fetchMessagesDb,
  sendMessageDb,
  toggleReactionDb,
  subscribeToRealtimeMessages,
} from '@/lib/supabase/service';

import { useAuth, UserProfile } from '@/context/AuthContext';

export function useMessages() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>(() => getStoredMessages());
  const [typingStates, setTypingStates] = useState<Record<string, boolean>>({});
  const [incomingMessage, setIncomingMessage] = useState<Message | null>(null);

  // 1. Load initial messages & subscribe to realtime/broadcast changes
  useEffect(() => {
    let isMounted = true;

    if (isSupabaseConfigured) {
      fetchMessagesDb().then((dbMessages) => {
        if (dbMessages && dbMessages.length > 0 && isMounted) {
          setMessages(dbMessages);
          saveStoredMessages(dbMessages);
        }
      });
    }

    const unsubscribe = subscribeToRealtimeMessages((newMsg) => {
      if (!isMounted) return;

      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        const next = [...prev, newMsg];
        saveStoredMessages(next);
        return next;
      });

      // Track incoming message if sent by another user
      if (newMsg.senderId !== profile?.id && newMsg.senderId !== 'user') {
        setIncomingMessage(newMsg);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [profile]);

  const getConversationMessages = useCallback(
    (conversationId: string): Message[] => {
      return messages
        .filter((m) => m.conversationId === conversationId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    },
    [messages]
  );

  const sendMessage = useCallback(
    (conversationId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const activeUser: UserProfile = profile || {
        id: CURRENT_USER.id,
        name: CURRENT_USER.name,
        avatar: CURRENT_USER.avatar,
      };

      const userMessage: Message = {
        id: `msg-user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        conversationId,
        senderId: activeUser.id,
        senderName: activeUser.name,
        senderAvatar: activeUser.avatar,
        text: trimmed,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => {
        const next = [...prev, userMessage];
        saveStoredMessages(next);
        return next;
      });

      // Broadcast and persist message
      sendMessageDb(userMessage);

      // Simulated reply ONLY for AI Assistant conversation
      const conversationsList = getAllConversationsList();
      const conversation = conversationsList.find((c) => c.id === conversationId);
      if (conversation && conversation.isAi) {
        setTypingStates((prev) => ({ ...prev, [conversationId]: true }));

        setTimeout(() => {
          setTypingStates((prev) => ({ ...prev, [conversationId]: false }));

          const replyText = `Canvas Copilot: I received your note, ${activeUser.name}. In CanvasChat, conversations act as persistent spatial nodes on this interactive board!`;

          const replyMessage: Message = {
            id: `msg-reply-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            conversationId,
            senderId: conversation.id,
            senderName: conversation.title,
            senderAvatar: conversation.avatar,
            text: replyText,
            createdAt: new Date().toISOString(),
          };

          setMessages((prev) => {
            const next = [...prev, replyMessage];
            saveStoredMessages(next);
            return next;
          });

          sendMessageDb(replyMessage);
        }, 1200);
      }
    },
    [profile]
  );

  const toggleReaction = useCallback(
    (messageId: string, emoji: string) => {
      const activeUserId = profile?.id || CURRENT_USER.id;

      setMessages((prev) => {
        const updated = prev.map((m) => {
          if (m.id !== messageId) return m;

          const currentReactions = m.reactions || [];
          const existing = currentReactions.find((r) => r.emoji === emoji);

          let nextReactions: MessageReaction[];
          if (existing) {
            const hasReacted = existing.users.includes(activeUserId);
            if (hasReacted) {
              const newUsers = existing.users.filter((u) => u !== activeUserId);
              if (newUsers.length === 0) {
                nextReactions = currentReactions.filter((r) => r.emoji !== emoji);
              } else {
                nextReactions = currentReactions.map((r) =>
                  r.emoji === emoji ? { ...r, count: newUsers.length, users: newUsers } : r
                );
              }
            } else {
              const newUsers = [...existing.users, activeUserId];
              nextReactions = currentReactions.map((r) =>
                r.emoji === emoji ? { ...r, count: newUsers.length, users: newUsers } : r
              );
            }
          } else {
            nextReactions = [
              ...currentReactions,
              { emoji, count: 1, users: [activeUserId] },
            ];
          }
          return { ...m, reactions: nextReactions };
        });
        saveStoredMessages(updated);
        return updated;
      });

      if (isSupabaseConfigured) {
        toggleReactionDb(messageId, emoji, activeUserId);
      }
    },
    [profile]
  );

  const clearIncomingMessage = useCallback(() => {
    setIncomingMessage(null);
  }, []);

  return {
    messages,
    typingStates,
    incomingMessage,
    getConversationMessages,
    sendMessage,
    toggleReaction,
    clearIncomingMessage,
  };
}
