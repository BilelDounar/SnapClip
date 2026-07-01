import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import {useSnapClipStore, type SelectedWord} from '../store/useSnapClipStore';
import {ClipboardModule, type OcrResultBlock} from '../nativeModules';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

export function Overlay(): React.JSX.Element {
  const {
    blocks,
    selectedStart,
    selectedEnd,
    selectStart,
    selectEnd,
    setCopiedText,
    resetSelection,
    deactivate,
  } = useSnapClipStore();
  const [hoveredBlock, setHoveredBlock] = useState<number | null>(null);
  const [flashBlock, setFlashBlock] = useState<number | null>(null);

  const isSelected = useCallback(
    (blockIndex: number, wordIndex: number): boolean => {
      if (!selectedStart) {
        return false;
      }
      if (!selectedEnd) {
        return (
          selectedStart.blockIndex === blockIndex &&
          selectedStart.wordIndex === wordIndex
        );
      }
      const start =
        selectedStart.blockIndex < selectedEnd.blockIndex ||
        (selectedStart.blockIndex === selectedEnd.blockIndex &&
          selectedStart.wordIndex <= selectedEnd.wordIndex)
          ? selectedStart
          : selectedEnd;
      const end = start === selectedStart ? selectedEnd : selectedStart;

      const blockIndexBetween =
        blockIndex > start.blockIndex && blockIndex < end.blockIndex;
      const sameBlockStart =
        blockIndex === start.blockIndex && wordIndex >= start.wordIndex;
      const sameBlockEnd =
        blockIndex === end.blockIndex && wordIndex <= end.wordIndex;
      const sameBlockOnly =
        start.blockIndex === end.blockIndex &&
        blockIndex === start.blockIndex &&
        wordIndex >= start.wordIndex &&
        wordIndex <= end.wordIndex;

      return blockIndexBetween || sameBlockOnly || sameBlockStart || sameBlockEnd;
    },
    [selectedStart, selectedEnd],
  );

  const extractText = useCallback(
    (start: SelectedWord, end: SelectedWord): string => {
      const orderedStart =
        start.blockIndex < end.blockIndex ||
        (start.blockIndex === end.blockIndex && start.wordIndex <= end.wordIndex)
          ? start
          : end;
      const orderedEnd = orderedStart === start ? end : start;

      const words: string[] = [];
      for (let b = orderedStart.blockIndex; b <= orderedEnd.blockIndex; b++) {
        const block = blocks[b];
        if (!block) {
          continue;
        }
        const startWord = b === orderedStart.blockIndex ? orderedStart.wordIndex : 0;
        const endWord =
          b === orderedEnd.blockIndex ? orderedEnd.wordIndex : block.words.length - 1;
        for (let w = startWord; w <= endWord; w++) {
          words.push(block.words[w]?.text ?? '');
        }
      }
      return words.join(' ');
    },
    [blocks],
  );

  const handleCopyAll = (blockIndex: number) => {
    const text = blocks[blockIndex]?.text ?? '';
    ClipboardModule.setText(text);
    setCopiedText(text);
    triggerFlash(blockIndex);
    resetSelection();
  };

  const handleWordPress = (blockIndex: number, wordIndex: number) => {
    if (!selectedStart) {
      selectStart({blockIndex, wordIndex});
      return;
    }
    if (selectedStart.blockIndex === blockIndex && selectedStart.wordIndex === wordIndex) {
      // Copy single word
      const text = blocks[blockIndex]?.words[wordIndex]?.text ?? '';
      ClipboardModule.setText(text);
      setCopiedText(text);
      triggerFlash(blockIndex);
      resetSelection();
      return;
    }
    selectEnd({blockIndex, wordIndex});
    const text = extractText(selectedStart, {blockIndex, wordIndex});
    ClipboardModule.setText(text);
    setCopiedText(text);
    triggerFlash(blockIndex);
    resetSelection();
  };

  const triggerFlash = (blockIndex: number) => {
    setFlashBlock(blockIndex);
    setTimeout(() => setFlashBlock(null), 150);
  };

  const handleBackgroundPress = () => {
    resetSelection();
  };

  return (
    <TouchableWithoutFeedback onPress={handleBackgroundPress}>
      <View style={styles.overlay} pointerEvents="box-none">
        {blocks.map((block, blockIndex) => (
          <View
            key={`block-${blockIndex}`}
            style={[
              styles.block,
              {
                left: block.x,
                top: block.y,
                width: block.width,
                height: block.height,
              },
              hoveredBlock === blockIndex && styles.blockHover,
              flashBlock === blockIndex && styles.blockFlash,
            ]}
            onPointerEnter={() => setHoveredBlock(blockIndex)}
            onPointerLeave={() => setHoveredBlock(null)}>
            <TouchableWithoutFeedback onPress={() => handleCopyAll(blockIndex)}>
              <View style={styles.pin} />
            </TouchableWithoutFeedback>
            {hoveredBlock === blockIndex &&
              block.words.map((word, wordIndex) => (
                <TouchableWithoutFeedback
                  key={`word-${blockIndex}-${wordIndex}`}
                  onPress={() => handleWordPress(blockIndex, wordIndex)}>
                  <View
                    style={[
                      styles.wordDot,
                      {
                        left: word.x - block.x + word.width / 2 - 3,
                        top: word.y - block.y + word.height + 2,
                      },
                      isSelected(blockIndex, wordIndex) && styles.wordDotSelected,
                    ]}
                  />
                </TouchableWithoutFeedback>
              ))}
          </View>
        ))}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: screenWidth,
    height: screenHeight,
    backgroundColor: 'transparent',
  },
  block: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.5)',
    backgroundColor: 'transparent',
  },
  blockHover: {
    borderColor: 'rgba(100, 149, 237, 0.8)',
  },
  blockFlash: {
    backgroundColor: 'rgba(0, 255, 0, 0.3)',
  },
  pin: {
    position: 'absolute',
    left: -8,
    top: -16,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(128, 128, 128, 0.8)',
  },
  wordDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(128, 128, 128, 0.6)',
  },
  wordDotSelected: {
    backgroundColor: 'rgba(0, 200, 0, 1)',
  },
});
