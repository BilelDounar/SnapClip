import {shouldPaste, useSettingsStore} from '../useSettingsStore';

describe('settings', () => {
  it('maps gestures to paste intent', () => {
    expect(shouldPaste('double', 'double-right-click')).toBe(true);
    expect(shouldPaste('double', 'long-right-click')).toBe(false);
    expect(shouldPaste('long', 'long-right-click')).toBe(true);
    expect(shouldPaste('long', 'double-right-click')).toBe(false);
    expect(shouldPaste('both', 'double-right-click')).toBe(true);
    expect(shouldPaste('both', 'long-right-click')).toBe(true);
    expect(shouldPaste('both', 'left-click')).toBe(false);
  });

  it('updates settings', () => {
    useSettingsStore.getState().setCaptureDelayMs(1500);
    expect(useSettingsStore.getState().captureDelayMs).toBe(1500);
    useSettingsStore.getState().setPasteGesture('long');
    expect(useSettingsStore.getState().pasteGesture).toBe('long');
    useSettingsStore.getState().setShowWordDots(false);
    expect(useSettingsStore.getState().showWordDots).toBe(false);
  });
});
