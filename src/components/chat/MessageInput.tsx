'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SendHorizontal, Smile } from 'lucide-react';
import { EmojiPickerPopover } from './EmojiPickerPopover';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
}

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '🚀', '😊', '🎉', '✨'];

export function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
  const [text, setText] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || disabled) return;

    onSendMessage(text.trim());
    setText('');
    setIsEmojiPickerOpen(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInsertEmoji = useCallback((emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setText((prev) => prev + emoji);
      return;
    }

    const start = textarea.selectionStart ?? text.length;
    const end = textarea.selectionEnd ?? text.length;
    setText((prev) => {
      const next = prev.slice(0, start) + emoji + prev.slice(end);
      return next;
    });

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const cursor = start + emoji.length;
        textareaRef.current.setSelectionRange(cursor, cursor);
      }
    }, 0);
  }, [text.length]);

  return (
    <div className="relative p-3 border-t border-zinc-800/80 bg-zinc-900/90 flex flex-col gap-1.5 no-drag">
      {/* Emoji Picker Popover */}
      <EmojiPickerPopover
        isOpen={isEmojiPickerOpen}
        onClose={() => setIsEmojiPickerOpen(false)}
        onSelectEmoji={handleInsertEmoji}
      />

      {/* Quick emoji reaction strip */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        <button
          type="button"
          onClick={() => setIsEmojiPickerOpen((prev) => !prev)}
          className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs transition-colors border ${
            isEmojiPickerOpen
              ? 'bg-blue-600/20 border-blue-500/40 text-blue-400'
              : 'bg-zinc-800/60 hover:bg-zinc-800 border-zinc-700/50 text-zinc-400 hover:text-zinc-200'
          }`}
          title="Open Emoji Picker"
        >
          <Smile className="w-3.5 h-3.5" />
          <span className="text-[11px]">Emoji</span>
        </button>

        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleInsertEmoji(emoji)}
            className="shrink-0 w-6 h-6 rounded-md hover:bg-zinc-800 text-xs flex items-center justify-center transition-transform active:scale-90"
            title={`Insert ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Main input bar */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
        <div className="relative flex items-end gap-2 bg-zinc-800/80 border border-zinc-700/60 focus-within:border-blue-500/80 focus-within:ring-1 focus-within:ring-blue-500/30 rounded-xl px-3 py-2 transition-all">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled}
            rows={1}
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none max-h-28 overflow-y-auto leading-relaxed"
            style={{ scrollbarWidth: 'none' }}
          />

          <button
            type="submit"
            disabled={!text.trim() || disabled}
            aria-label="Send message"
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white transition-all transform active:scale-95 shadow-sm cursor-pointer"
          >
            <SendHorizontal className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between px-1 text-[10px] text-zinc-500">
          <span>Press <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[9px]">Enter ↵</kbd> to send</span>
          <span><kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[9px]">Shift + Enter</kbd> for new line</span>
        </div>
      </form>
    </div>
  );
}
