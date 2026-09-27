'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import {
  CanvasWindow,
  DEFAULT_WINDOW_HEIGHT,
  DEFAULT_WINDOW_WIDTH,
  MIN_WINDOW_HEIGHT,
  MIN_WINDOW_WIDTH,
} from '@/types/canvas';
import {
  getStoredCanvasWindows,
  saveStoredCanvasWindows,
  INITIAL_DEFAULT_WINDOWS,
  clearLocalStorage,
} from '@/lib/storage';

export function useCanvasState() {
  const [windows, setWindows] = useState<CanvasWindow[]>(() => getStoredCanvasWindows());
  const windowsRef = useRef(windows);
  windowsRef.current = windows;

  const [activeWindowId, setActiveWindowId] = useState<string | null>(() => {
    const initial = getStoredCanvasWindows();
    if (initial.length === 0) return null;
    const sorted = [...initial].sort((a, b) => b.zIndex - a.zIndex);
    return sorted[0]?.id ?? null;
  });
  const [highlightedWindowId, setHighlightedWindowId] = useState<string | null>(null);

  const highestZIndex = useMemo(() => {
    if (windows.length === 0) return 10;
    return Math.max(...windows.map((w) => w.zIndex), 10);
  }, [windows]);

  // Bring a window to front
  const bringToFront = useCallback((windowId: string) => {
    setWindows((prev) => {
      const target = prev.find((w) => w.id === windowId);
      if (!target) return prev;

      const newHighest = Math.max(...prev.map((w) => w.zIndex), 10) + 1;
      const updated = prev.map((w) =>
        w.id === windowId ? { ...w, zIndex: newHighest } : w
      );
      saveStoredCanvasWindows(updated);
      return updated;
    });
    setActiveWindowId(windowId);
  }, []);

  // Open or focus conversation
  const openConversation = useCallback(
    (conversationId: string) => {
      const safeWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const safeHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

      // Read current windows synchronously via ref (avoids capturing `windows` in deps)
      const current = windowsRef.current;
      const existing = current.find((w) => w.conversationId === conversationId);

      if (existing) {
        // Focus + restore if minimized
        setWindows((prev) => {
          const currentHighest = Math.max(...prev.map((w) => w.zIndex), 10);
          const updated = prev.map((w) =>
            w.id === existing.id
              ? { ...w, minimized: false, zIndex: currentHighest + 1 }
              : w
          );
          saveStoredCanvasWindows(updated);
          return updated;
        });
        setActiveWindowId(existing.id);
        setHighlightedWindowId(existing.id);
        setTimeout(() => setHighlightedWindowId(null), 1200);
        return;
      }

      // Create a new window
      const count = current.length;
      const staggerOffset = (count % 6) * 40;
      const newX = Math.min(Math.max(60 + staggerOffset, 40), safeWidth - DEFAULT_WINDOW_WIDTH - 40);
      const newY = Math.min(Math.max(90 + staggerOffset, 80), safeHeight - DEFAULT_WINDOW_HEIGHT - 60);
      const newId = `window-${conversationId}-${Date.now()}`;

      setWindows((prev) => {
        const currentHighest = Math.max(...prev.map((w) => w.zIndex), 10);
        const newWindow: CanvasWindow = {
          id: newId,
          conversationId,
          x: newX,
          y: newY,
          width: DEFAULT_WINDOW_WIDTH,
          height: DEFAULT_WINDOW_HEIGHT,
          minimized: false,
          zIndex: currentHighest + 1,
        };
        const updated = [...prev, newWindow];
        saveStoredCanvasWindows(updated);
        return updated;
      });

      setActiveWindowId(newId);
      setHighlightedWindowId(newId);
      setTimeout(() => setHighlightedWindowId(null), 1800);
    },
    []
  );

  // Update position after dragging finishes
  const commitWindowPosition = useCallback((id: string, x: number, y: number) => {
    setWindows((prev) => {
      const updated = prev.map((w) => (w.id === id ? { ...w, x, y } : w));
      saveStoredCanvasWindows(updated);
      return updated;
    });
  }, []);

  // Update size and bounds after resizing finishes
  const commitWindowBounds = useCallback(
    (id: string, bounds: { x: number; y: number; width: number; height: number }) => {
      setWindows((prev) => {
        const updated = prev.map((w) =>
          w.id === id
            ? {
                ...w,
                x: bounds.x,
                y: bounds.y,
                width: Math.max(bounds.width, MIN_WINDOW_WIDTH),
                height: Math.max(bounds.height, MIN_WINDOW_HEIGHT),
              }
            : w
        );
        saveStoredCanvasWindows(updated);
        return updated;
      });
    },
    []
  );

  // Minimize window
  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) => {
      const updated = prev.map((w) => (w.id === id ? { ...w, minimized: true } : w));
      saveStoredCanvasWindows(updated);
      return updated;
    });
  }, []);

  // Restore minimized window
  const restoreWindow = useCallback(
    (id: string) => {
      const newHighest = highestZIndex + 1;
      setWindows((prev) => {
        const updated = prev.map((w) =>
          w.id === id ? { ...w, minimized: false, zIndex: newHighest } : w
        );
        saveStoredCanvasWindows(updated);
        return updated;
      });
      setActiveWindowId(id);
    },
    [highestZIndex]
  );

  // Close window (removes visual representation, preserves messages)
  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => {
      const updated = prev.filter((w) => w.id !== id);
      saveStoredCanvasWindows(updated);
      return updated;
    });
    setActiveWindowId((prevActive) => (prevActive === id ? null : prevActive));
  }, []);

  // Toggle maximize
  const toggleMaximize = useCallback(
    (id: string, viewportWidth: number, viewportHeight: number) => {
      setWindows((prev) => {
        const target = prev.find((w) => w.id === id);
        if (!target) return prev;

        const newHighest = Math.max(...prev.map((w) => w.zIndex), 10) + 1;

        if (target.isMaximized && target.prevBounds) {
          // Restore
          const updated = prev.map((w) =>
            w.id === id
              ? {
                  ...w,
                  x: target.prevBounds!.x,
                  y: target.prevBounds!.y,
                  width: target.prevBounds!.width,
                  height: target.prevBounds!.height,
                  isMaximized: false,
                  zIndex: newHighest,
                }
              : w
          );
          saveStoredCanvasWindows(updated);
          return updated;
        } else {
          // Maximize
          const margin = 20;
          const topMargin = 72;
          const updated = prev.map((w) =>
            w.id === id
              ? {
                  ...w,
                  prevBounds: {
                    x: target.x,
                    y: target.y,
                    width: target.width,
                    height: target.height,
                  },
                  x: margin,
                  y: topMargin,
                  width: Math.max(MIN_WINDOW_WIDTH, viewportWidth - margin * 2),
                  height: Math.max(MIN_WINDOW_HEIGHT, viewportHeight - topMargin - margin),
                  isMaximized: true,
                  zIndex: newHighest,
                }
              : w
          );
          saveStoredCanvasWindows(updated);
          return updated;
        }
      });
      setActiveWindowId(id);
    },
    []
  );

  // Cascade open windows
  const cascadeWindows = useCallback(() => {
    setWindows((prev) => {
      let currentZ = 10;
      const updated = prev.map((w, index) => {
        currentZ += 1;
        return {
          ...w,
          minimized: false,
          isMaximized: false,
          x: 60 + index * 40,
          y: 90 + index * 40,
          width: DEFAULT_WINDOW_WIDTH,
          height: DEFAULT_WINDOW_HEIGHT,
          zIndex: currentZ,
        };
      });
      saveStoredCanvasWindows(updated);
      return updated;
    });
  }, []);

  // Reset to default
  const resetLayout = useCallback(() => {
    clearLocalStorage();
    setWindows(INITIAL_DEFAULT_WINDOWS);
    saveStoredCanvasWindows(INITIAL_DEFAULT_WINDOWS);
    setActiveWindowId(INITIAL_DEFAULT_WINDOWS[1]?.id ?? null);
  }, []);

  const highlightWindowByConversation = useCallback(
    (conversationId: string) => {
      const target = windowsRef.current.find((w) => w.conversationId === conversationId);
      if (target) {
        setHighlightedWindowId(target.id);
        setTimeout(() => setHighlightedWindowId(null), 1800);
      }
    },
    []
  );

  return {
    windows,
    activeWindowId,
    highestZIndex,
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
  };
}
