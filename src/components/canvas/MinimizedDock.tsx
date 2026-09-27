'use client';

/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { CanvasWindow } from '@/types/canvas';
import { Conversation } from '@/types/chat';
import { ArrowUpRight, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MinimizedDockProps {
  minimizedWindows: CanvasWindow[];
  conversations?: Conversation[];
  onRestore: (windowId: string) => void;
}

export function MinimizedDock({ minimizedWindows, conversations = [], onRestore }: MinimizedDockProps) {
  if (minimizedWindows.length === 0) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 max-w-full px-4 pointer-events-none">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="pointer-events-auto flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/80 shadow-2xl shadow-black/80"
      >
        <div className="px-2.5 py-1 text-[11px] font-medium text-zinc-400 border-r border-zinc-800 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
          <span>Minimized ({minimizedWindows.length})</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[80vw] py-0.5">
          <AnimatePresence>
            {minimizedWindows.map((win) => {
              const conv = conversations.find((c) => c.id === win.conversationId);
              if (!conv) return null;

              return (
                <motion.button
                  key={win.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onRestore(win.id)}
                  title={`Restore ${conv.title}`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/50 hover:border-zinc-600 transition-all text-left group cursor-pointer"
                >
                  <img
                    src={conv.avatar}
                    alt={conv.title}
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-zinc-600"
                  />
                  <span className="text-xs font-medium text-zinc-200 group-hover:text-white truncate max-w-[120px]">
                    {conv.title}
                  </span>
                  <ArrowUpRight className="w-3 h-3 text-zinc-400 group-hover:text-blue-400 transition-colors" />
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
