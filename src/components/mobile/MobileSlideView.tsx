'use client';

/* eslint-disable @next/next/no-img-element */
import React, { useState, useCallback } from 'react';
import { CanvasWindow } from '@/types/canvas';
import { Conversation, Message } from '@/types/chat';
import { MessageList } from '../chat/MessageList';
import { MessageInput } from '../chat/MessageInput';
import { useAuth } from '@/context/AuthContext';
import {
  Plus, X, Minus, Sparkles, Users, MessageSquare,
  ChevronLeft, Grid3x3, LogIn, UserPlus, User,
  LayoutGrid, RotateCcw, ArrowRight, ShieldCheck, Zap, Layers,
  LogOut, MessageCircle,
} from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';

interface MobileSlideViewProps {
  windows: CanvasWindow[];
  conversations?: Conversation[];
  getConversationMessages: (conversationId: string) => Message[];
  typingStates: Record<string, boolean>;
  onSendMessage: (conversationId: string, text: string) => void;
  onOpenNewChat: () => void;
  onCloseWindow: (windowId: string) => void;
  onMinimizeWindow: (windowId: string) => void;
  onRestoreWindow: (windowId: string) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  onOpenAuth: (tab: 'signin' | 'signup' | 'guest') => void;
  onCascade?: () => void;
  onReset?: () => void;
}

function MobileAuthScreen({ onOpenAuth }: { onOpenAuth: (tab: 'signin' | 'signup' | 'guest') => void }) {
  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-4 py-6 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-tr from-blue-600/20 via-indigo-600/15 to-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        className="relative flex flex-col items-center text-center">
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-20 h-20 rounded-3xl mb-5 flex items-center justify-center shadow-2xl shadow-blue-900/40"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
          <MessageSquare className="w-9 h-9 text-white" />
        </motion.div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-[10px] font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="w-3 h-3" /> Spatial Chat Platform
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight leading-tight mb-2">
          Welcome to <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">CanvasChat</span>
        </h1>
        <p className="text-xs text-zinc-400 leading-relaxed mb-7 max-w-xs">
          Real-time chat with live WebSocket sync, emoji reactions, typing indicators, and multi-user identity.
        </p>
        <div className="grid grid-cols-3 gap-2 w-full mb-8">
          {[
            { icon: Layers, label: 'Swipeable Cards', sub: 'Card-based chats' },
            { icon: Zap, label: 'Live Sync', sub: 'Supabase RT' },
            { icon: ShieldCheck, label: 'Multi-User', sub: 'Real identity' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex flex-col gap-1 p-3 rounded-2xl text-left"
              style={{ background: 'rgba(24,24,27,0.8)', border: '1px solid rgba(63,63,70,0.6)' }}>
              <div className="w-7 h-7 rounded-xl flex items-center justify-center mb-0.5"
                style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}>
                <Icon className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <span className="text-xs font-semibold text-zinc-200">{label}</span>
              <span className="text-[10px] text-zinc-500">{sub}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3 w-full">
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => onOpenAuth('signup')}
            className="w-full py-3.5 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 8px 24px rgba(59,130,246,0.4)' }}>
            <UserPlus className="w-4 h-4" /> Create Account <ArrowRight className="w-4 h-4" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => onOpenAuth('signin')}
            className="w-full py-3 rounded-2xl text-zinc-200 text-sm font-medium flex items-center justify-center gap-2 cursor-pointer"
            style={{ background: 'rgba(39,39,42,0.8)', border: '1px solid rgba(63,63,70,0.7)' }}>
            <LogIn className="w-4 h-4" /> Sign In
          </motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => onOpenAuth('guest')}
            className="w-full py-2.5 rounded-2xl text-zinc-400 text-xs font-medium flex items-center justify-center gap-2 cursor-pointer"
            style={{ border: '1px solid rgba(63,63,70,0.5)' }}>
            <MessageCircle className="w-3.5 h-3.5" /> Continue as Guest
          </motion.button>
        </div>
        <p className="text-[10px] text-zinc-600 mt-5">Create an account or use a guest handle to join live</p>
      </motion.div>
    </div>
  );
}

