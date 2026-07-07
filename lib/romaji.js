// Kana (hiragana + katakana) → romaji dönüştürücü
import { KANA_GROUPS } from "./data";

const MAP = {};
for (const group of KANA_GROUPS) {
  for (const row of group.rows) {
    for (const cell of row) {
      if (!cell) continue;
      MAP[cell.h] = cell.r;
      MAP[cell.k] = cell.r;
    }
  }
}
// Küçük ünlüler ve özel işaretler
Object.assign(MAP, {
  "ぁ":"a","ぃ":"i","ぅ":"u","ぇ":"e","ぉ":"o",
  "ァ":"a","ィ":"i","ゥ":"u","ェ":"e","ォ":"o",
  "ゃ":"ya","ゅ":"yu","ょ":"yo","ャ":"ya","ュ":"yu","ョ":"yo",
  "ヴ":"vu","ゎ":"wa","ヮ":"wa",
});

const SOKUON = new Set(["っ", "ッ"]);

export function kanaToRomaji(text) {
  let out = "";
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    // Küçük tsu: sonraki hecenin ilk sessizini ikile
    if (SOKUON.has(ch)) {
      const rest = kanaToRomaji(text.slice(i + 1));
      const first = rest[0];
      out += first && /[bcdfghjklmnpqrstvwz]/.test(first) ? first + rest : "t" + rest;
      return out;
    }
    // Uzatma çizgisi: önceki ünlüyü uzat
    if (ch === "ー") {
      const last = out[out.length - 1];
      out += /[aiueo]/.test(last || "") ? last : "";
      i++;
      continue;
    }
    // Önce iki karakterli birleşimler (きゃ, シュ...)
    const two = text.slice(i, i + 2);
    if (two.length === 2 && MAP[two]) {
      out += MAP[two];
      i += 2;
      continue;
    }
    // Küçük ya/yu/yo ile birleşim (haritada olmayan kombinasyonlar)
    const small = MAP[text[i + 1]];
    if (small && ["ya","yu","yo"].includes(small) && MAP[ch]) {
      const base = MAP[ch];
      if (base.endsWith("i")) {
        const stem = base === "shi" ? "sh" : base === "chi" ? "ch" : base === "ji" ? "j" : base.slice(0, -1) + "y";
        out += stem + small[1];
        i += 2;
        continue;
      }
    }
    out += MAP[ch] !== undefined ? MAP[ch] : ch;
    i++;
  }
  return out;
}

// Bir kana ile başlayan kelimeleri bul (birleşik seslerde startsWith)
export function katakanaToHiragana(text) {
  return text.replace(/[ァ-ヶ]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}
