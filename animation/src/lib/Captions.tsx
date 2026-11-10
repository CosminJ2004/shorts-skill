// Viral word-by-word captions, driven by a short's words.json (scripts/make_voice.py). Shared by every short.
// The style is the one that dominates high-view Shorts:
//   - 1-2 words per "page", heavy uppercase sans, thick black outline and a hard drop shadow;
//   - the spoken word turns yellow; numbers and names turn green;
//   - every page pops in (scale overshoot over ~5 frames) and the active word gets a small bump.
// Placement: centre at 64 % of the height, inside the reference caption band (60-74 %), clear of the Shorts UI.
// Render as its own transparent layer (CaptionsLayer) and composite with ffmpeg, so captions can be tuned without
// re-rendering the 3D picture (see animation/README.md).
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

export type Word = { word: string; start: number; end: number; sentence?: number };
export type CaptionStyle = {
  y: number; // centre of the caption line, fraction of the height
  size: number; // font size in px at 1080 width
  maxChars: number; // a page holds words up to this many letters
  maxWords: number;
  hot: string; // the spoken word
  key: string; // numbers and names when spoken
  font: string;
};
export const VIRAL: CaptionStyle = {
  y: 0.63, size: 118, maxChars: 12, maxWords: 2, hot: "#FFE14D", key: "#62F06B",
  font: '"Segoe UI Black", "Arial Black", Impact, sans-serif',
};

const NUMBER_WORDS = new Set(("zero one two three four five six seven eight nine ten eleven twelve twenty thirty forty fifty " +
  "hundred thousand million billion twice half first second third").split(" "));
const clean = (w: string) => w.replace(/[^\p{L}\p{N}'%$-]/gu, "");
/** numbers, number words and names inside a sentence (a capital that does not start the sentence) */
const isKey = (words: Word[], i: number) => {
  const w = clean(words[i].word);
  if (/\d/.test(w) || NUMBER_WORDS.has(w.toLowerCase())) return true;
  const first = i === 0 || words[i - 1].sentence !== words[i].sentence;
  return !first && /^\p{Lu}/u.test(w) && w !== "I";
};

type Page = { from: number; to: number; idx: number[] };
/** split into pages: break at sentence ends, commas, maxWords or maxChars; a page lasts until the next one starts */
export const paginate = (words: Word[], st: CaptionStyle): Page[] => {
  const pages: Page[] = [];
  let cur: number[] = [];
  const flush = () => { if (cur.length) pages.push({ from: words[cur[0]].start, to: 0, idx: cur }); cur = []; };
  words.forEach((w, i) => {
    const len = cur.reduce((n, k) => n + clean(words[k].word).length + 1, 0) + clean(w.word).length;
    if (cur.length && (cur.length >= st.maxWords || len > st.maxChars || words[cur[cur.length - 1]].sentence !== w.sentence)) flush();
    cur.push(i);
    if (/[.,!?;:]$/.test(w.word)) flush();
  });
  flush();
  pages.forEach((p, k) => { p.to = k + 1 < pages.length ? pages[k + 1].from : words[p.idx[p.idx.length - 1]].end + 0.4; });
  return pages;
};

const pop = (x: number) => (x <= 0 ? 0.6 : x >= 1 ? 1 : 1 + 0.12 * Math.sin(x * Math.PI) * 1.4 - 0.4 * (1 - x) ** 3);

/** [fromFrame, toFrame, y]: move the line where a close-up face would sit under it (never cover a face) */
export type CaptionZone = [number, number, number];

export const Captions: React.FC<{ words: Word[]; style?: CaptionStyle; lead?: number; zones?: CaptionZone[] }> = ({ words, style = VIRAL, lead = 1, zones = [] }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const k = width / 1080;
  const t = (frame + lead) / fps; // show each word a frame early: the eye reads before the ear hears
  const pages = React.useMemo(() => paginate(words, style), [words, style]);
  const p = pages.find((q) => t >= q.from && t < q.to);
  if (!p) return null;
  const age = (t - p.from) * fps; // frames since the page appeared
  const s = pop(age / 5);
  const y = zones.find(([a, b]) => frame >= a && frame < b)?.[2] ?? style.y;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{
        position: "absolute", left: 40 * k, right: 40 * k, top: height * y, transform: `translateY(-50%) scale(${s})`,
        display: "flex", justifyContent: "center", flexWrap: "wrap", gap: `0 ${0.28 * style.size * k}px`,
        fontFamily: style.font, fontWeight: 900, fontSize: style.size * k, lineHeight: 1.05, letterSpacing: -1 * k,
        textTransform: "uppercase", textAlign: "center",
      }}>
        {p.idx.map((i) => {
          const w = words[i], on = t >= w.start && t < (words[i + 1]?.start ?? p.to);
          const bump = on ? 1 + 0.08 * Math.max(0, 1 - ((t - w.start) * fps) / 4) : 1;
          return (
            <span key={i} style={{
              color: on ? (isKey(words, i) ? style.key : style.hot) : "#FFFFFF",
              WebkitTextStroke: `${0.13 * style.size * k}px #000`, paintOrder: "stroke fill",
              textShadow: `0 ${0.07 * style.size * k}px 0 rgba(0,0,0,0.85)`,
              display: "inline-block", transform: `scale(${bump})`,
            }}>{clean(w.word) || w.word}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** transparent captions-only layer for compositing (render with ProRes 4444 or a PNG sequence) */
export const CaptionsLayer: React.FC<{ words: Word[]; style?: CaptionStyle; zones?: CaptionZone[] }> = ({ words, style, zones }) => (
  <AbsoluteFill style={{ background: "transparent" }}><Captions words={words} style={style} zones={zones} /></AbsoluteFill>
);
