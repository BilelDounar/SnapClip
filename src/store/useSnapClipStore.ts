import {create} from 'zustand';
import type {OcrResultBlock} from '../nativeModules';

export type AppMode = 'idle' | 'selecting' | 'copying';

export interface SelectedWord {
  blockIndex: number;
  wordIndex: number;
}

interface SnapClipState {
  mode: AppMode;
  sourceHwnd: number | null;
  blocks: OcrResultBlock[];
  selectedStart: SelectedWord | null;
  selectedEnd: SelectedWord | null;
  copiedText: string;
  activate: () => void;
  deactivate: () => void;
  setSource: (hwnd: number) => void;
  setBlocks: (blocks: OcrResultBlock[]) => void;
  selectStart: (selection: SelectedWord) => void;
  selectEnd: (selection: SelectedWord) => void;
  setCopiedText: (text: string) => void;
  resetSelection: () => void;
}

export const useSnapClipStore = create<SnapClipState>(set => ({
  mode: 'idle',
  sourceHwnd: null,
  blocks: [],
  selectedStart: null,
  selectedEnd: null,
  copiedText: '',
  activate: () => set({mode: 'selecting'}),
  deactivate: () =>
    set({
      mode: 'idle',
      sourceHwnd: null,
      blocks: [],
      selectedStart: null,
      selectedEnd: null,
    }),
  setSource: (hwnd: number) => set({sourceHwnd: hwnd}),
  setBlocks: (blocks: OcrResultBlock[]) => set({blocks}),
  selectStart: (selection: SelectedWord) =>
    set({selectedStart: selection, selectedEnd: null}),
  selectEnd: (selection: SelectedWord) => set({selectedEnd: selection}),
  setCopiedText: (text: string) => set({copiedText: text}),
  resetSelection: () => set({selectedStart: null, selectedEnd: null}),
}));
