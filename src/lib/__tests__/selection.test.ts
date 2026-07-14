import {
  compareSelection,
  orderSelection,
  isWordInSelection,
  extractSelectedText,
} from '../selection';
import type {OcrResultBlock} from '../../nativeModules';

const blocks: OcrResultBlock[] = [
  {
    text: 'Hello world here',
    x: 0,
    y: 0,
    width: 100,
    height: 20,
    words: [
      {text: 'Hello', x: 0, y: 0, width: 30, height: 20},
      {text: 'world', x: 35, y: 0, width: 30, height: 20},
      {text: 'here', x: 70, y: 0, width: 25, height: 20},
    ],
  },
  {
    text: 'Second block line',
    x: 0,
    y: 30,
    width: 120,
    height: 20,
    words: [
      {text: 'Second', x: 0, y: 30, width: 40, height: 20},
      {text: 'block', x: 45, y: 30, width: 30, height: 20},
      {text: 'line', x: 80, y: 30, width: 25, height: 20},
    ],
  },
];

describe('compareSelection', () => {
  it('orders by block then word', () => {
    expect(
      compareSelection(
        {blockIndex: 0, wordIndex: 0},
        {blockIndex: 0, wordIndex: 1},
      ),
    ).toBeLessThan(0);
    expect(
      compareSelection(
        {blockIndex: 1, wordIndex: 0},
        {blockIndex: 0, wordIndex: 5},
      ),
    ).toBeGreaterThan(0);
    expect(
      compareSelection(
        {blockIndex: 2, wordIndex: 3},
        {blockIndex: 2, wordIndex: 3},
      ),
    ).toBe(0);
  });
});

describe('orderSelection', () => {
  it('keeps an already-ordered pair', () => {
    const a = {blockIndex: 0, wordIndex: 0};
    const b = {blockIndex: 1, wordIndex: 2};
    expect(orderSelection(a, b)).toEqual([a, b]);
  });

  it('swaps a reversed pair', () => {
    const a = {blockIndex: 1, wordIndex: 2};
    const b = {blockIndex: 0, wordIndex: 0};
    expect(orderSelection(a, b)).toEqual([b, a]);
  });
});

describe('isWordInSelection', () => {
  it('returns false with no start', () => {
    expect(isWordInSelection(0, 0, null, null)).toBe(false);
  });

  it('selects only the start word when there is no end', () => {
    const start = {blockIndex: 0, wordIndex: 1};
    expect(isWordInSelection(0, 1, start, null)).toBe(true);
    expect(isWordInSelection(0, 0, start, null)).toBe(false);
    expect(isWordInSelection(0, 2, start, null)).toBe(false);
  });

  it('selects an inclusive range inside one block', () => {
    const start = {blockIndex: 0, wordIndex: 0};
    const end = {blockIndex: 0, wordIndex: 2};
    expect(isWordInSelection(0, 0, start, end)).toBe(true);
    expect(isWordInSelection(0, 1, start, end)).toBe(true);
    expect(isWordInSelection(0, 2, start, end)).toBe(true);
  });

  it('selects across blocks and respects boundaries', () => {
    const start = {blockIndex: 0, wordIndex: 2};
    const end = {blockIndex: 1, wordIndex: 1};
    expect(isWordInSelection(0, 1, start, end)).toBe(false); // avant le départ
    expect(isWordInSelection(0, 2, start, end)).toBe(true);
    expect(isWordInSelection(1, 0, start, end)).toBe(true);
    expect(isWordInSelection(1, 1, start, end)).toBe(true);
    expect(isWordInSelection(1, 2, start, end)).toBe(false); // après la fin
  });

  it('is symmetric when start and end are reversed', () => {
    const a = {blockIndex: 1, wordIndex: 1};
    const b = {blockIndex: 0, wordIndex: 2};
    expect(isWordInSelection(1, 0, a, b)).toBe(true);
    expect(isWordInSelection(0, 2, a, b)).toBe(true);
    expect(isWordInSelection(0, 1, a, b)).toBe(false);
  });
});

describe('extractSelectedText', () => {
  it('extracts a single word', () => {
    const sel = {blockIndex: 0, wordIndex: 1};
    expect(extractSelectedText(blocks, sel, sel)).toBe('world');
  });

  it('extracts a range within a block', () => {
    expect(
      extractSelectedText(
        blocks,
        {blockIndex: 0, wordIndex: 0},
        {blockIndex: 0, wordIndex: 2},
      ),
    ).toBe('Hello world here');
  });

  it('extracts across blocks', () => {
    expect(
      extractSelectedText(
        blocks,
        {blockIndex: 0, wordIndex: 1},
        {blockIndex: 1, wordIndex: 1},
      ),
    ).toBe('world here Second block');
  });

  it('extracts correctly when the selection is reversed', () => {
    expect(
      extractSelectedText(
        blocks,
        {blockIndex: 1, wordIndex: 1},
        {blockIndex: 0, wordIndex: 1},
      ),
    ).toBe('world here Second block');
  });

  it('ignores missing blocks gracefully', () => {
    expect(
      extractSelectedText(
        blocks,
        {blockIndex: 0, wordIndex: 0},
        {blockIndex: 5, wordIndex: 0},
      ),
    ).toBe('Hello world here Second block line');
  });
});
