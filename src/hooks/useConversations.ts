'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Conversation } from '@/types/chat';
import { MOCK_CONVERSATIONS } from '@/lib/mock-data';
import { UserProfile } from '@/context/AuthContext';
import { fetchProfilesDb, subscribeToProfiles, saveConversationDb } from '@/lib/supabase/service';

const CUSTOM_CONVERSATIONS_KEY = 'canvaschat_custom_conversations_v1';
const ACCOUNTS_LIST_KEY = 'canvaschat_user_accounts_list';

export function getDirectMessageConversationId(user1Id: string, user2Id: string): string {
  const sorted = [user1Id.toLowerCase().trim(), user2Id.toLowerCase().trim()].sort();
  return `dm-${sorted[0]}-${sorted[1]}`;
}

function getStoredCustomConversations(): Conversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_CONVERSATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomConversations(convs: Conversation[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CUSTOM_CONVERSATIONS_KEY, JSON.stringify(convs));
  } catch {
    // ignore
  }
}

function getStoredAccounts(): UserProfile[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_LIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getCurrentUserProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('canvaschat_user_profile');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getAllConversationsList(): Conversation[] {
  const custom = getStoredCustomConversations();
  const accounts = getStoredAccounts();
  const currentProfile = getCurrentUserProfile();

  const filteredAccounts = accounts.filter((acc) => {
    if (!currentProfile) return true;
    if (acc.id === currentProfile.id) return false;
    if (acc.name.toLowerCase() === currentProfile.name.toLowerCase()) return false;
    if (currentProfile.email && acc.email?.toLowerCase() === currentProfile.email.toLowerCase()) return false;
    return true;
  });

  // Convert accounts to direct message conversations if not already in custom
  const accountConvs: Conversation[] = filteredAccounts.map((acc) => ({
    id: `conv-acc-${acc.id}`,
    title: acc.name,
    subtitle: acc.email ? `Direct Message • ${acc.email}` : 'Registered Account',
    roleOrType: 'Direct Message',
    avatar: acc.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(acc.name)}`,
    status: 'online',
  }));

  const map = new Map<string, Conversation>();

  // Add default mock conversations if any
  MOCK_CONVERSATIONS.forEach((c) => map.set(c.id, c));

  // Add registered accounts
  accountConvs.forEach((c) => {
    if (!map.has(c.id)) {
      map.set(c.id, c);
    }
  });

  // Add custom user created conversations (excluding self conversations)
  custom.forEach((c) => {
    if (currentProfile) {
      if (c.id === `conv-acc-${currentProfile.id}`) return;
      if (c.title.toLowerCase() === currentProfile.name.toLowerCase()) return;
      if (currentProfile.email && c.subtitle.toLowerCase().includes(currentProfile.email.toLowerCase())) return;
    }
    map.set(c.id, c);
  });

  return Array.from(map.values());
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(() => getAllConversationsList());
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;

  // Reload conversations when localStorage changes or on mount
  const refreshConversations = useCallback(() => {
    const list = getAllConversationsList();
    setConversations(list);

    const currentProfile = getCurrentUserProfile();

    fetchProfilesDb().then((dbProfiles) => {
      if (dbProfiles && dbProfiles.length > 0) {
        setConversations((prev) => {
          const map = new Map<string, Conversation>();
          prev.forEach((c) => map.set(c.id, c));

          dbProfiles.forEach((p) => {
            if (currentProfile) {
              if (p.id === currentProfile.id || p.name.toLowerCase() === currentProfile.name.toLowerCase()) return;
            }

            const id = `conv-acc-${p.id}`;
            if (!map.has(id)) {
              map.set(id, {
                id,
                title: p.name,
                subtitle: p.email ? `Direct Message • ${p.email}` : 'Registered Member',
                roleOrType: 'Direct Message',
                avatar: p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(p.name)}`,
                status: 'online',
              });
            }
          });
          return Array.from(map.values());
        });
      }
    });
  }, []);

  useEffect(() => {
    refreshConversations();

    const unsubscribe = subscribeToProfiles((newProfile) => {
      const currentProfile = getCurrentUserProfile();
      if (currentProfile) {
        if (newProfile.id === currentProfile.id || newProfile.name.toLowerCase() === currentProfile.name.toLowerCase()) return;
      }

      setConversations((prev) => {
        const id = `conv-acc-${newProfile.id}`;
        if (prev.some((c) => c.id === id || c.title.toLowerCase() === newProfile.name.toLowerCase())) {
          return prev;
        }

        const newConv: Conversation = {
          id,
          title: newProfile.name,
          subtitle: newProfile.email ? `Direct Message • ${newProfile.email}` : 'Registered Member',
          roleOrType: 'Direct Message',
          avatar: newProfile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(newProfile.name)}`,
          status: 'online',
        };

        return [newConv, ...prev];
      });
    });

    return () => {
      unsubscribe();
    };
  }, [refreshConversations]);

  const getConversation = useCallback(
    (id: string): Conversation | undefined => {
      return conversations.find((c) => c.id === id);
    },
    [conversations]
  );

  const startChat = useCallback(
    (
      title: string,
      subtitle?: string,
      avatar?: string,
      targetUserId?: string,
      activeUserId?: string
    ): Conversation => {
      const cleanTitle = title.trim();

      let convId = `conv-user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      if (targetUserId && activeUserId) {
        convId = getDirectMessageConversationId(activeUserId, targetUserId);
      } else {
        const existing = conversations.find(
          (c) => c.title.toLowerCase() === cleanTitle.toLowerCase()
        );
        if (existing) return existing;
      }

      const existingById = conversations.find((c) => c.id === convId);
      if (existingById) return existingById;

      const newConv: Conversation = {
        id: convId,
        title: cleanTitle,
        subtitle: subtitle || 'Direct Message',
        roleOrType: 'Direct Message',
        avatar:
          avatar ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanTitle)}`,
        status: 'online',
      };

      const customList = getStoredCustomConversations();
      const updatedCustom = [newConv, ...customList];
      saveCustomConversations(updatedCustom);
      saveConversationDb(newConv);

      setConversations((prev) => [newConv, ...prev]);
      return newConv;
    },
    [conversations]
  );

  /**
   * Ensures a conversation exists locally for the given ID.
   * Called when a realtime message arrives — the conversationId in the message
   * may not yet be in the local list, which would cause the chat window to render null.
   * If the conversation already exists, this is a no-op.
   */
  const ensureConversation = useCallback(
    (conversationId: string, senderName: string, senderAvatar?: string): Conversation => {
      // Read current conversations synchronously via ref
      const current = conversationsRef.current;
      const existing = current.find((c) => c.id === conversationId);
      if (existing) return existing;

      const newConv: Conversation = {
        id: conversationId,
        title: senderName,
        subtitle: 'Direct Message',
        roleOrType: 'Direct Message',
        avatar:
          senderAvatar ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(senderName)}`,
        status: 'online',
      };

      const customList = getStoredCustomConversations();
      const alreadySaved = customList.some((c) => c.id === conversationId);
      if (!alreadySaved) {
        saveCustomConversations([newConv, ...customList]);
      }
      setConversations((prev) => {
        if (prev.some((c) => c.id === conversationId)) return prev;
        return [newConv, ...prev];
      });

      return newConv;
    },
    []
  );

  return {
    conversations,
    getConversation,
    startChat,
    ensureConversation,
    refreshConversations,
  };
}
