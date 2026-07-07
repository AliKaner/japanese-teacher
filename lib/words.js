import { WORDS } from "./data";

// Verilen kana ile başlayan kelimeler (きゃ gibi birleşiklerde startsWith)
export function wordsStartingWith(kana) {
  return WORDS.filter((w) => w.kana.startsWith(kana));
}

// Verilen kanjiyi içeren kelimeler
export function wordsContainingKanji(char) {
  return WORDS.filter((w) => w.w.includes(char));
}
