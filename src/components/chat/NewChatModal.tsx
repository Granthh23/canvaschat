'use client';

/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from 'react';
import { Conversation } from '@/types/chat';
import { Search, X, Users, MessageSquarePlus, ExternalLink, Check, UserCheck, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getStoredAccounts, useAuth, UserProfile } from '@/context/AuthContext';
import { fetchProfilesDb, subscribeToProfiles } from '@/lib/supabase/service';

interface NewChatModalProps {
  isOpen: boolean;
  conversations: Conversation[];
  openConversationIds: string[];
  onSelectConversation: (conversationId: string) => void;
  onInitiateNewChat: (nameOrHandle: string, email?: string, avatar?: string, targetUserId?: string) => void;
  onClose: () => void;
}

export function NewChatModal({
  isOpen,
  conversations,
  openConversationIds,
  onSelectConversation,
  onInitiateNewChat,
  onClose,
}: NewChatModalProps) {
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [registeredAccounts, setRegisteredAccounts] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const localAccounts = getStoredAccounts();
    setRegisteredAccounts(localAccounts);

    // Fetch live registered accounts from database as well
    fetchProfilesDb().then((dbProfiles) => {
      if (dbProfiles && isMounted) {
        setRegisteredAccounts((prev) => {
          const map = new Map<string, UserProfile>();
          prev.forEach((a) => map.set(a.id, a));
          dbProfiles.forEach((p) => {
            if (!map.has(p.id)) {
              map.set(p.id, {
                id: p.id,
                name: p.name,
                avatar: p.avatar,
                email: p.email,
                isGuest: false,
              });
            }
          });
          return Array.from(map.values());
        });
      }
    });

    const unsubscribe = subscribeToProfiles((newProfile) => {
      if (!isMounted) return;
      setRegisteredAccounts((prev) => {
        if (prev.some((a) => a.id === newProfile.id || a.name.toLowerCase() === newProfile.name.toLowerCase())) {
          return prev;
        }
        return [
          {
            id: newProfile.id,
            name: newProfile.name,
            avatar: newProfile.avatar,
            email: newProfile.email,
            isGuest: false,
          },
          ...prev,
        ];
      });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const query = searchQuery.trim().toLowerCase();
  const currentUserId = profile?.id;
  const currentUserName = profile?.name?.toLowerCase();
  const currentUserEmail = profile?.email?.toLowerCase();

  // Filter out the current user so they only see OTHER registered accounts to chat with
  const availableAccounts = registeredAccounts.filter(
    (acc) =>
      acc.id !== currentUserId &&
      acc.name.toLowerCase() !== currentUserName &&
      (!currentUserEmail || acc.email?.toLowerCase() !== currentUserEmail)
  );

  // Filter registered user accounts matching search query
  const filteredAccounts = availableAccounts.filter(
    (acc) =>
      acc.name.toLowerCase().includes(query) ||
      (acc.email && acc.email.toLowerCase().includes(query))
  );

  // Filter active/saved conversations matching search query AND excluding self-conversations
  const filteredConvs = conversations.filter((c) => {
    if (currentUserId && c.id === `conv-acc-${currentUserId}`) return false;
    if (currentUserName && c.title.toLowerCase() === currentUserName) return false;
    if (currentUserEmail && c.subtitle.toLowerCase().includes(currentUserEmail)) return false;

    if (!query) return true;
    return (
      c.title.toLowerCase().includes(query) ||
      c.subtitle.toLowerCase().includes(query) ||
      c.roleOrType.toLowerCase().includes(query)
    );
  });

  const hasMatches = filteredAccounts.length > 0 || filteredConvs.length > 0;

  const handleStartAccountChat = (account: UserProfile) => {
    onInitiateNewChat(account.name, account.email, account.avatar, account.id);
    setSearchQuery('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.16 }}
          className="relative w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/90">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <MessageSquarePlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">Find & Connect with Accounts</h3>
                <p className="text-xs text-zinc-400">Select any registered member to open a live chat window on the board</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search filter input */}
          <div className="p-3 border-b border-zinc-800/80 bg-zinc-950/50">
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-zinc-800/80 border border-zinc-700/60 rounded-xl text-sm text-zinc-200 focus-within:border-blue-500 shadow-inner">
              <Search className="w-4 h-4 text-zinc-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search registered account by name or email..."
                autoFocus
                className="w-full bg-transparent focus:outline-none placeholder-zinc-500 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Body Content */}
          <div className="p-4 overflow-y-auto space-y-4 flex-1">
            {/* Warning if searching for an unregistered user */}
            {query.length > 0 && !hasMatches && (
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex flex-col items-center justify-center text-center gap-2 py-8">
                <ShieldAlert className="w-8 h-8 text-amber-400 mb-1" />
                <span className="font-bold text-sm text-zinc-100">No Registered Account Found</span>
                <span className="text-zinc-400 text-xs max-w-xs leading-relaxed">
                  There is no registered account matching &quot;<span className="text-amber-300 font-semibold">{searchQuery.trim()}</span>&quot;. Users must register on CanvasChat first to start a chat.
                </span>
              </div>
            )}

            {/* Registered Platform Accounts Section */}
            {filteredAccounts.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 px-2 mb-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Registered Platform Members ({filteredAccounts.length})</span>
                </div>
                <div className="space-y-1.5">
                  {filteredAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={acc.avatar}
                          alt={acc.name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/30 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-semibold text-xs text-zinc-100 block truncate">
                            {acc.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 block truncate">
                            {acc.email || (acc.isGuest ? 'Guest Member' : 'Verified Registered User')}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleStartAccountChat(acc)}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg shadow-sm transition-colors cursor-pointer shrink-0"
                      >
                        Chat Now
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing Conversations Section */}
            {filteredConvs.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 px-2 mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  <Users className="w-3.5 h-3.5" />
                  <span>Existing Chats ({filteredConvs.length})</span>
                </div>
                <div className="space-y-1">
                  {filteredConvs.map((conv) => {
                    const isOpenOnCanvas = openConversationIds.includes(conv.id);

                    return (
                      <button
                        key={conv.id}
                        onClick={() => {
                          onSelectConversation(conv.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800/80 active:bg-zinc-800 text-left transition-colors group cursor-pointer border border-transparent hover:border-zinc-700/60"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            <img
                              src={conv.avatar}
                              alt={conv.title}
                              className="w-10 h-10 rounded-full object-cover ring-1 ring-zinc-700"
                            />
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-zinc-900" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-zinc-100 group-hover:text-blue-400 transition-colors">
                                {conv.title}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60 font-medium">
                                {conv.roleOrType}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 truncate mt-0.5">
                              {conv.subtitle}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 ml-3">
                          {isOpenOnCanvas ? (
                            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                              <Check className="w-3 h-3" />
                              <span>Focused</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] font-medium text-blue-400 bg-blue-500/10 group-hover:bg-blue-500/20 border border-blue-500/30 px-2.5 py-1 rounded-lg transition-colors">
                              <span>Open</span>
                              <ExternalLink className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="px-5 py-3 border-t border-zinc-800/80 bg-zinc-950/60 text-[11px] text-zinc-500 flex items-center justify-between shrink-0">
            <span>Only registered accounts can be opened</span>
            <span>Esc to close</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
