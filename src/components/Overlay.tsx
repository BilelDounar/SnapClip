import {useCallback, useEffect, useState} from 'react';
import {useSnapClipStore} from '../store/useSnapClipStore';
import {useSettingsStore} from '../store/useSettingsStore';
import {extractSelectedText, isWordSelected} from '../lib/selection';
import {hideOverlay, onCapture, setClipboard} from '../lib/tauri';

export function Overlay() {
  const {
    blocks,
    sourceBounds,
    selectedStart,
    selectedEnd,
    selectStart,
    selectEnd,
    setBlocks,
    setSourceBounds,
    setCopiedText,
    resetSelection,
  } = useSnapClipStore();
  const showWordDots = useSettingsStore(s => s.showWordDots);

  const [hoveredBlock, setHoveredBlock] = useState<number | null>(null);
  const [flashBlock, setFlashBlock] = useState<number | null>(null);

  // Populated by the control window right after a capture.
  useEffect(() => {
    let dispose = () => {};
    onCapture(({ocr, bounds}) => {
      setBlocks(ocr.blocks ?? []);
      setSourceBounds(bounds);
      resetSelection();
    }).then(fn => {
      dispose = fn;
    });
    return () => dispose();
  }, [setBlocks, setSourceBounds, resetSelection]);

  const offsetX = sourceBounds?.x ?? 0;
  const offsetY = sourceBounds?.y ?? 0;

  const isSelected = useCallback(
    (blockIndex: number, wordIndex: number) =>
      isWordSelected(selectedStart, selectedEnd, blockIndex, wordIndex),
    [selectedStart, selectedEnd],
  );

  const flash = (blockIndex: number) => {
    setFlashBlock(blockIndex);
    setTimeout(() => setFlashBlock(null), 260);
  };

  const commit = (text: string, blockIndex: number) => {
    if (!text) {
      return;
    }
    setClipboard(text).catch(() => {});
    setCopiedText(text);
    flash(blockIndex);
    resetSelection();
    // Dismiss shortly after copying so the user can paste in the target app.
    setTimeout(() => hideOverlay().catch(() => {}), 280);
  };

  const copyBlock = (blockIndex: number) => {
    commit(blocks[blockIndex]?.text ?? '', blockIndex);
  };

  const pressWord = (blockIndex: number, wordIndex: number) => {
    if (!selectedStart) {
      selectStart({blockIndex, wordIndex});
      return;
    }
    if (
      selectedStart.blockIndex === blockIndex &&
      selectedStart.wordIndex === wordIndex
    ) {
      commit(blocks[blockIndex]?.words[wordIndex]?.text ?? '', blockIndex);
      return;
    }
    selectEnd({blockIndex, wordIndex});
    commit(
      extractSelectedText(blocks, selectedStart, {blockIndex, wordIndex}),
      blockIndex,
    );
  };

  return (
    <div
      className="overlay-root"
      onClick={() => resetSelection()}
      onContextMenu={e => e.preventDefault()}>
      {blocks.map((block, bi) => (
        <div
          key={`b-${bi}`}
          className={`ocr-block ${flashBlock === bi ? 'ocr-block--flash' : ''}`}
          style={{
            left: block.x + offsetX,
            top: block.y + offsetY,
            width: block.width,
            height: block.height,
          }}
          onMouseEnter={() => setHoveredBlock(bi)}
          onMouseLeave={() => setHoveredBlock(null)}>
          <div
            className="pin"
            onClick={e => {
              e.stopPropagation();
              copyBlock(bi);
            }}
          />
          {showWordDots &&
            hoveredBlock === bi &&
            block.words.map((word, wi) => (
              <div
                key={`w-${bi}-${wi}`}
                className={`word-dot ${
                  isSelected(bi, wi) ? 'word-dot--selected' : ''
                }`}
                style={{
                  left: word.x - block.x + word.width / 2 - 4,
                  top: word.y - block.y + word.height + 3,
                }}
                onClick={e => {
                  e.stopPropagation();
                  pressWord(bi, wi);
                }}
              />
            ))}
        </div>
      ))}
    </div>
  );
}
