export interface OcrResultWord {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OcrResultBlock {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  words: OcrResultWord[];
}

export interface OcrResult {
  text: string;
  blocks: OcrResultBlock[];
}

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}
