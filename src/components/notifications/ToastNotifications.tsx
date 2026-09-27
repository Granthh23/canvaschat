'use client';

/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, MessageSquare, CheckCircle2, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  avatar?: string;
  type?: 'success' | 'info' | 'message';
}

interface ToastNotificationsProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastNotifications({ toasts, onDismiss }: ToastNotificationsProps) {
  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: -10, scale: 0.9, x: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="pointer-events-auto flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-blue-500/40 shadow-2xl shadow-blue-950/50 ring-1 ring-blue-500/30 overflow-hidden"
          >
            <div className="flex items-center gap-3 min-w-0">
              {toast.avatar ? (
                <img
                  src={toast.avatar}
                  alt={toast.title}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/50 shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  {toast.type === 'message' ? (
                    <MessageSquare className="w-4 h-4" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs text-zinc-100 truncate">
                    {toast.title}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping shrink-0" />
                </div>
                <p className="text-[11px] text-zinc-300 truncate mt-0.5">
                  {toast.message}
                </p>
              </div>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shrink-0 ml-2 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
