import {create} from 'zustand';
import {persist} from 'zustand/middleware';

/** Which right-click gesture triggers a paste at the cursor. */
export type PasteGesture = 'double' | 'long' | 'both';

/** How the capture overlay is invoked. */
export type ActivationMode = 'tray' | 'gesture';

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
  /** Whether a global mouse gesture also arms a capture (fully mouse-driven). */
  activation: ActivationMode;
  /** Keep the app running in the system tray when the window is closed. */
  minimizeToTray: boolean;
  setCaptureDelayMs: (value: number) => void;
  setPasteGesture: (value: PasteGesture) => void;
  setShowWordDots: (value: boolean) => void;
  setActivation: (value: ActivationMode) => void;
  setMinimizeToTray: (value: boolean) => void;
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

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      captureDelayMs: 3000,
      pasteGesture: 'both',
      showWordDots: true,
      activation: 'tray',
      minimizeToTray: true,
      setCaptureDelayMs: (value: number) => set({captureDelayMs: value}),
      setPasteGesture: (value: PasteGesture) => set({pasteGesture: value}),
      setShowWordDots: (value: boolean) => set({showWordDots: value}),
      setActivation: (value: ActivationMode) => set({activation: value}),
      setMinimizeToTray: (value: boolean) => set({minimizeToTray: value}),
    }),
    {name: 'snapclip-settings'},
  ),
);
