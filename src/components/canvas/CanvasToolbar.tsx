'use client';

/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { Plus, LayoutGrid, RotateCcw, MessagesSquare, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface CanvasToolbarProps {
  activeCount: number;
  totalCount: number;
  onOpenNewChat: () => void;
  onCascade: () => void;
  onReset: () => void;
  onOpenAuth: () => void;
}

export function CanvasToolbar({
  activeCount,
  totalCount,
  onOpenNewChat,
  onCascade,
  onReset,
  onOpenAuth,
}: CanvasToolbarProps) {
  const { profile } = useAuth();

  return (
    <header className="fixed top-3 left-3 right-3 md:top-4 md:left-4 md:right-4 z-40 pointer-events-none flex items-center justify-between">
      {/* Brand Identity / Logo */}
      <div className="pointer-events-auto flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-zinc-900/85 backdrop-blur-xl border border-zinc-700/60 shadow-xl shadow-black/40">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
          <MessagesSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-bold text-xs sm:text-sm tracking-tight text-white">
              CanvasChat
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Live DB & Sync
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] text-zinc-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>
              {activeCount} active {activeCount === 1 ? 'window' : 'windows'}
              {totalCount > activeCount ? ` (${totalCount - activeCount} minimized)` : ''}
            </span>
          </span>
        </div>
      </div>

      {/* Canvas Actions & User Profile */}
      <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
        {/* User Account / Identity Switcher */}
        <button
          onClick={onOpenAuth}
          title="Account Identity & Login"
          className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-zinc-900/85 hover:bg-zinc-800/90 text-zinc-200 border border-zinc-700/60 backdrop-blur-xl text-xs font-medium transition-all shadow-lg active:scale-95 cursor-pointer"
        >
          {profile?.avatar ? (
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-5 h-5 rounded-full object-cover ring-1 ring-blue-500/60"
            />
          ) : (
            <User className="w-4 h-4 text-blue-400" />
          )}
          <span className="hidden sm:inline-block max-w-[100px] truncate text-xs">
            {profile?.name || 'Account'}
          </span>
        </button>

        {/* Cascade button */}
        <button
          onClick={onCascade}
          title="Cascade and organize windows"
          className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900/85 hover:bg-zinc-800/90 text-zinc-300 hover:text-white border border-zinc-700/60 backdrop-blur-xl text-xs font-medium transition-all shadow-lg active:scale-95 cursor-pointer"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-zinc-400" />
          <span>Cascade</span>
        </button>

        {/* Reset Layout button */}
        <button
          onClick={onReset}
          title="Reset canvas positions to default"
          className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900/85 hover:bg-zinc-800/90 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60 backdrop-blur-xl text-xs font-medium transition-all shadow-lg active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>

        {/* Primary + New Chat Button */}
        <button
          onClick={onOpenNewChat}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-blue-600/30 transition-all transform hover:scale-[1.02] active:scale-95 border border-blue-400/30 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>+ New Chat</span>
        </button>
      </div>
    </header>
  );
}
