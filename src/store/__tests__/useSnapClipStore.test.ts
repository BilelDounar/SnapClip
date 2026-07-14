import {useSnapClipStore} from '../useSnapClipStore';

describe('useSnapClipStore', () => {
  beforeEach(() => {
    useSnapClipStore.setState({
      mode: 'idle',
      sourceHwnd: null,
      sourceBounds: null,
      blocks: [],
      selectedStart: null,
      selectedEnd: null,
      copiedText: '',
      history: [],
      error: null,
    });
  });

  it('should arm, activate and deactivate', () => {
    useSnapClipStore.getState().arm();
    expect(useSnapClipStore.getState().mode).toBe('arming');

    useSnapClipStore.getState().activate();
    expect(useSnapClipStore.getState().mode).toBe('selecting');

    useSnapClipStore.getState().deactivate();
    expect(useSnapClipStore.getState().mode).toBe('idle');
  });

  it('should record copies in history without duplicates, newest first', () => {
    const store = useSnapClipStore.getState();
    store.setCopiedText('first');
    store.setCopiedText('second');
    store.setCopiedText('first');
    expect(useSnapClipStore.getState().history).toEqual(['first', 'second']);
    expect(useSnapClipStore.getState().copiedText).toBe('first');
  });

  it('should clear error when arming', () => {
    useSnapClipStore.getState().setError('boom');
    expect(useSnapClipStore.getState().error).toBe('boom');
    useSnapClipStore.getState().arm();
    expect(useSnapClipStore.getState().error).toBeNull();
  });

  it('should set source and blocks', () => {
    useSnapClipStore.getState().setSource(12345);
    expect(useSnapClipStore.getState().sourceHwnd).toBe(12345);

    useSnapClipStore.getState().setBlocks([
      {
        text: 'Hello world',
        x: 0,
        y: 0,
        width: 100,
        height: 20,
        words: [
          {text: 'Hello', x: 0, y: 0, width: 50, height: 20},
          {text: 'world', x: 55, y: 0, width: 45, height: 20},
        ],
      },
    ]);
    expect(useSnapClipStore.getState().blocks).toHaveLength(1);
  });

  it('should manage selection', () => {
    useSnapClipStore.getState().selectStart({blockIndex: 0, wordIndex: 0});
    expect(useSnapClipStore.getState().selectedStart).toEqual({
      blockIndex: 0,
      wordIndex: 0,
    });

    useSnapClipStore.getState().selectEnd({blockIndex: 0, wordIndex: 1});
    expect(useSnapClipStore.getState().selectedEnd).toEqual({
      blockIndex: 0,
      wordIndex: 1,
    });

    useSnapClipStore.getState().resetSelection();
    expect(useSnapClipStore.getState().selectedStart).toBeNull();
    expect(useSnapClipStore.getState().selectedEnd).toBeNull();
  });
});
