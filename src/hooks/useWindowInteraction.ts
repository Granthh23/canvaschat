'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MIN_WINDOW_HEIGHT, MIN_WINDOW_WIDTH, WindowBounds } from '@/types/canvas';

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface UseWindowInteractionProps {
  id: string;
  initialBounds: WindowBounds;
  isMaximized?: boolean;
  onCommitPosition: (id: string, x: number, y: number) => void;
  onCommitBounds: (id: string, bounds: WindowBounds) => void;
  onFocus: () => void;
}

export function useWindowInteraction({
  id,
  initialBounds,
  isMaximized,
  onCommitPosition,
  onCommitBounds,
  onFocus,
}: UseWindowInteractionProps) {
  const [bounds, setBounds] = useState<WindowBounds>(initialBounds);
  const [prevInitial, setPrevInitial] = useState<WindowBounds>(initialBounds);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [activeResizeDirection, setActiveResizeDirection] = useState<ResizeDirection | null>(null);

  // Sync state during render when initialBounds change from outside (e.g. cascade/restore)
  if (
    initialBounds.x !== prevInitial.x ||
    initialBounds.y !== prevInitial.y ||
    initialBounds.width !== prevInitial.width ||
    initialBounds.height !== prevInitial.height
  ) {
    setPrevInitial(initialBounds);
    if (!isDragging && !isResizing) {
      setBounds(initialBounds);
    }
  }

  const boundsRef = useRef(bounds);

  useEffect(() => {
    boundsRef.current = bounds;
  }, [bounds]);

  // Handle Dragging
  const handleDragPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Don't drag if maximized or if clicking on interactive controls (buttons, inputs)
      if (isMaximized) return;
      if (
        (e.target as HTMLElement).closest('button') ||
        (e.target as HTMLElement).closest('input') ||
        (e.target as HTMLElement).closest('textarea') ||
        (e.target as HTMLElement).closest('.no-drag')
      ) {
        return;
      }

      onFocus();
      e.preventDefault();

      const startPointerX = e.clientX;
      const startPointerY = e.clientY;
      const startBounds = { ...boundsRef.current };

      setIsDragging(true);

      let currentX = startBounds.x;
      let currentY = startBounds.y;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const dx = moveEvent.clientX - startPointerX;
        const dy = moveEvent.clientY - startPointerY;

        // Keep inside canvas bounds gracefully
        currentX = Math.max(0, startBounds.x + dx);
        currentY = Math.max(64, startBounds.y + dy); // Keep below header toolbar

        setBounds((prev) => ({
          ...prev,
          x: currentX,
          y: currentY,
        }));
      };

      const handlePointerUp = () => {
        setIsDragging(false);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);

        // Persist final position on drag end
        onCommitPosition(id, currentX, currentY);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [id, isMaximized, onCommitPosition, onFocus]
  );

  // Handle Resizing
  const handleResizePointerDown = useCallback(
    (direction: ResizeDirection, e: React.PointerEvent<HTMLDivElement>) => {
      if (isMaximized) return;

      onFocus();
      e.stopPropagation();
      e.preventDefault();

      const startPointerX = e.clientX;
      const startPointerY = e.clientY;
      const startBounds = { ...boundsRef.current };

      setIsResizing(true);
      setActiveResizeDirection(direction);

      let latestBounds = { ...startBounds };

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const dx = moveEvent.clientX - startPointerX;
        const dy = moveEvent.clientY - startPointerY;

        let nextX = startBounds.x;
        let nextY = startBounds.y;
        let nextWidth = startBounds.width;
        let nextHeight = startBounds.height;

        // Horizontal resizing
        if (direction.includes('e')) {
          nextWidth = Math.max(MIN_WINDOW_WIDTH, startBounds.width + dx);
        }
        if (direction.includes('w')) {
          const potentialWidth = startBounds.width - dx;
          if (potentialWidth >= MIN_WINDOW_WIDTH) {
            nextWidth = potentialWidth;
            nextX = startBounds.x + dx;
          } else {
            nextWidth = MIN_WINDOW_WIDTH;
            nextX = startBounds.x + (startBounds.width - MIN_WINDOW_WIDTH);
          }
        }

        // Vertical resizing
        if (direction.includes('s')) {
          nextHeight = Math.max(MIN_WINDOW_HEIGHT, startBounds.height + dy);
        }
        if (direction.includes('n')) {
          const potentialHeight = startBounds.height - dy;
          if (potentialHeight >= MIN_WINDOW_HEIGHT) {
            nextHeight = potentialHeight;
            nextY = startBounds.y + dy;
          } else {
            nextHeight = MIN_WINDOW_HEIGHT;
            nextY = startBounds.y + (startBounds.height - MIN_WINDOW_HEIGHT);
          }
        }

        latestBounds = {
          x: nextX,
          y: nextY,
          width: nextWidth,
          height: nextHeight,
        };

        setBounds(latestBounds);
      };

      const handlePointerUp = () => {
        setIsResizing(false);
        setActiveResizeDirection(null);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);

        // Persist final size on resize end
        onCommitBounds(id, latestBounds);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [id, isMaximized, onCommitBounds, onFocus]
  );

  return {
    bounds,
    isDragging,
    isResizing,
    activeResizeDirection,
    handleDragPointerDown,
    handleResizePointerDown,
  };
}
