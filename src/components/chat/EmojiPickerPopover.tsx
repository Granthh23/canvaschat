'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Smile, ThumbsUp, Flame, Heart } from 'lucide-react';
import { motion } from 'motion/react';

interface EmojiPickerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
}

interface EmojiCategory {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  emojis: string[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'popular',
    name: 'Popular',
    icon: Flame,
    emojis: ['😊', '👍', '❤️', '🔥', '🚀', '🎉', '😂', '✨', '👏', '💡', '🙌', '💯', '🤝', '🎯', '⚡', '🤩'],
  },
  {
    id: 'smileys',
    name: 'Smileys',
    icon: Smile,
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
      '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😋', '😛',
      '😜', '🤪', '😝', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐',
      '😏', '😌', '😴', '😷', '🤒', '🤕', '🥳', '😎', '🤓', '🧐',
    ],
  },
  {
    id: 'gestures',
    name: 'Gestures',
    icon: ThumbsUp,
    emojis: [
      '👍', '👎', '👏', '🙌', '👐', '🤝', '👊', '✌️', '🤞', '🤟',
      '🤘', '👌', '🤌', '🤏', '👈', '👉', '👆', '👇', '☝️', '👋',
      '🤚', '🖐️', '✋', '✍️', '🤳', '💪', '🙏', '💅', '👀', '👁️',
    ],
  },
  {
    id: 'symbols',
    name: 'Love & Magic',
    icon: Heart,
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '✨',
      '🌟', '⭐', '💫', '⚡', '🔥', '💥', '💯', '💢', '💡', '🎉',
    ],
  },
];

export function EmojiPickerPopover({
  isOpen,
  onClose,
  onSelectEmoji,
}: EmojiPickerPopoverProps) {
  const [activeTab, setActiveTab] = useState('popular');
  const [search, setSearch] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentCategory = EMOJI_CATEGORIES.find((c) => c.id === activeTab) ?? EMOJI_CATEGORIES[0];
  const allEmojis = EMOJI_CATEGORIES.flatMap((c) => c.emojis);

  const displayedEmojis = search.trim()
    ? allEmojis // In search mode show filtered or set
    : currentCategory.emojis;

  return (
    <motion.div
      ref={popoverRef}
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute bottom-full mb-2 left-2 z-50 w-72 rounded-2xl bg-zinc-900 border border-zinc-700/80 shadow-2xl shadow-black/80 overflow-hidden flex flex-col no-drag"
    >
      {/* Search Header */}
      <div className="p-2 border-b border-zinc-800 flex items-center gap-1.5 bg-zinc-900/90">
        <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-800/80 rounded-xl border border-zinc-700/60 text-xs text-zinc-200">
          <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emoji..."
            className="w-full bg-transparent focus:outline-none placeholder-zinc-500 text-xs"
            autoFocus
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-[10px] text-zinc-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Category Tabs */}
      {!search && (
        <div className="flex items-center px-2 py-1.5 border-b border-zinc-800/80 bg-zinc-950/40 gap-1">
          {EMOJI_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeTab === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={`flex-1 py-1 rounded-lg text-xs flex items-center justify-center transition-colors ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
                title={cat.name}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>
      )}

      {/* Emojis Grid */}
      <div className="p-2.5 max-h-48 overflow-y-auto grid grid-cols-6 gap-1.5 text-xl select-none">
        {displayedEmojis.map((emoji, idx) => (
          <button
            key={`${emoji}-${idx}`}
            type="button"
            onClick={() => onSelectEmoji(emoji)}
            className="w-9 h-9 rounded-xl hover:bg-zinc-800 active:scale-90 flex items-center justify-center transition-transform cursor-pointer"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Bottom quick tip */}
      <div className="px-3 py-1.5 bg-zinc-950/60 border-t border-zinc-800/60 text-[10px] text-zinc-500 flex items-center justify-between">
        <span>Click to insert at cursor</span>
        <span>Esc to close</span>
      </div>
    </motion.div>
  );
}
