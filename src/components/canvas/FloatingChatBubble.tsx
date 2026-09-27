'use client';

/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';
import { CanvasWindow } from '@/types/canvas';
import { Conversation, Message } from '@/types/chat';
import { motion, AnimatePresence } from 'motion/react';
import { Maximize2, X, Sparkles, MessageSquare } from 'lucide-react';

interface FloatingChatBubbleProps {
  window: CanvasWindow;
  conversation: Conversation;
  lastMessage?: Message;
  isTyping?: boolean;
  onRestore: (id: string) => void;
  onClose: (id: string) => void;
  onCommitPosition: (id: string, x: number, y: number) => void;
  onFocus: () => void;
}

export function FloatingChatBubble({
  window: win,
  conversation,
  lastMessage,
  isTyping,
  onRestore,
  onClose,
  onCommitPosition,
  onFocus,
}: FloatingChatBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = () => {
    onFocus();
  };

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number; y: number } }
  ) => {
    setIsDragging(false);
    const newX = win.x + info.offset.x;
    const newY = win.y + info.offset.y;
    onCommitPosition(win.id, newX, newY);
  };

  return (
    <motion.div
      layoutId={`window-container-${win.id}`}
      drag
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      onPointerDown={handlePointerDown}
      initial={{ scale: 0, opacity: 0, y: 20 }}
      animate={{
        scale: 1,
        opacity: 1,
        y: [0, -5, 0],
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        y: {
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        },
        scale: { type: 'spring', stiffness: 400, damping: 25 },
        opacity: { duration: 0.2 },
      }}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.94 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{
        position: 'absolute',
        left: `${win.x}px`,
        top: `${win.y}px`,
        zIndex: win.zIndex + 50,
      }}
      className="relative group cursor-grab active:cursor-grabbing select-none"
    >
      {/* Outer Glowing Circle Border */}
      <div
        onClick={() => {
          if (!isDragging) onRestore(win.id);
        }}
        className={`relative w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr transition-all duration-300 shadow-2xl ${
          conversation.isAi
            ? 'from-purple-600 via-indigo-500 to-pink-500 shadow-purple-500/30'
            : 'from-blue-600 via-indigo-600 to-cyan-400 shadow-blue-500/30'
        } ${isHovered ? 'ring-4 ring-blue-400/40 shadow-blue-500/50' : ''}`}
      >
        {/* Inner Avatar Container */}
        <div className="w-full h-full rounded-full bg-zinc-950 p-1 flex items-center justify-center overflow-hidden relative">
          <img
            src={conversation.avatar}
            alt={conversation.title}
            className="w-full h-full rounded-full object-cover pointer-events-none"
          />

          {/* Typing Wave Animation */}
          {isTyping && (
            <div className="absolute inset-0 bg-blue-950/70 backdrop-blur-xs flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>

        {/* Status indicator dot */}
        <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-zinc-950 p-0.5 flex items-center justify-center">
          {conversation.isAi ? (
            <div className="w-full h-full rounded-full bg-purple-500 flex items-center justify-center text-[8px] text-white">
              <Sparkles className="w-2.5 h-2.5" />
            </div>
          ) : (
            <div
              className={`w-full h-full rounded-full ${
                conversation.status === 'online'
                  ? 'bg-emerald-500 ring-2 ring-emerald-500/30 animate-pulse'
                  : conversation.status === 'away'
                  ? 'bg-amber-500'
                  : 'bg-zinc-500'
              }`}
            />
          )}
        </div>

        {/* Quick Close Button (X) on Hover */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose(win.id);
          }}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-rose-600 hover:border-rose-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md z-20 cursor-pointer"
          title="Close conversation"
        >
          <X className="w-3 h-3" />
        </button>

        {/* Restoring indicator icon badge */}
        <div className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-zinc-900 border border-zinc-700 text-blue-400 flex items-center justify-center shadow-md">
          <Maximize2 className="w-2.5 h-2.5" />
        </div>
      </div>

      {/* Popover Preview Card on Hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-64 p-3 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/80 shadow-2xl text-left pointer-events-none z-50 flex flex-col gap-1.5"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-zinc-100 truncate max-w-[140px]">
                  {conversation.title}
                </span>
                {conversation.isAi && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-purple-500/20 text-purple-300 rounded-md border border-purple-500/30">
                    AI
                  </span>
                )}
              </div>
              <span className="text-[10px] text-blue-400 font-medium flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Tap to open
              </span>
            </div>

            {lastMessage ? (
              <p className="text-[11px] text-zinc-300 line-clamp-2 leading-relaxed italic">
                &ldquo;{lastMessage.text}&rdquo;
              </p>
            ) : (
              <p className="text-[11px] text-zinc-500 italic">No recent messages</p>
            )}

            <div className="text-[9px] text-zinc-500 text-right font-mono pt-0.5">
              Minimized floating chat head
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
