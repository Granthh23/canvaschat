import { CanvasWindow, DEFAULT_WINDOW_HEIGHT, DEFAULT_WINDOW_WIDTH } from '@/types/canvas';
import { Message } from '@/types/chat';
import { INITIAL_MOCK_MESSAGES } from './mock-data';

const CANVAS_STORAGE_KEY = 'canvaschat_canvas_v1';
const MESSAGES_STORAGE_KEY = 'canvaschat_messages_v1';

export const INITIAL_DEFAULT_WINDOWS: CanvasWindow[] = [];

let cachedCanvasWindows: CanvasWindow[] | null = null;
let cachedMessages: Message[] | null = null;

export function getStoredCanvasWindows(): CanvasWindow[] {
  if (typeof window === 'undefined') return INITIAL_DEFAULT_WINDOWS;
  if (cachedCanvasWindows) return cachedCanvasWindows;
  try {
    const raw = localStorage.getItem(CANVAS_STORAGE_KEY);
    if (!raw) {
      cachedCanvasWindows = INITIAL_DEFAULT_WINDOWS;
      return cachedCanvasWindows;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      cachedCanvasWindows = parsed;
      return cachedCanvasWindows;
    }
  } catch (err) {
    console.error('Failed to load canvas state from localStorage:', err);
  }
  cachedCanvasWindows = INITIAL_DEFAULT_WINDOWS;
  return cachedCanvasWindows;
}

export function saveStoredCanvasWindows(windows: CanvasWindow[]): void {
  cachedCanvasWindows = windows;
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CANVAS_STORAGE_KEY, JSON.stringify(windows));
  } catch (err) {
    console.error('Failed to save canvas state to localStorage:', err);
  }
}

export function getStoredMessages(): Message[] {
  if (typeof window === 'undefined') return INITIAL_MOCK_MESSAGES;
  if (cachedMessages) return cachedMessages;
  try {
    const raw = localStorage.getItem(MESSAGES_STORAGE_KEY);
    if (!raw) {
      cachedMessages = INITIAL_MOCK_MESSAGES;
      return cachedMessages;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      cachedMessages = parsed;
      return cachedMessages;
    }
  } catch (err) {
    console.error('Failed to load messages from localStorage:', err);
  }
  cachedMessages = INITIAL_MOCK_MESSAGES;
  return cachedMessages;
}

export function saveStoredMessages(messages: Message[]): void {
  cachedMessages = messages;
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
  } catch (err) {
    console.error('Failed to save messages to localStorage:', err);
  }
}

export function clearLocalStorage(): void {
  cachedCanvasWindows = null;
  cachedMessages = null;
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CANVAS_STORAGE_KEY);
    localStorage.removeItem(MESSAGES_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear storage:', err);
  }
}
