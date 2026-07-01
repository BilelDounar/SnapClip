import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import {useSnapClipStore, type SelectedWord} from '../store/useSnapClipStore';
import {ClipboardModule} from '../nativeModules';
import {useTheme} from '../theme/useTheme';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

export function Overlay(): React.JSX.Element {
  const theme = useTheme();
  const {
    blocks,
    selectedStart,
    selectedEnd,
    selectStart,
    selectEnd,
    setCopiedText,
    resetSelection,
  } = useSnapClipStore();
  const [hoveredBlock, setHoveredBlock] = useState<number | null>(null);
  const [flashBlock, setFlashBlock] = useState<number | null>(null);
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [overlayOpacity]);

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
    setTimeout(() => setFlashBlock(null), 300);
  };

  const handleBackgroundPress = () => {
    resetSelection();
  };

  return (
    <Animated.View
      style={[styles.overlay, {opacity: overlayOpacity}]}
      pointerEvents="box-none">
      <TouchableWithoutFeedback onPress={handleBackgroundPress}>
        <View style={styles.touchArea} pointerEvents="box-none">
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
                  borderColor: theme.overlayBorder,
                  backgroundColor: theme.overlay,
                },
                hoveredBlock === blockIndex && {
                  borderColor: theme.overlayHoverBorder,
                  backgroundColor: theme.overlayHover,
                },
                flashBlock === blockIndex && {
                  backgroundColor: theme.flash,
                  borderColor: theme.success,
                },
              ]}
              onPointerEnter={() => setHoveredBlock(blockIndex)}
              onPointerLeave={() => setHoveredBlock(null)}>
              <TouchableWithoutFeedback onPress={() => handleCopyAll(blockIndex)}>
                <View style={[styles.pin, {backgroundColor: theme.pin, shadowColor: theme.pinShadow}]}>
                  <View style={styles.pinInner} />
                </View>
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
                          left: word.x - block.x + word.width / 2 - 4,
                          top: word.y - block.y + word.height + 3,
                          backgroundColor: isSelected(blockIndex, wordIndex)
                            ? theme.wordDotSelected
                            : theme.wordDot,
                          borderColor: isSelected(blockIndex, wordIndex)
                            ? theme.successDark
                            : 'transparent',
                        },
                      ]}
                    />
                  </TouchableWithoutFeedback>
                ))}
            </View>
          ))}
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
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
  touchArea: {
    flex: 1,
  },
  block: {
    position: 'absolute',
    borderWidth: 1.5,
    borderRadius: 4,
  },
  pin: {
    position: 'absolute',
    left: -10,
    top: -20,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  pinInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  wordDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
});
