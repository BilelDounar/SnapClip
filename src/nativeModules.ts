import {NativeModules} from 'react-native';
import type {NativeEventEmitter} from 'react-native';

export interface OcrResultWord {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OcrResultBlock {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  words: OcrResultWord[];
}

export interface OcrResult {
  text: string;
  blocks: OcrResultBlock[];
}

export interface OcrModuleType {
  captureWindowText(hwnd: number): Promise<string>;
}

export interface OverlayModuleType {
  getWindowBounds?(hwnd: number): Promise<string>;
  getForegroundWindow(): Promise<number>;
}

export interface ClipboardModuleType {
  setText(text: string): void;
  pasteAtCursor(): void;
}

export interface InputHookModuleType {
  startHook(): void;
  stopHook(): void;
}

// Native modules are only present when running inside the compiled Windows
// host; typing them as optional keeps the JS layer honest on other platforms
// and in tests.
export const OcrModule = NativeModules.OcrModule as OcrModuleType | undefined;
export const OverlayModule = NativeModules.OverlayWindowModule as
  | OverlayModuleType
  | undefined;
export const ClipboardModule = NativeModules.ClipboardModule as
  | ClipboardModuleType
  | undefined;
export const InputHookModule = NativeModules.InputHookModule as
  | InputHookModuleType
  | undefined;

let inputHookEvents: NativeEventEmitter | null = null;
export function getInputHookEvents(): NativeEventEmitter {
  if (!inputHookEvents) {
    const {NativeEventEmitter} = require('react-native');
    inputHookEvents = new NativeEventEmitter(
      InputHookModule as any,
    ) as NativeEventEmitter;
  }
  return inputHookEvents as NativeEventEmitter;
}
