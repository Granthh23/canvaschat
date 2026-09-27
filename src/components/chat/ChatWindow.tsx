'use client';

import React from 'react';
import { CanvasWindow, WindowBounds } from '@/types/canvas';
import { Conversation, Message } from '@/types/chat';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useWindowInteraction } from '@/hooks/useWindowInteraction';
import { motion } from 'motion/react';

interface ChatWindowProps {
  window: CanvasWindow;
  conversation: Conversation;
  messages: Message[];
  isTyping?: boolean;
  isActive: boolean;
  isHighlighted?: boolean;
  onFocus: () => void;
  onMinimize: () => void;
  onClose: () => void;
  onToggleMaximize: (id: string, viewportWidth: number, viewportHeight: number) => void;
  onCommitPosition: (id: string, x: number, y: number) => void;
  onCommitBounds: (id: string, bounds: WindowBounds) => void;
  onSendMessage: (conversationId: string, text: string) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
}

export function ChatWindow({
  window: win,
  conversation,
  messages,
  isTyping,
  isActive,
  isHighlighted,
  onFocus,
  onMinimize,
  onClose,
  onToggleMaximize,
  onCommitPosition,
  onCommitBounds,
  onSendMessage,
  onToggleReaction,
}: ChatWindowProps) {
  const {
    bounds,
    isDragging,
    isResizing,
    handleDragPointerDown,
    handleResizePointerDown,
  } = useWindowInteraction({
    id: win.id,
    initialBounds: {
      x: win.x,
      y: win.y,
      width: win.width,
      height: win.height,
    },
    isMaximized: win.isMaximized,
    onCommitPosition,
    onCommitBounds,
    onFocus,
  });

  if (win.minimized) {
    return null;
  }

  const handleWindowPointerDown = () => {
    onFocus();
  };

  const handleToggleMax = () => {
    onToggleMaximize(win.id, window.innerWidth, window.innerHeight);
  };

  return (
    <motion.div
      layoutId={`window-container-${win.id}`}
      initial={{ opacity: 0, scale: 0.9, y: 15 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
      }}
      exit={{ opacity: 0, scale: 0.85, y: 15 }}
      transition={{
        type: 'spring',
        stiffness: 350,
        damping: 26,
        mass: 0.8,
      }}
      onPointerDown={handleWindowPointerDown}
      style={{
        position: 'absolute',
        left: `${bounds.x}px`,
        top: `${bounds.y}px`,
        width: `${bounds.width}px`,
        height: `${bounds.height}px`,
        zIndex: win.zIndex,
      }}
      className={`group flex flex-col rounded-2xl bg-zinc-900/95 backdrop-blur-xl border select-none overflow-hidden transition-all duration-300 ${
        isActive
          ? 'border-zinc-700 shadow-2xl shadow-black/80 ring-1 ring-blue-500/40'
          : 'border-zinc-800/80 shadow-xl shadow-black/60 hover:border-zinc-700/60'
      } ${
        isHighlighted
          ? 'ring-4 ring-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.7)] animate-pulse'
          : ''
      } ${isDragging ? 'opacity-95 shadow-2xl cursor-grabbing' : ''} ${
        isResizing ? 'ring-2 ring-blue-500/70' : ''
      }`}
    >
      {/* Window Header / Titlebar */}
      <ChatHeader
        conversation={conversation}
        isMaximized={win.isMaximized}
        isActive={isActive}
        onMinimize={onMinimize}
        onToggleMaximize={handleToggleMax}
        onClose={onClose}
        onDragPointerDown={handleDragPointerDown}
      />

      {/* Message History Body */}
      <MessageList
        messages={messages}
        isTyping={isTyping}
        peerTitle={conversation.title}
        onToggleReaction={onToggleReaction}
      />

      {/* Chat Message Input */}
      <MessageInput
        onSendMessage={(text) => onSendMessage(conversation.id, text)}
      />

      {/* 8-Directional Resize Handles (Hidden if maximized) */}
      {!win.isMaximized && (
        <>
          {/* Edge handles */}
          <div
            onPointerDown={(e) => handleResizePointerDown('n', e)}
            className="absolute top-0 left-3 right-3 h-1.5 cursor-ns-resize z-20"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown('s', e)}
            className="absolute bottom-0 left-3 right-3 h-1.5 cursor-ns-resize z-20"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown('w', e)}
            className="absolute left-0 top-3 bottom-3 w-1.5 cursor-ew-resize z-20"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown('e', e)}
            className="absolute right-0 top-3 bottom-3 w-1.5 cursor-ew-resize z-20"
          />

          {/* Corner handles */}
          <div
            onPointerDown={(e) => handleResizePointerDown('nw', e)}
            className="absolute top-0 left-0 w-3 h-3 cursor-nwse-resize z-30"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown('ne', e)}
            className="absolute top-0 right-0 w-3 h-3 cursor-nesw-resize z-30"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown('sw', e)}
            className="absolute bottom-0 left-0 w-3 h-3 cursor-nesw-resize z-30"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown('se', e)}
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-30 flex items-end justify-end p-0.5"
          >
            {/* Visual resize corner indicator */}
            <div className="w-1.5 h-1.5 border-r border-b border-zinc-500/60 rounded-br-xs" />
          </div>
        </>
      )}
    </motion.div>
  );
}
