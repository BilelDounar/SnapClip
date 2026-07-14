import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import {useSnapClipStore} from '../store/useSnapClipStore';
import {useSettingsStore} from '../store/useSettingsStore';
import {ClipboardModule} from '../nativeModules';
import {useTheme} from '../theme/useTheme';
import {extractSelectedText, isWordSelected} from '../lib/selection';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

export function Overlay(): React.JSX.Element {
  const theme = useTheme();
  const {
    blocks,
    sourceBounds,
    selectedStart,
    selectedEnd,
    selectStart,
    selectEnd,
    setCopiedText,
    resetSelection,
  } = useSnapClipStore();
  const showWordDots = useSettingsStore(state => state.showWordDots);
  const [hoveredBlock, setHoveredBlock] = useState<number | null>(null);
  const [flashBlock, setFlashBlock] = useState<number | null>(null);
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // OCR coordinates are relative to the captured window; offset them by the
  // source window's on-screen origin so the pins land over the real content.
  const offsetX = sourceBounds?.x ?? 0;
  const offsetY = sourceBounds?.y ?? 0;

  useEffect(() => {
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [overlayOpacity]);

  const isSelected = useCallback(
    (blockIndex: number, wordIndex: number): boolean =>
      isWordSelected(selectedStart, selectedEnd, blockIndex, wordIndex),
    [selectedStart, selectedEnd],
  );

  const handleCopyAll = (blockIndex: number) => {
    const text = blocks[blockIndex]?.text ?? '';
    ClipboardModule?.setText(text);
    setCopiedText(text);
    triggerFlash(blockIndex);
    resetSelection();
  };

  const handleWordPress = (blockIndex: number, wordIndex: number) => {
    if (!selectedStart) {
      selectStart({blockIndex, wordIndex});
      return;
    }
    if (
      selectedStart.blockIndex === blockIndex &&
      selectedStart.wordIndex === wordIndex
    ) {
      // Copy single word
      const text = blocks[blockIndex]?.words[wordIndex]?.text ?? '';
      ClipboardModule?.setText(text);
      setCopiedText(text);
      triggerFlash(blockIndex);
      resetSelection();
      return;
    }
    selectEnd({blockIndex, wordIndex});
    const text = extractSelectedText(blocks, selectedStart, {
      blockIndex,
      wordIndex,
    });
    ClipboardModule?.setText(text);
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
                  left: block.x + offsetX,
                  top: block.y + offsetY,
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
              <TouchableWithoutFeedback
                onPress={() => handleCopyAll(blockIndex)}>
                <View
                  style={[
                    styles.pin,
                    {backgroundColor: theme.pin, shadowColor: theme.pinShadow},
                  ]}>
                  <View style={styles.pinInner} />
                </View>
              </TouchableWithoutFeedback>
              {showWordDots &&
                hoveredBlock === blockIndex &&
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
