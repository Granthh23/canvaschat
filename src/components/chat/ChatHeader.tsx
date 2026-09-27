'use client';

/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { Conversation } from '@/types/chat';
import { Minus, X, Users, Sparkles, Maximize2, Minimize2 } from 'lucide-react';

interface ChatHeaderProps {
  conversation: Conversation;
  isMaximized?: boolean;
  isActive: boolean;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onClose: () => void;
  onDragPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
}

export function ChatHeader({
  conversation,
  isMaximized,
  isActive,
  onMinimize,
  onToggleMaximize,
  onClose,
  onDragPointerDown,
}: ChatHeaderProps) {
  return (
    <div
      onPointerDown={onDragPointerDown}
      className={`relative select-none flex items-center justify-between px-3.5 py-2.5 border-b transition-colors cursor-grab active:cursor-grabbing ${
        isActive
          ? 'bg-zinc-900/95 border-zinc-700/70 text-zinc-100'
          : 'bg-zinc-900/75 border-zinc-800/80 text-zinc-300'
      }`}
    >
      {/* Contact Information & Avatar */}
      <div className="flex items-center gap-2.5 min-w-0 pr-2">
        <div className="relative shrink-0">
          <img
            src={conversation.avatar}
            alt={conversation.title}
            className="w-7 h-7 rounded-full object-cover ring-1 ring-zinc-700"
          />
          {conversation.isAi ? (
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-indigo-500 rounded-full flex items-center justify-center text-[9px] text-white">
              <Sparkles className="w-2 h-2" />
            </span>
          ) : conversation.isGroup ? (
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center text-[9px] text-white">
              <Users className="w-2 h-2" />
            </span>
          ) : (
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full ring-1 ring-zinc-900" />
          )}
        </div>

        <div className="min-w-0 flex flex-col">
          <div className="flex items-center gap-1.5 leading-tight">
            <span className="font-semibold text-sm truncate tracking-tight text-zinc-100">
              {conversation.title}
            </span>
            {conversation.isAi && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                AI
              </span>
            )}
          </div>
          <span className="text-[11px] text-zinc-400 truncate leading-tight">
            {conversation.subtitle}
          </span>
        </div>
      </div>

      {/* Window Action Controls (Minimize, Maximize, Close) */}
      <div className="flex items-center gap-1 shrink-0 no-drag">
        {/* Minimize */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMinimize();
          }}
          title="Minimize window"
          aria-label="Minimize"
          className="w-6 h-6 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        {/* Maximize / Restore */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMaximize();
          }}
          title={isMaximized ? 'Restore down' : 'Maximize window'}
          aria-label={isMaximized ? 'Restore' : 'Maximize'}
          className="w-6 h-6 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          {isMaximized ? (
            <Minimize2 className="w-3.5 h-3.5" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Close */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          title="Close window (preserves messages)"
          aria-label="Close"
          className="w-6 h-6 rounded-md flex items-center justify-center text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
