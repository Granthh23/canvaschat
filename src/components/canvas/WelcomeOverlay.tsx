'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, MessageSquare, ArrowRight, ShieldCheck, Zap, Layers } from 'lucide-react';

interface WelcomeOverlayProps {
  onOpenAuthTab: (tab: 'signin' | 'signup' | 'guest') => void;
}

export function WelcomeOverlay({ onOpenAuthTab }: WelcomeOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-md select-none overflow-y-auto"
    >
      {/* Radial Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/20 via-indigo-600/20 to-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphic Hero Card */}
      <motion.div
        initial={{ y: 25, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25, delay: 0.05 }}
        className="relative max-w-xl w-full p-6 sm:p-8 rounded-3xl bg-zinc-900/90 border border-zinc-700/80 shadow-2xl shadow-black/80 flex flex-col items-center text-center backdrop-blur-2xl"
      >
        {/* Top Badge */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Infinite Spatial Communication</span>
        </motion.div>

        {/* Hero Headline */}
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-3 leading-tight font-sans">
          Welcome to <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">CanvasChat</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-zinc-300 max-w-md leading-relaxed mb-6">
          Experience chat windows as interactive spatial nodes on an infinite canvas. Drag, resize, minimize into floating chat heads, and sync live with Supabase WebSockets.
        </p>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full mb-8 text-left">
          <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col gap-1">
            <div className="w-7 h-7 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-zinc-200">Spatial Windows</span>
            <span className="text-[10px] text-zinc-400">Movable & resizable</span>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col gap-1">
            <div className="w-7 h-7 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-zinc-200">Live Sync</span>
            <span className="text-[10px] text-zinc-400">Supabase WebSockets</span>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col gap-1">
            <div className="w-7 h-7 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-zinc-200">Multi-User Auth</span>
            <span className="text-[10px] text-zinc-400">Real identity & avatars</span>
          </div>
        </div>

        {/* Primary Call To Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            onClick={() => onOpenAuthTab('signup')}
            className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all transform hover:scale-[1.02] active:scale-95 border border-blue-400/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Create Account to Start</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onOpenAuthTab('signin')}
            className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-zinc-800/90 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs sm:text-sm font-medium border border-zinc-700/80 transition-all active:scale-95 cursor-pointer"
          >
            Sign In
          </button>

          <button
            onClick={() => onOpenAuthTab('guest')}
            className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-zinc-950 hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 text-xs font-medium border border-zinc-800 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Quick Identity</span>
          </button>
        </div>

        <span className="text-[10px] text-zinc-500 mt-4">
          Create an account or pick a quick handle to join the canvas live
        </span>
      </motion.div>
    </motion.div>
  );
}
