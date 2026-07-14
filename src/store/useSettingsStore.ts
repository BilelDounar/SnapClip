import {create} from 'zustand';

/** Which right-click gesture triggers a paste at the cursor. */
export type PasteGesture = 'double' | 'long' | 'both';

interface SettingsState {
  /**
   * Delay between arming SnapClip and capturing the foreground window. Gives
   * the user time to switch to the source window before the OCR snapshot.
   */
  captureDelayMs: number;
  /** Gesture(s) that trigger a paste at the cursor position. */
  pasteGesture: PasteGesture;
  /** Show per-word dots for fine-grained selection inside a block. */
  showWordDots: boolean;
  setCaptureDelayMs: (value: number) => void;
  setPasteGesture: (value: PasteGesture) => void;
  setShowWordDots: (value: boolean) => void;
}

export const CAPTURE_DELAY_OPTIONS = [0, 1500, 3000, 5000];

/** Maps a raw mouse event name to whether it should paste, per settings. */
export function shouldPaste(gesture: PasteGesture, event: string): boolean {
  const isDouble = event === 'double-right-click';
  const isLong = event === 'long-right-click';
  switch (gesture) {
    case 'double':
      return isDouble;
    case 'long':
      return isLong;
    case 'both':
      return isDouble || isLong;
    default:
      return false;
  }
}

export const useSettingsStore = create<SettingsState>(set => ({
  captureDelayMs: 3000,
  pasteGesture: 'both',
  showWordDots: true,
  setCaptureDelayMs: (value: number) => set({captureDelayMs: value}),
  setPasteGesture: (value: PasteGesture) => set({pasteGesture: value}),
  setShowWordDots: (value: boolean) => set({showWordDots: value}),
}));