function ConversationDrawer({
  isOpen, onClose, activeWindows, minimizedWindows, conversations,
  activeIndex, onSelectIndex, onRestoreWindow, onOpenNewChat,
  onOpenAuth, onCascade, onReset,
}: {
  isOpen: boolean; onClose: () => void;
  activeWindows: CanvasWindow[]; minimizedWindows: CanvasWindow[];
  conversations: Conversation[]; activeIndex: number;
  onSelectIndex: (i: number) => void; onRestoreWindow: (id: string) => void;
  onOpenNewChat: () => void; onOpenAuth: (tab: 'signin' | 'signup' | 'guest') => void;
  onCascade?: () => void; onReset?: () => void;
}) {
  const { profile, isLoggedIn, signOut } = useAuth();
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }} className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm" onClick={onClose} />
          <motion.aside key="dr" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36, mass: 0.9 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-[82vw] max-w-[320px] flex flex-col overflow-hidden"
            style={{ background: 'linear-gradient(160deg,#18181b 0%,#111113 100%)', borderRight: '1px solid rgba(63,63,70,0.6)', boxShadow: '12px 0 48px rgba(0,0,0,0.65)' }}>
            {/* Profile Section */}
            <div className="shrink-0 px-4 pt-12 pb-4 border-b border-zinc-800/60">
              {isLoggedIn && profile ? (
                <div className="flex items-center gap-3">
                  <img src={profile.avatar} alt={profile.name} className="w-11 h-11 rounded-full object-cover ring-2 ring-blue-500/40 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-white truncate">{profile.name}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{profile.isGuest ? 'Guest Mode' : (profile.email || 'Registered')}</p>
                  </div>
                  <motion.button whileTap={{ scale: 0.88 }} onClick={() => { signOut(); onClose(); }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 cursor-pointer">
                    <LogOut className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <div><p className="font-bold text-sm text-white">CanvasChat</p><p className="text-[10px] text-zinc-500">Not signed in</p></div>
                  </div>
                  <div className="flex gap-2">
                    <motion.button whileTap={{ scale: 0.94 }} onClick={() => { onOpenAuth('signup'); onClose(); }}
                      className="flex-1 py-2 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                      style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
                      <UserPlus className="w-3 h-3" /> Sign Up
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.94 }} onClick={() => { onOpenAuth('signin'); onClose(); }}
                      className="flex-1 py-2 rounded-xl text-zinc-200 text-xs font-medium flex items-center justify-center gap-1 cursor-pointer"
                      style={{ background: 'rgba(39,39,42,0.8)', border: '1px solid rgba(63,63,70,0.6)' }}>
                      <LogIn className="w-3 h-3" /> Sign In
                    </motion.button>
                  </div>
                  <motion.button whileTap={{ scale: 0.94 }} onClick={() => { onOpenAuth('guest'); onClose(); }}
                    className="w-full py-2 rounded-xl text-zinc-500 text-xs font-medium flex items-center justify-center gap-1 cursor-pointer"
                    style={{ border: '1px solid rgba(63,63,70,0.4)' }}>
                    <User className="w-3 h-3" /> Continue as Guest
                  </motion.button>
                </div>
              )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto py-3" style={{ scrollbarWidth: 'none' }}>
              {activeWindows.length > 0 && (
                <div className="px-4 mb-4">
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-600 mb-2 px-1">Active · {activeWindows.length}</p>
                  <div className="flex flex-col gap-1">
                    {activeWindows.map((win, idx) => {
                      const conv = conversations.find((c) => c.id === win.conversationId);
                      if (!conv) return null;
                      const isSel = idx === activeIndex;
                      return (
                        <motion.button key={win.id} whileTap={{ scale: 0.97 }} onClick={() => { onSelectIndex(idx); onClose(); }}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left w-full transition-all cursor-pointer ${isSel ? 'bg-blue-600/15 border border-blue-500/30' : 'hover:bg-zinc-800/60 border border-transparent'}`}>
                          <div className="relative shrink-0">
                            <img src={conv.avatar} alt={conv.title} className="w-9 h-9 rounded-full object-cover ring-1 ring-zinc-700" />
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-zinc-900" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-semibold truncate ${isSel ? 'text-blue-300' : 'text-zinc-200'}`}>{conv.title}</p>
                            <p className="text-[11px] text-zinc-500 truncate">{conv.subtitle}</p>
                          </div>
                          {isSel && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
              {minimizedWindows.length > 0 && (
                <div className="px-4 mb-4">
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-600 mb-2 px-1">Minimized · {minimizedWindows.length}</p>
                  <div className="flex flex-col gap-1">
                    {minimizedWindows.map((win) => {
                      const conv = conversations.find((c) => c.id === win.conversationId);
                      if (!conv) return null;
                      return (
                        <motion.button key={win.id} whileTap={{ scale: 0.97 }} onClick={() => { onRestoreWindow(win.id); onClose(); }}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800/60 border border-transparent w-full transition-all cursor-pointer">
                          <img src={conv.avatar} alt={conv.title} className="w-9 h-9 rounded-full object-cover ring-1 ring-zinc-700 opacity-60 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-zinc-400 truncate">{conv.title}</p>
                            <p className="text-[11px] text-zinc-600">Tap to restore</p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
              {activeWindows.length === 0 && minimizedWindows.length === 0 && (
                <div className="flex flex-col items-center justify-center px-6 text-center py-8">
                  <MessageSquare className="w-8 h-8 text-zinc-700 mb-2" />
                  <p className="text-sm text-zinc-500">No conversations open</p>
                </div>
              )}
              {(onCascade || onReset) && (
                <div className="px-4 mb-4">
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-600 mb-2 px-1">Canvas Actions</p>
                  <div className="flex flex-col gap-1">
                    {onCascade && (
                      <motion.button whileTap={{ scale: 0.97 }} onClick={() => { onCascade(); onClose(); }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800/60 border border-transparent w-full transition-all cursor-pointer">
                        <div className="w-8 h-8 rounded-xl bg-zinc-800/80 flex items-center justify-center shrink-0"><LayoutGrid className="w-4 h-4 text-zinc-400" /></div>
                        <div className="min-w-0"><p className="text-sm font-medium text-zinc-300">Cascade Chats</p><p className="text-[11px] text-zinc-600">Re-arrange all open windows</p></div>
                      </motion.button>
                    )}
                    {onReset && (
                      <motion.button whileTap={{ scale: 0.97 }} onClick={() => { onReset(); onClose(); }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800/60 border border-transparent w-full transition-all cursor-pointer">
                        <div className="w-8 h-8 rounded-xl bg-zinc-800/80 flex items-center justify-center shrink-0"><RotateCcw className="w-4 h-4 text-zinc-400" /></div>
                        <div className="min-w-0"><p className="text-sm font-medium text-zinc-300">Reset Layout</p><p className="text-[11px] text-zinc-600">Restore default positions</p></div>
                      </motion.button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 p-4 border-t border-zinc-800/60">
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => { onOpenNewChat(); onClose(); }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-white text-sm font-semibold cursor-pointer"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 4px 16px rgba(59,130,246,0.3)' }}>
                <Plus className="w-4 h-4" /> New Conversation
              </motion.button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function ChatCard({
  window: win, conversation, messages, isTyping, direction,
  onMinimize, onClose, onSendMessage, onToggleReaction,
}: {
  window: CanvasWindow; conversation: Conversation; messages: Message[];
  isTyping: boolean; direction: number; onMinimize: () => void; onClose: () => void;
  onSendMessage: (convId: string, text: string) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
}) {
  return (
    <motion.div key={win.id}
      initial={{ opacity: 0, x: direction * 60, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -direction * 60, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 420, damping: 38 }}
      className="absolute inset-0 flex flex-col rounded-2xl overflow-hidden"
      style={{ background: 'linear-gradient(160deg,#1c1c1f 0%,#18181b 100%)', border: '1px solid rgba(63,63,70,0.7)', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
      <div className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(63,63,70,0.6)', background: 'rgba(18,18,20,0.95)' }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <img src={conversation.avatar} alt={conversation.title} className="w-9 h-9 rounded-full object-cover ring-1 ring-zinc-700" />
            {conversation.isAi ? (
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center"><Sparkles className="w-2.5 h-2.5 text-white" /></span>
            ) : conversation.isGroup ? (
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center"><Users className="w-2.5 h-2.5 text-white" /></span>
            ) : (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-zinc-900" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-white truncate">{conversation.title}</span>
              {conversation.isAi && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold shrink-0">AI</span>}
            </div>
            <span className="text-[11px] truncate block">
              {isTyping ? <span className="text-emerald-400 font-medium">typing…</span> : <span className="text-zinc-500">{conversation.subtitle}</span>}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <motion.button whileTap={{ scale: 0.85 }} onClick={onMinimize} className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors cursor-pointer"><Minus className="w-3.5 h-3.5" /></motion.button>
          <motion.button whileTap={{ scale: 0.85 }} onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"><X className="w-3.5 h-3.5" /></motion.button>
        </div>
      </div>
      <MessageList messages={messages} isTyping={isTyping} peerTitle={conversation.title} onToggleReaction={onToggleReaction} />
      <MessageInput onSendMessage={(text) => onSendMessage(conversation.id, text)} />
    </motion.div>
  );
}

function SlideDots({ total, current, onSelect }: { total: number; current: number; onSelect: (i: number) => void }) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1.5 py-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <motion.button key={i} onClick={() => onSelect(i)}
          animate={{ width: i === current ? 20 : 6, backgroundColor: i === current ? '#3b82f6' : '#3f3f46' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="h-1.5 rounded-full cursor-pointer" aria-label={`Chat ${i + 1}`} />
      ))}
    </div>
  );
}

export function MobileSlideView({
  windows, conversations = [],
  getConversationMessages, typingStates,
  onSendMessage, onOpenNewChat,
  onCloseWindow, onMinimizeWindow, onRestoreWindow,
  onToggleReaction, onOpenAuth, onCascade, onReset,
}: MobileSlideViewProps) {
  const { profile, isLoggedIn } = useAuth();
  const activeWindows = windows.filter((w) => !w.minimized);
  const minimizedWindows = windows.filter((w) => w.minimized);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const safeIndex = activeWindows.length === 0 ? 0 : Math.min(activeIndex, activeWindows.length - 1);
  const currentWindow = activeWindows[safeIndex];
  const currentConversation = currentWindow ? conversations.find((c) => c.id === currentWindow.conversationId) : undefined;

  const goTo = useCallback((idx: number) => {
    setDirection(idx > activeIndex ? 1 : -1);
    setActiveIndex(Math.max(0, Math.min(idx, activeWindows.length - 1)));
  }, [activeIndex, activeWindows.length]);

  const goNext = useCallback(() => {
    if (activeWindows.length <= 1) return;
    setDirection(1);
    setActiveIndex((p) => (p < activeWindows.length - 1 ? p + 1 : 0));
  }, [activeWindows.length]);

  const goPrev = useCallback(() => {
    if (activeWindows.length <= 1) return;
    setDirection(-1);
    setActiveIndex((p) => (p > 0 ? p - 1 : activeWindows.length - 1));
  }, [activeWindows.length]);

  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
    if (info.offset.x < -60) goNext();
    else if (info.offset.x > 60) goPrev();
  }, [goNext, goPrev]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden text-zinc-100" style={{ background: '#0d0d0f' }}>
      {/* Top Bar */}
      <header className="shrink-0 flex items-center justify-between px-4"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)', paddingBottom: 12, background: 'rgba(13,13,15,0.96)', borderBottom: '1px solid rgba(39,39,42,0.8)', backdropFilter: 'blur(16px)' }}>
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => setIsDrawerOpen(true)}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800/70 transition-colors cursor-pointer">
            <Grid3x3 className="w-[18px] h-[18px]" />
            {minimizedWindows.length > 0 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-[#0d0d0f]" />
            )}
          </motion.button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="font-bold text-[13px] text-white leading-none tracking-tight">CanvasChat</p>
              {isLoggedIn && activeWindows.length > 0
                ? <p className="text-[10px] text-zinc-500 leading-none mt-0.5">{safeIndex + 1} of {activeWindows.length}</p>
                : !isLoggedIn
                  ? <p className="text-[10px] text-zinc-600 leading-none mt-0.5">Not signed in</p>
                  : null}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              {activeWindows.length > 0 && (
                <motion.button whileTap={{ scale: 0.92 }} onClick={onOpenNewChat}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-semibold cursor-pointer"
                  style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
                  <Plus className="w-3.5 h-3.5" /> New
                </motion.button>
              )}
              <motion.button whileTap={{ scale: 0.88 }} onClick={() => setIsDrawerOpen(true)}
                className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-blue-500/30 cursor-pointer shrink-0">
                <img src={profile!.avatar} alt={profile!.name} className="w-full h-full object-cover" />
              </motion.button>
            </>
          ) : (
            <motion.button whileTap={{ scale: 0.92 }} onClick={() => onOpenAuth('signup')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-semibold cursor-pointer"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
              <UserPlus className="w-3.5 h-3.5" /> Join
            </motion.button>
          )}
        </div>
      </header>

      {/* Body */}
      {!isLoggedIn ? (
        <MobileAuthScreen onOpenAuth={onOpenAuth} />
      ) : (
        <div className="flex-1 relative overflow-hidden flex flex-col px-3 pt-2.5 pb-1">
          {activeWindows.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <motion.div animate={{ y: [0, -7, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="w-16 h-16 rounded-3xl mb-5 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,rgba(59,130,246,0.1),rgba(99,102,241,0.1))', border: '1px solid rgba(59,130,246,0.18)', boxShadow: '0 0 40px rgba(59,130,246,0.08)' }}>
                <MessageSquare className="w-7 h-7 text-blue-400" />
              </motion.div>
              <h3 className="text-base font-bold text-zinc-200 mb-2">Hey {profile?.name?.split(' ')[0]}! 👋</h3>
              <p className="text-xs text-zinc-500 mb-6 leading-relaxed max-w-[220px]">Open a conversation or start a new chat to begin.</p>
              <motion.button whileTap={{ scale: 0.95 }} onClick={onOpenNewChat}
                className="px-6 py-3 rounded-2xl text-white text-sm font-semibold cursor-pointer"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 8px 24px rgba(59,130,246,0.35)' }}>
                + Start a Chat
              </motion.button>
            </motion.div>
          ) : (
            <motion.div className="flex-1 relative" drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.15} onDragEnd={handleDragEnd} style={{ touchAction: 'pan-y' }}>
              <AnimatePresence mode="wait" initial={false}>
                {currentWindow && currentConversation && (
                  <ChatCard key={currentWindow.id} window={currentWindow} conversation={currentConversation}
                    messages={getConversationMessages(currentWindow.conversationId)}
                    isTyping={Boolean(typingStates[currentWindow.conversationId])}
                    direction={direction}
                    onMinimize={() => onMinimizeWindow(currentWindow.id)}
                    onClose={() => onCloseWindow(currentWindow.id)}
                    onSendMessage={onSendMessage} onToggleReaction={onToggleReaction} />
                )}
              </AnimatePresence>
            </motion.div>
          )}
          <SlideDots total={activeWindows.length} current={safeIndex} onSelect={goTo} />
        </div>
      )}

      {/* Bottom Tab Bar */}
      {isLoggedIn && (
        <div className="shrink-0 flex items-stretch"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 6px)', background: 'rgba(13,13,15,0.96)', borderTop: '1px solid rgba(39,39,42,0.7)', backdropFilter: 'blur(16px)' }}>
          <motion.button whileTap={{ scale: 0.88 }} onClick={goPrev} disabled={activeWindows.length <= 1} className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-zinc-500 disabled:opacity-25 cursor-pointer">
            <ChevronLeft className="w-5 h-5" /><span className="text-[10px] font-medium">Prev</span>
          </motion.button>
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => setIsDrawerOpen(true)} className="flex-1 flex flex-col items-center justify-center gap-1 py-3 cursor-pointer" style={{ color: '#3b82f6' }}>
            <div className="relative">
              <MessageSquare className="w-5 h-5" />
              {windows.length > 0 && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 flex items-center justify-center px-0.5 rounded-full bg-blue-500 text-[8px] font-bold text-white leading-none">
                  {windows.length}
                </motion.span>
              )}
            </div>
            <span className="text-[10px] font-semibold">Chats</span>
          </motion.button>
          <motion.button whileTap={{ scale: 0.88 }} onClick={goNext} disabled={activeWindows.length <= 1} className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-zinc-500 disabled:opacity-25 cursor-pointer">
            <ChevronLeft className="w-5 h-5 rotate-180" /><span className="text-[10px] font-medium">Next</span>
          </motion.button>
        </div>
      )}

      {/* Drawer */}
      <ConversationDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}
        activeWindows={activeWindows} minimizedWindows={minimizedWindows} conversations={conversations}
        activeIndex={safeIndex} onSelectIndex={goTo} onRestoreWindow={onRestoreWindow}
        onOpenNewChat={onOpenNewChat} onOpenAuth={onOpenAuth} onCascade={onCascade} onReset={onReset} />
    </div>
  );
}
