import {create} from 'zustand';
import type {OcrResultBlock} from '../nativeModules';

export type AppMode = 'idle' | 'arming' | 'selecting' | 'copying';

export interface SelectedWord {
  blockIndex: number;
  wordIndex: number;
}

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

const HISTORY_LIMIT = 8;

interface SnapClipState {
  mode: AppMode;
  sourceHwnd: number | null;
  sourceBounds: WindowBounds | null;
  blocks: OcrResultBlock[];
  selectedStart: SelectedWord | null;
  selectedEnd: SelectedWord | null;
  copiedText: string;
  history: string[];
  error: string | null;
  arm: () => void;
  activate: () => void;
  deactivate: () => void;
  setSource: (hwnd: number) => void;
  setSourceBounds: (bounds: WindowBounds | null) => void;
  setBlocks: (blocks: OcrResultBlock[]) => void;
  selectStart: (selection: SelectedWord) => void;
  selectEnd: (selection: SelectedWord) => void;
  setCopiedText: (text: string) => void;
  setError: (error: string | null) => void;
  resetSelection: () => void;
}

export const useSnapClipStore = create<SnapClipState>(set => ({
  mode: 'idle',
  sourceHwnd: null,
  sourceBounds: null,
  blocks: [],
  selectedStart: null,
  selectedEnd: null,
  copiedText: '',
  history: [],
  error: null,
  arm: () => set({mode: 'arming', error: null}),
  activate: () => set({mode: 'selecting', error: null}),
  deactivate: () =>
    set({
      mode: 'idle',
      sourceHwnd: null,
      sourceBounds: null,
      blocks: [],
      selectedStart: null,
      selectedEnd: null,
      error: null,
    }),
  setSource: (hwnd: number) => set({sourceHwnd: hwnd}),
  setSourceBounds: (bounds: WindowBounds | null) => set({sourceBounds: bounds}),
  setBlocks: (blocks: OcrResultBlock[]) => set({blocks}),
  selectStart: (selection: SelectedWord) =>
    set({selectedStart: selection, selectedEnd: null}),
  selectEnd: (selection: SelectedWord) => set({selectedEnd: selection}),
  setCopiedText: (text: string) =>
    set(state => {
      if (!text) {
        return {copiedText: text};
      }
      const history = [
        text,
        ...state.history.filter(item => item !== text),
      ].slice(0, HISTORY_LIMIT);
      return {copiedText: text, history};
    }),
  setError: (error: string | null) => set({error}),
  resetSelection: () => set({selectedStart: null, selectedEnd: null}),
}));
