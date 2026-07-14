import type {OcrResultBlock} from '../nativeModules';
import type {SelectedWord} from '../store/useSnapClipStore';

/**
 * Returns true when `a` comes before or is equal to `b` in reading order
 * (top-to-bottom by block, then left-to-right by word).
 */
export function isBeforeOrEqual(a: SelectedWord, b: SelectedWord): boolean {
  return (
    a.blockIndex < b.blockIndex ||
    (a.blockIndex === b.blockIndex && a.wordIndex <= b.wordIndex)
  );
}

/**
 * Normalises a pair of selection anchors into `[start, end]` ordered in
 * reading order, so callers never have to worry about which anchor was
 * clicked first.
 */
export function orderSelection(
  a: SelectedWord,
  b: SelectedWord,
): [SelectedWord, SelectedWord] {
  return isBeforeOrEqual(a, b) ? [a, b] : [b, a];
}

/**
 * Whether a given word falls inside the current selection range. When only a
 * start anchor exists, just that single word is considered selected.
 */
export function isWordSelected(
  selectedStart: SelectedWord | null,
  selectedEnd: SelectedWord | null,
  blockIndex: number,
  wordIndex: number,
): boolean {
  if (!selectedStart) {
    return false;
  }
  if (!selectedEnd) {
    return (
      selectedStart.blockIndex === blockIndex &&
      selectedStart.wordIndex === wordIndex
    );
  }

  const [start, end] = orderSelection(selectedStart, selectedEnd);
  const current: SelectedWord = {blockIndex, wordIndex};
  return isBeforeOrEqual(start, current) && isBeforeOrEqual(current, end);
}

/**
 * Extracts the text spanned by a selection range, joining words with spaces
 * and blocks with newlines so multi-line selections keep their structure.
 */
export function extractSelectedText(
  blocks: OcrResultBlock[],
  a: SelectedWord,
  b: SelectedWord,
): string {
  const [start, end] = orderSelection(a, b);
  const lines: string[] = [];

  for (let bi = start.blockIndex; bi <= end.blockIndex; bi++) {
    const block = blocks[bi];
    if (!block) {
      continue;
    }
    const firstWord = bi === start.blockIndex ? start.wordIndex : 0;
    const lastWord =
      bi === end.blockIndex ? end.wordIndex : block.words.length - 1;

    const words: string[] = [];
    for (let wi = firstWord; wi <= lastWord; wi++) {
      const text = block.words[wi]?.text;
      if (text) {
        words.push(text);
      }
    }
    if (words.length > 0) {
      lines.push(words.join(' '));
    }
  }

  return lines.join('\n');
}
