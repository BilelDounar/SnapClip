import type {OcrResultBlock} from '../nativeModules';
import type {SelectedWord} from '../store/useSnapClipStore';

/**
 * Logique pure de sélection de mots dans les blocs OCR.
 *
 * Extraite du composant Overlay pour être testable et réutilisable :
 * c'est le cœur du produit (sélection mot-à-mot puis extraction du texte),
 * il ne doit dépendre ni de React ni des modules natifs.
 */

/**
 * Ordre lexicographique (blockIndex, wordIndex).
 * Retourne <0 si a précède b, 0 si égaux, >0 si a suit b.
 */
export function compareSelection(a: SelectedWord, b: SelectedWord): number {
  if (a.blockIndex !== b.blockIndex) {
    return a.blockIndex - b.blockIndex;
  }
  return a.wordIndex - b.wordIndex;
}

/**
 * Réordonne deux bornes pour garantir [début, fin] dans l'ordre du document,
 * quel que soit le sens de sélection de l'utilisateur.
 */
export function orderSelection(
  a: SelectedWord,
  b: SelectedWord,
): [SelectedWord, SelectedWord] {
  return compareSelection(a, b) <= 0 ? [a, b] : [b, a];
}

/**
 * Indique si le mot (blockIndex, wordIndex) est compris dans la sélection.
 * - Aucune borne de départ : rien n'est sélectionné.
 * - Départ sans fin : seul le mot de départ est sélectionné.
 * - Départ + fin : intervalle inclusif, quel que soit le sens.
 */
export function isWordInSelection(
  blockIndex: number,
  wordIndex: number,
  start: SelectedWord | null,
  end: SelectedWord | null,
): boolean {
  if (!start) {
    return false;
  }
  const target: SelectedWord = {blockIndex, wordIndex};
  if (!end) {
    return compareSelection(start, target) === 0;
  }
  const [lo, hi] = orderSelection(start, end);
  return compareSelection(lo, target) <= 0 && compareSelection(target, hi) <= 0;
}

/**
 * Concatène le texte des mots compris entre deux bornes (incluses),
 * dans l'ordre du document, en traversant les blocs si nécessaire.
 */
export function extractSelectedText(
  blocks: OcrResultBlock[],
  start: SelectedWord,
  end: SelectedWord,
): string {
  const [lo, hi] = orderSelection(start, end);
  const words: string[] = [];
  for (let b = lo.blockIndex; b <= hi.blockIndex; b++) {
    const block = blocks[b];
    if (!block) {
      continue;
    }
    const startWord = b === lo.blockIndex ? lo.wordIndex : 0;
    const endWord = b === hi.blockIndex ? hi.wordIndex : block.words.length - 1;
    for (let w = startWord; w <= endWord; w++) {
      words.push(block.words[w]?.text ?? '');
    }
  }
  return words.join(' ');
}
