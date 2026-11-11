// Lip flaps for characters who speak a quoted line, driven by the real word timings (words.json from
// scripts/align_words.py). The narrator is never lip-synced: only the words of a quote, said by its character.
// Each word opens the mouth once per syllable (a rough vowel count), quantised to 4 steps so the canvas pool can
// reuse drawings. Idea from the GrowKaz Stickman plugin's talkAmount(); the code is ours.
import type { Word } from "./Captions";

const syllables = (w: string) => Math.max(1, (w.toLowerCase().replace(/[^a-z]/g, "").match(/[aeiouy]+/g) ?? []).length);

/** mouth open 0..1 at time t (s) while the words with index in [i0, i1] are spoken */
export const talkAt = (words: Word[], t: number, i0: number, i1: number) => {
  for (let i = i0; i <= i1 && i < words.length; i++) {
    const w = words[i];
    if (t < w.start - 0.02 || t > w.end) continue;
    const n = syllables(w.word), u = Math.min(0.999, Math.max(0, (t - w.start) / Math.max(0.05, w.end - w.start)));
    const open = Math.sin(Math.PI * ((u * n) % 1));
    return Math.round(open * 4) / 4;
  }
  return 0;
};

/** index range of a quoted line: from the word that opens the quote to the one that closes it, inside sentence s */
export const quoteRange = (words: Word[], s: number): [number, number] => {
  const ix = words.map((w, i) => [w, i] as const).filter(([w]) => w.sentence === s);
  const a = ix.find(([w]) => /^["“]/.test(w.word))?.[1] ?? ix[0][1];
  const b = [...ix].reverse().find(([w]) => /["”][.,!?]?$|[.,!?]["”]$/.test(w.word))?.[1] ?? ix[ix.length - 1][1];
  return [a, b];
};
