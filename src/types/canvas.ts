export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasWindow {
  id: string;
  conversationId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  isMaximized?: boolean;
  zIndex: number;
  prevBounds?: WindowBounds;
}

export interface CanvasState {
  windows: CanvasWindow[];
  activeWindowId: string | null;
  highestZIndex: number;
}

export const MIN_WINDOW_WIDTH = 340;
export const MIN_WINDOW_HEIGHT = 420;
export const DEFAULT_WINDOW_WIDTH = 420;
export const DEFAULT_WINDOW_HEIGHT = 560;
