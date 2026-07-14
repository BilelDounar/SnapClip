import {
  extractSelectedText,
  isBeforeOrEqual,
  isWordSelected,
  orderSelection,
} from '../selection';
import type {OcrResultBlock} from '../../types';

const blocks: OcrResultBlock[] = [
  {
    text: 'Hello brave world',
    x: 0,
    y: 0,
    width: 100,
    height: 20,
    words: [
      {text: 'Hello', x: 0, y: 0, width: 30, height: 20},
      {text: 'brave', x: 35, y: 0, width: 30, height: 20},
      {text: 'world', x: 70, y: 0, width: 30, height: 20},
    ],
  },
  {
    text: 'second line',
    x: 0,
    y: 30,
    width: 80,
    height: 20,
    words: [
      {text: 'second', x: 0, y: 30, width: 40, height: 20},
      {text: 'line', x: 45, y: 30, width: 30, height: 20},
    ],
  },
];

describe('selection helpers', () => {
  it('orders anchors regardless of click order', () => {
    const a = {blockIndex: 1, wordIndex: 0};
    const b = {blockIndex: 0, wordIndex: 2};
    expect(orderSelection(a, b)).toEqual([b, a]);
    expect(isBeforeOrEqual(b, a)).toBe(true);
    expect(isBeforeOrEqual(a, b)).toBe(false);
  });

  it('marks only the start word when no end anchor', () => {
    const start = {blockIndex: 0, wordIndex: 1};
    expect(isWordSelected(start, null, 0, 1)).toBe(true);
    expect(isWordSelected(start, null, 0, 0)).toBe(false);
    expect(isWordSelected(null, null, 0, 0)).toBe(false);
  });

  it('marks every word inside a multi-block range', () => {
    const start = {blockIndex: 0, wordIndex: 1};
    const end = {blockIndex: 1, wordIndex: 0};
    expect(isWordSelected(start, end, 0, 0)).toBe(false);
    expect(isWordSelected(start, end, 0, 1)).toBe(true);
    expect(isWordSelected(start, end, 0, 2)).toBe(true);
    expect(isWordSelected(start, end, 1, 0)).toBe(true);
    expect(isWordSelected(start, end, 1, 1)).toBe(false);
  });

  it('is symmetric when anchors are reversed', () => {
    const start = {blockIndex: 1, wordIndex: 0};
    const end = {blockIndex: 0, wordIndex: 1};
    expect(isWordSelected(start, end, 0, 2)).toBe(true);
  });

  it('extracts a single word', () => {
    expect(
      extractSelectedText(
        blocks,
        {blockIndex: 0, wordIndex: 0},
        {blockIndex: 0, wordIndex: 0},
      ),
    ).toBe('Hello');
  });

  it('extracts words within one block joined by spaces', () => {
    expect(
      extractSelectedText(
        blocks,
        {blockIndex: 0, wordIndex: 0},
        {blockIndex: 0, wordIndex: 2},
      ),
    ).toBe('Hello brave world');
  });

  it('extracts across blocks with newlines and honours reversed anchors', () => {
    expect(
      extractSelectedText(
        blocks,
        {blockIndex: 1, wordIndex: 0},
        {blockIndex: 0, wordIndex: 2},
      ),
    ).toBe('world\nsecond');
  });

  it('is resilient to out-of-range indices', () => {
    expect(
      extractSelectedText(
        blocks,
        {blockIndex: 0, wordIndex: 0},
        {blockIndex: 5, wordIndex: 0},
      ),
    ).toBe('Hello brave world\nsecond line');
  });
});
