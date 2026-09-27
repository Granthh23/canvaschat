'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Message } from '@/types/chat';
import { motion, AnimatePresence } from 'motion/react';
import { Smile, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CURRENT_USER } from '@/lib/mock-data';
import { useAuth } from '@/context/AuthContext';

interface MessageListProps {
  messages: Message[];
  isTyping?: boolean;
  peerTitle: string;
  onToggleReaction?: (messageId: string, emoji: string) => void;
}

const QUICK_REACTION_EMOJIS = ['👍', '❤️', '😂', '🔥', '🚀', '🎉', '✨'];

export function MessageList({
  messages,
  isTyping,
  peerTitle,
  onToggleReaction,
}: MessageListProps) {
  const { profile } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

  // Auto-scroll to bottom on message list change or typing change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const handleReact = (messageId: string, emoji: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Trigger celebration confetti for special emojis
    if (['🎉', '🔥', '✨', '🚀'].includes(emoji)) {
      try {
        confetti({
          particleCount: 25,
          spread: 50,
          origin: { y: 0.7 },
          colors: ['#3b82f6', '#ec4899', '#8b5cf6', '#eab308'],
        });
      } catch {
        // ignore if confetti fails
      }
    }

    if (onToggleReaction) {
      onToggleReaction(messageId, emoji);
    }
  };

  const activeUserId = profile?.id;
  const activeUserName = profile?.name;

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-3.5 space-y-4 scroll-smooth text-sm relative"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#3f3f46 transparent',
      }}
    >
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs py-8">
          <p className="font-medium text-zinc-400">No messages yet.</p>
          <p className="mt-1 text-zinc-600 text-[11px]">
            Send a message below to start chatting on the canvas.
          </p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {messages.map((message) => {
            const isUser =
              message.senderId === 'user' ||
              (activeUserId && message.senderId === activeUserId) ||
              (activeUserName && message.senderName?.toLowerCase() === activeUserName.toLowerCase());
            const isHovered = hoveredMessageId === message.id;
            const reactions = message.reactions ?? [];

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                onMouseEnter={() => setHoveredMessageId(message.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
                className={`relative flex flex-col group ${
                  isUser ? 'items-end' : 'items-start'
                }`}
              >
                {!isUser && (
                  <span className="text-[11px] font-semibold text-zinc-400 mb-1 ml-1 flex items-center gap-1">
                    {message.senderName}
                  </span>
                )}

                {/* Floating Quick Emoji Reaction Bar on Hover */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.88 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.88 }}
                      transition={{ duration: 0.12 }}
                      className={`absolute -top-7 z-30 flex items-center gap-0.5 px-2 py-1 rounded-full bg-zinc-900/95 border border-zinc-700/80 shadow-xl backdrop-blur-md ${
                        isUser ? 'right-2' : 'left-2'
                      }`}
                    >
                      {QUICK_REACTION_EMOJIS.map((emoji) => (
                        <motion.button
                          key={emoji}
                          whileHover={{ scale: 1.35, y: -2 }}
                          whileTap={{ scale: 0.85 }}
                          onClick={(e) => handleReact(message.id, emoji, e)}
                          className="w-6 h-6 flex items-center justify-center text-xs rounded-full hover:bg-zinc-800 transition-transform cursor-pointer"
                          title={`React with ${emoji}`}
                        >
                          {emoji}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Main Message Text Bubble */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className={`relative max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words transition-shadow ${
                    isUser
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-xs shadow-md shadow-blue-900/20'
                      : 'bg-zinc-800/90 text-zinc-100 border border-zinc-700/60 rounded-2xl rounded-tl-xs shadow-sm'
                  }`}
                >
                  {message.text}
                </motion.div>

                {/* Message Reactions Badges Row */}
                {reactions.length > 0 && (
                  <div className={`flex flex-wrap gap-1 mt-1.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {reactions.map((reaction) => {
                      const hasUserReacted = reaction.users.includes(CURRENT_USER.id);

                      return (
                        <motion.button
                          key={reaction.emoji}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => handleReact(message.id, reaction.emoji, e)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all border cursor-pointer ${
                            hasUserReacted
                              ? 'bg-blue-600/30 border-blue-500/60 text-blue-300 font-semibold ring-1 ring-blue-500/40 shadow-sm'
                              : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-300 hover:bg-zinc-700/80 hover:border-zinc-600'
                          }`}
                        >
                          <span>{reaction.emoji}</span>
                          <span className="text-[11px] font-mono">{reaction.count}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {/* Time & Add Reaction Trigger */}
                <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-zinc-500">
                  <span>{formatTime(message.createdAt)}</span>
                  {isHovered && (
                    <button
                      type="button"
                      onClick={(e) => handleReact(message.id, '👍', e)}
                      className="text-zinc-400 hover:text-blue-400 transition-colors flex items-center gap-0.5"
                      title="Quick react"
                    >
                      <Plus className="w-3 h-3" /> React
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}

      {/* Typing indicator */}
      <AnimatePresence>
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-800/80 border border-zinc-700/50 rounded-2xl rounded-tl-xs w-fit text-xs text-zinc-300 shadow-sm"
          >
            <span className="text-[11px] font-medium text-zinc-300">{peerTitle} is typing</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
