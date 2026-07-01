import {useSnapClipStore} from '../useSnapClipStore';

describe('useSnapClipStore', () => {
  beforeEach(() => {
    useSnapClipStore.setState({
      mode: 'idle',
      sourceHwnd: null,
      blocks: [],
      selectedStart: null,
      selectedEnd: null,
      copiedText: '',
    });
  });

  it('should activate and deactivate', () => {
    useSnapClipStore.getState().activate();
    expect(useSnapClipStore.getState().mode).toBe('selecting');

    useSnapClipStore.getState().deactivate();
    expect(useSnapClipStore.getState().mode).toBe('idle');
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
