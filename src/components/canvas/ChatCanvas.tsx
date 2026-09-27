'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useCanvasState } from '@/hooks/useCanvasState';
import { useMessages } from '@/hooks/useMessages';
import { useConversations } from '@/hooks/useConversations';
import { useIsClient } from '@/hooks/useIsClient';
import { CanvasGridBackground } from './CanvasGridBackground';
import { CanvasToolbar } from './CanvasToolbar';
import { ChatWindow } from '../chat/ChatWindow';
import { FloatingChatBubble } from './FloatingChatBubble';
import { MinimizedDock } from './MinimizedDock';
import { NewChatModal } from '../chat/NewChatModal';
import { MobileSlideView } from '../mobile/MobileSlideView';
import { ToastNotifications, ToastItem } from '../notifications/ToastNotifications';
import { MessageSquarePlus } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { AuthModal } from '../auth/AuthModal';
import { WelcomeOverlay } from './WelcomeOverlay';
import { useAuth } from '@/context/AuthContext';

export function ChatCanvas() {
  const isClient = useIsClient();
  const { profile, isLoggedIn } = useAuth();
  const { conversations, getConversation, startChat, ensureConversation } = useConversations();

  const {
    windows,
    activeWindowId,
    highlightedWindowId,
    openConversation,
    bringToFront,
    commitWindowPosition,
    commitWindowBounds,
    minimizeWindow,
    restoreWindow,
    closeWindow,
    toggleMaximize,
    cascadeWindows,
    resetLayout,
    highlightWindowByConversation,
  } = useCanvasState();

  const {
    typingStates,
    incomingMessage,
    getConversationMessages,
    sendMessage,
    toggleReaction,
    clearIncomingMessage,
  } = useMessages();

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'signin' | 'signup' | 'guest'>('signup');

  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newItem = { id, ...toast };
    setToasts((prev) => [newItem, ...prev].slice(0, 4));

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Listen for live incoming messages from other users
  useEffect(() => {
    if (!incomingMessage) return;

    // Clear immediately so this effect doesn't re-run on the same message
    clearIncomingMessage();

    // Ensure the conversation exists locally before opening the window.
    // If the sender's conversationId isn't in our list yet, create it on the spot.
    ensureConversation(
      incomingMessage.conversationId,
      incomingMessage.senderName,
      incomingMessage.senderAvatar
    );

    openConversation(incomingMessage.conversationId);
    highlightWindowByConversation(incomingMessage.conversationId);

    addToast({
      title: `🔔 New Message from ${incomingMessage.senderName}`,
      message: `"${incomingMessage.text.slice(0, 30)}${incomingMessage.text.length > 30 ? '...' : ''}"`,
      avatar: incomingMessage.senderAvatar,
      type: 'message',
    });
  }, [incomingMessage, openConversation, highlightWindowByConversation, addToast, clearIncomingMessage, ensureConversation]);

  const handleOpenAuth = (tab: 'signin' | 'signup' | 'guest' = 'guest') => {
    setAuthTab(tab);
    setIsAuthModalOpen(true);
  };

  const handleInitiateNewChat = (nameOrHandle: string, email?: string, avatar?: string, targetUserId?: string) => {
    const newConv = startChat(nameOrHandle, email ? `Direct Message • ${email}` : undefined, avatar, targetUserId, profile?.id);
    openConversation(newConv.id);

    addToast({
      title: '✨ Chat Window Opened',
      message: `Active spatial window created for ${newConv.title}`,
      avatar: newConv.avatar,
      type: 'info',
    });
  };

  const handleSelectConversation = (conversationId: string) => {
    openConversation(conversationId);
    const conv = getConversation(conversationId);
    if (conv) {
      addToast({
        title: '✨ Chat Window Focused',
        message: `Opened conversation with ${conv.title}`,
        avatar: conv.avatar,
        type: 'info',
      });
    }
  };

  const handleSendMessage = (conversationId: string, text: string) => {
    sendMessage(conversationId, text);
    // Sent message sends silently to DB/realtime channel without cluttering sent toasts
  };

  // Global hotkeys (e.g. 'n' for new chat if not typing in an input)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsNewChatModalOpen(false);
      }
      if (
        (e.key === 'n' || e.key === 'N') &&
        !isNewChatModalOpen &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        setIsNewChatModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNewChatModalOpen]);

  if (!isClient) {
    return (
      <div className="w-screen h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-medium tracking-wide">Initializing CanvasChat...</span>
      </div>
    );
  }

  const activeWindows = windows.filter((w) => !w.minimized);
  const minimizedWindows = windows.filter((w) => w.minimized);
  const openConversationIds = windows.map((w) => w.conversationId);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-zinc-950 text-zinc-100 select-none">
      {/* Floating Animated Toast Notifications */}
      <ToastNotifications toasts={toasts} onDismiss={removeToast} />

      {/* Mobile Responsive Slide Card View (active on < md screens) */}
      <div className="block md:hidden h-full w-full">
        <MobileSlideView
          windows={windows}
          conversations={conversations}
          getConversationMessages={getConversationMessages}
          typingStates={typingStates}
          onSendMessage={handleSendMessage}
          onOpenNewChat={() => setIsNewChatModalOpen(true)}
          onCloseWindow={closeWindow}
          onMinimizeWindow={minimizeWindow}
          onRestoreWindow={restoreWindow}
          onToggleReaction={toggleReaction}
          onOpenAuth={handleOpenAuth}
          onCascade={cascadeWindows}
          onReset={resetLayout}
        />
      </div>


      {/* Desktop Spatial Canvas View (active on >= md screens) */}
      <div className="hidden md:block h-full w-full relative">
        {/* Visual Canvas Background (Dot-grid & ambient depth) */}
        <CanvasGridBackground />

        {/* Floating Toolbar Header */}
        <CanvasToolbar
          activeCount={activeWindows.length}
          totalCount={windows.length}
          onOpenNewChat={() => setIsNewChatModalOpen(true)}
          onCascade={cascadeWindows}
          onReset={resetLayout}
          onOpenAuth={() => handleOpenAuth('guest')}
        />

        {/* Canvas Workspace Area for Movable / Resizable Windows & Minimized Chat Heads */}
        <div className="relative w-full h-full">
          <AnimatePresence>
            {windows.map((win) => {
              const conversation = getConversation(win.conversationId);
              if (!conversation) return null;

              const messages = getConversationMessages(win.conversationId);
              const isTyping = Boolean(typingStates[win.conversationId]);
              const lastMessage = messages[messages.length - 1];

              if (win.minimized) {
                // Minimized Chat Head round circular bubble floating on the canvas
                return (
                  <FloatingChatBubble
                    key={`bubble-${win.id}`}
                    window={win}
                    conversation={conversation}
                    lastMessage={lastMessage}
                    isTyping={isTyping}
                    onRestore={restoreWindow}
                    onClose={closeWindow}
                    onCommitPosition={commitWindowPosition}
                    onFocus={() => bringToFront(win.id)}
                  />
                );
              }

              return (
                <ChatWindow
                  key={`win-${win.id}`}
                  window={win}
                  conversation={conversation}
                  messages={messages}
                  isTyping={isTyping}
                  isActive={activeWindowId === win.id}
                  isHighlighted={highlightedWindowId === win.id}
                  onFocus={() => bringToFront(win.id)}
                  onMinimize={() => minimizeWindow(win.id)}
                  onClose={() => closeWindow(win.id)}
                  onToggleMaximize={toggleMaximize}
                  onCommitPosition={commitWindowPosition}
                  onCommitBounds={commitWindowBounds}
                  onSendMessage={handleSendMessage}
                  onToggleReaction={toggleReaction}
                />
              );
            })}
          </AnimatePresence>

          {/* Empty Canvas Helpful Guide if all windows closed */}
          {windows.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6 text-center">
              <div className="p-4 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md max-w-sm flex flex-col items-center shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
                  <MessageSquarePlus className="w-6 h-6" />
                </div>
                <h2 className="text-base font-semibold text-zinc-200">Canvas is Clear</h2>
                <p className="text-xs text-zinc-400 mt-1 mb-4 leading-relaxed">
                  All windows are closed. You can open any conversation back up anytime.
                </p>
                <button
                  onClick={() => setIsNewChatModalOpen(true)}
                  className="pointer-events-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium shadow-lg transition-transform active:scale-95 cursor-pointer"
                >
                  + Open a Conversation
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Minimized Windows Bottom Dock */}
        <MinimizedDock
          minimizedWindows={minimizedWindows}
          conversations={conversations}
          onRestore={restoreWindow}
        />
      </div>

      {/* Welcoming Landing Overlay for Logged-Out Users */}
      <AnimatePresence>
        {!isLoggedIn && (
          <WelcomeOverlay onOpenAuthTab={(tab) => handleOpenAuth(tab)} />
        )}
      </AnimatePresence>

      {/* New Chat Picker Modal (Shared across both Mobile & Desktop views) */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        conversations={conversations}
        openConversationIds={openConversationIds}
        onSelectConversation={handleSelectConversation}
        onInitiateNewChat={handleInitiateNewChat}
        onClose={() => setIsNewChatModalOpen(false)}
      />

      {/* Auth & User Identity Switcher Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialTab={authTab}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </main>
  );
}
