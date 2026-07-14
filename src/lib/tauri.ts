import type {OcrResult, WindowBounds} from '../types';

/** True when running inside the Tauri webview (vs a plain browser / test). */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

async function invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  const {invoke: tauriInvoke} = await import('@tauri-apps/api/core');
  return tauriInvoke<T>(command, args);
}

/**
 * Captures the currently focused window, runs OCR on it and returns the
 * detected text blocks together with the window's on-screen bounds.
 */
export async function captureActiveWindow(): Promise<{
  ocr: OcrResult;
  bounds: WindowBounds;
}> {
  return invoke('capture_active_window');
}

/** Puts text on the system clipboard. */
export async function setClipboard(text: string): Promise<void> {
  const {writeText} = await import('@tauri-apps/plugin-clipboard-manager');
  await writeText(text);
}

/** Pastes the clipboard at the current cursor position (Ctrl/Cmd+V). */
export async function pasteAtCursor(): Promise<void> {
  return invoke('paste_at_cursor');
}

/** Shows and focuses the given window (defaults to the overlay). */
export async function showOverlay(): Promise<void> {
  return invoke('show_overlay');
}

/** Hides the overlay window. */
export async function hideOverlay(): Promise<void> {
  return invoke('hide_overlay');
}

/**
 * Subscribes to global mouse-gesture events emitted by the Rust backend
 * (e.g. "double-right-click", "long-right-click"). Returns an unsubscribe fn.
 */
export async function onMouseGesture(
  handler: (event: string) => void,
): Promise<() => void> {
  if (!isTauri()) {
    return () => {};
  }
  const {listen} = await import('@tauri-apps/api/event');
  const unlisten = await listen<string>('mouse-gesture', e => handler(e.payload));
  return unlisten;
}

/** Sends a capture result to the overlay window. */
export async function emitCapture(payload: {
  ocr: OcrResult;
  bounds: WindowBounds;
}): Promise<void> {
  if (!isTauri()) {
    return;
  }
  const {emit} = await import('@tauri-apps/api/event');
  await emit('capture-result', payload);
}

/** Subscribes to the tray "arm capture" action. Returns an unsubscribe fn. */
export async function onArm(handler: () => void): Promise<() => void> {
  if (!isTauri()) {
    return () => {};
  }
  const {listen} = await import('@tauri-apps/api/event');
  const unlisten = await listen('arm-capture', () => handler());
  return unlisten;
}

/** Subscribes to overlay-capture results pushed from the backend. */
export async function onCapture(
  handler: (payload: {ocr: OcrResult; bounds: WindowBounds}) => void,
): Promise<() => void> {
  if (!isTauri()) {
    return () => {};
  }
  const {listen} = await import('@tauri-apps/api/event');
  const unlisten = await listen<{ocr: OcrResult; bounds: WindowBounds}>(
    'capture-result',
    e => handler(e.payload),
  );
  return unlisten;
}
