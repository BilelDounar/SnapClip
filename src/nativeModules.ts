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
  getWindowBounds(hwnd: number): Promise<string>;
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

export const OcrModule = NativeModules.OcrModule as OcrModuleType;
export const OverlayModule =
  NativeModules.OverlayWindowModule as OverlayModuleType;
export const ClipboardModule =
  NativeModules.ClipboardModule as ClipboardModuleType;
export const InputHookModule =
  NativeModules.InputHookModule as InputHookModuleType;

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
