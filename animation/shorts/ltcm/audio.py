"""Sound for "The Nickel Trap" (LTCM): an original synthesized caper score (a bouncy major groove that turns minor when
Russia defaults, with brass stings) plus SFX locked to the narration's real word times (voice/words.json), so a new voice
take re-times the sound too. Uses the cartoon-3d-short skill's synthesis blocks (dsp.py, instruments.py, sfx_gen.py).
Output: audio/mix.wav (48 kHz stereo, exact length) plus stems. Loudness is set when muxing (-14 LUFS, -1.5 dBTP).
"""
import json
import re
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[2] / ".claude" / "skills" / "cartoon-3d-short" / "templates" / "audio"))
from dsp import SR, ns, tt, rng, lp, hp, bp, colored, fades, place, dbg, pan, modal, read_wav, write_wav  # noqa: E402
import instruments as I  # noqa: E402
import sfx_gen as G  # noqa: E402

FPS = 30
NL = 15
R = rng(1998)
WORDS = json.loads((HERE / "voice" / "words.json").read_text(encoding="utf-8"))
LINES = [[w for w in WORDS if w["sentence"] == i] for i in range(NL)]
LS = [ln[0]["start"] for ln in LINES]
LE = [ln[-1]["end"] for ln in LINES]
DUR = LE[-1] + 45 / FPS
N = ns(DUR)
_norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())  # noqa: E731


def w(i, k):
    """start (s) of the k-th word of line i (negative k from the end)"""
    return LINES[i][k]["start"]


def ww(i, text, n=0):
    """start (s) of the n-th word of line i that reads `text` (falls back to the line start), like wfw in story.ts"""
    hits = [x for x in LINES[i] if _norm(x["word"]) == _norm(text)]
    return (hits[n] if n < len(hits) else LINES[i][0])["start"]


def buf():
    return np.zeros((2, N))


def thud(gain=2.0, dur=0.8, f=150):
    return lp(R.standard_normal(ns(dur)), f) * np.exp(-tt(dur) / 0.14) * gain


def pop(f0=520):
    return modal(0.25, [(f0, 1.0, 0.05), (f0 * 1.9, 0.4, 0.03)], R, glide=0.6, glide_tau=0.03) * 0.8


def poof(gain=1.0):
    return lp(colored(ns(0.6), R, -0.5), 1800) * np.exp(-tt(0.6) / 0.15) * 1.2 * gain


def boing(gain=1.0, f0=180, f1=520, dur=0.45):
    t = tt(dur)
    f = f0 + (f1 - f0) * (1 - np.exp(-t / 0.06)) + 40 * np.sin(2 * np.pi * 18 * t) * np.exp(-t / 0.2)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.18) * 0.7 * gain


def tick(f0=3200):
    x = modal(0.05, [(f0, 0.4, 0.01)], R)
    x[: ns(0.03)] += hp(colored(ns(0.03), R, 0.0), 2000) * np.exp(-tt(0.03) / 0.004) * 0.8
    return x


def click(f0=1800):
    x = modal(0.04, [(f0, 0.6, 0.008), (f0 * 2.3, 0.3, 0.006)], R)
    x[: ns(0.01)] += hp(colored(ns(0.01), R, 0.0), 3000) * 0.8
    return x


def chips(n=4):
    out = np.zeros(ns(0.8))
    for k in range(n):
        c = G.clink(R, f0=R.uniform(2800, 4200), dur=0.07)
        s = ns(0.05 * k + R.uniform(0, 0.02))
        out[s: s + len(c)] += c[: len(out) - s] * (0.6 + 0.4 * R.random())
    return out


def rip(dur=0.5):
    return hp(colored(ns(dur), R, 0.0), 1500) * np.exp(-tt(dur) / 0.16) * (0.6 + 0.4 * np.sin(2 * np.pi * 70 * tt(dur)))


def phone_ring(dur=0.9):
    t = tt(dur)
    gate = (np.sin(2 * np.pi * 14 * t) > 0).astype(float) * (t < 0.7)
    return (np.sin(2 * np.pi * 1400 * t) * 0.5 + np.sin(2 * np.pi * 1700 * t) * 0.4) * gate * fades(np.ones(ns(dur)), 0.01, 0.1) * 0.5


# ---------------------------------------------------------------- score
BPM = 120
Q = 60 / BPM
CH = {"C": [48, 52, 55, 59], "A7": [45, 49, 52, 55], "Dm": [50, 53, 57, 60], "G7": [43, 47, 50, 53], "Fm": [41, 44, 48, 51], "Am": [45, 48, 52, 55], "E7": [40, 44, 47, 50]}
PROG = ["C", "A7", "Dm", "G7"]
MINOR = ["Am", "Fm", "Dm", "E7"]
HOOK = [76, 79, 77, 74, 72, 74, 76, 69, 71, 72, 74, 79, 76, 72, 69, 67]


def groove(music, t0, t1, vel=0.6, hook=True, minor=False, density=1.0):
    """bouncy 4/4: walking bass, brushes on 2 and 4, vibes comping on the off-beats, a glock hook"""
    nb = int(np.ceil((t1 - t0) / (4 * Q)))
    mi = 0
    prog = MINOR if minor else PROG
    for b in range(nb):
        ch = CH[prog[b % len(prog)]]
        walk = [ch[0], ch[1], ch[2], ch[1] + 1 if b % 2 else ch[2] - 1]
        for k in range(4):
            t = t0 + (b * 4 + k) * Q
            if t >= t1:
                break
            place(music, pan(I.pluck(I.m2f(walk[k] - 12), 0.55 * vel, R, 0.3, bright=0.45, pos=0.2), -0.15), t, 0.9)
            if k in (1, 3):
                place(music, pan(I.brush(0.4 * vel, R, 0.3, swish=True), 0.1), t, 0.55)
            if k in (0, 2) and density > 0.7:
                place(music, pan(I.brush(0.2 * vel, R, 0.25), -0.1), t + Q * 0.66, 0.4)
            if k in (0, 2):
                for j, m in enumerate(ch):
                    place(music, pan(I.vibes(I.m2f(m + 12), 0.28 * vel, R, 0.7), 0.2), t + Q * 0.66 + j * 0.006, 0.5)
            if hook and k in (1, 3) and (b % 2 == 0):
                place(music, pan(I.glock(I.m2f(HOOK[mi % len(HOOK)] + 12 - (3 if minor else 0)), 0.42 * vel, R, 1.0), 0.28), t + Q * 0.33, 0.5)
                mi += 1


def score():
    music = buf()
    groove(music, 0.0, ww(0, "lost") - 0.05, 0.65)
    groove(music, LS[1], LS[5] - 0.1, 0.7)
    groove(music, LS[5], LS[6] - 0.1, 0.8, density=1.2)
    # Russia defaults: the groove turns minor and tense through the loss
    groove(music, LS[6], ww(10, "gone") - 0.05, 0.6, hook=False, minor=True)
    place(music, I.pad([I.m2f(45), I.m2f(52), I.m2f(55)], LE[8] - LS[6], 0.26, R, att=0.5, rel=0.5), LS[6], 0.5)
    for k, m in enumerate([52, 51, 50, 49]):  # sad trombone on "gone"
        place(music, I.brass(I.m2f(m), 0.28 if k < 3 else 0.8, 0.5, R, kind="soft", fall=-0.08 if k == 3 else 0.0), ww(10, "gone") + 0.1 + k * 0.26, 0.45)
    # the rescue: major again, hopeful
    groove(music, LS[11], LS[12] - 0.1, 0.7)
    groove(music, LS[12], LS[13] - 0.05, 0.7)
    groove(music, LS[13], LS[14] - 0.05, 0.75)
    groove(music, LS[14], DUR - 0.5, 0.65, hook=False)
    for t, gain in [(ww(0, "months"), 0.8), (ww(0, "Prizes"), 0.7), (ww(6, "defaulted"), 0.9), (ww(11, "crash"), 0.7), (w(14, -1), 1.0)]:
        place(music, I.timpani(I.m2f(43), 0.8, R), t, gain * 0.8)
        place(music, I.brass(I.m2f(55), 0.5, 0.65, R, kind="horn"), t, 0.35 * gain)
    place(music, I.cymbal(0.7, R, 2.4), w(14, -1), 0.6)
    for k, m in enumerate([72, 76, 79, 84, 88]):
        place(music, I.glock(I.m2f(m), 0.55, R, 1.6), w(14, -1) + 0.05 + k * 0.06, 0.6)
    return music


# ---------------------------------------------------------------- sfx
def sfx():
    out = buf()
    office, hall = (1, 3, 5, 8, 10), (11,)
    for i in range(NL):
        a, b = LS[i] - 0.13, (LS[i + 1] - 0.13 if i < NL - 1 else DUR)
        d = b - a
        if i in office:
            place(out, pan(lp(colored(ns(d), R, -1.0), 260) * 0.16, 0.0), a, 0.8)
            place(out, G.babble(d, R, 140, 1.0) * 0.07, a, 0.5)
        elif i in hall:
            place(out, pan(lp(colored(ns(d), R, -1.2), 200) * 0.12, 0.0), a, 0.8)
        else:
            place(out, pan(lp(colored(ns(d), R, -1.2), 220) * 0.10, 0.0), a, 0.8)
    # 0 the hook: the pile deflates (a falling whoosh), the flash thud; two medals ding
    place(out, G.whoosh(1.4, R, peak=0.3, f_lo=2500, f_hi=300), ww(0, "lost"), 0.55)
    place(out, thud(2.0, 0.5, 120), ww(0, "months") + 0.04, 0.9)
    for k, m in enumerate([88, 96]):
        place(out, I.glock(I.m2f(m), 0.6, R, 1.6), ww(0, "Nobel") + 0.1 * k + 0.15, 0.55)
    # 1 professors, trader, formula: three pops and a chime
    for key, f0 in [("Professors", 640), ("famous", 760)]:
        place(out, pop(f0) * 0.9, ww(1, key) - 0.02, 0.5)
    place(out, I.glock(I.m2f(91), 0.6, R, 1.6), ww(1, "formula"), 0.55)
    # 2 the bonds: a tick on "tiny", then a slide, a click and a ding on "closes"
    place(out, tick(3600), ww(2, "tiny"), 0.5)
    place(out, G.whoosh(0.25, R, peak=0.1, f_lo=500, f_hi=2500), ww(2, "closes") - 0.12, 0.4)
    place(out, click(1500) * 1.4, ww(2, "closes") + 0.12, 0.6)
    place(out, I.glock(I.m2f(96), 0.5, R, 1.6), ww(2, "closes") + 0.22, 0.5)
    # 3 nickels clink one by one; the loans rain down on "borrowed"
    for k in range(8):
        place(out, pan(G.clink(R, f0=R.uniform(3000, 4600), dur=0.12), R.uniform(-0.4, 0.4)), ww(3, "nickels") + 0.04 + 0.03 * k, 0.4)
    place(out, G.whoosh(0.6, R, peak=0.2, f_lo=1500, f_hi=300), ww(3, "borrowed") - 0.1, 0.45)
    for k in range(6):
        place(out, thud(1.2, 0.3, 200 + 20 * k), ww(3, "borrowed") + 0.3 + 0.12 * k, 0.55)
    # 4 the tower builds block by block (rising clacks) and the trader gapes
    for k in range(14):
        place(out, pan(click(1100 + 90 * k), 0.0), ww(4, "borrowed") + 0.06 * k, 0.35)
    place(out, boing(0.7, 220, 900, 0.5), ww(4, "twentyfive") - 0.05, 0.4)
    # 5 it worked: a rising buzz as the bar fills, sacks whoosh in
    place(out, G.whoosh(0.7, R, peak=0.8, f_lo=300, f_hi=2600), ww(5, "forty") - 0.1, 0.5)
    for k in range(4):
        place(out, G.whoosh(0.25, R, peak=0.1, f_lo=700, f_hi=2800) * 0.6, ww(5, "begged") + 0.2 * k, 0.4)
    place(out, G.applause(1.2, R, 14) * 0.5, ww(5, "worked"), 0.3)
    # 6 Russia defaults: the flag rips, a thud, a falling arrow whistle
    place(out, rip(0.5), ww(6, "defaulted") - 0.03, 0.9)
    place(out, thud(2.2, 0.5, 100), ww(6, "defaulted") + 0.05, 0.9)
    place(out, np.sin(2 * np.pi * np.cumsum(1800 - 1200 * np.linspace(0, 1, ns(0.7))) / SR) * fades(np.ones(ns(0.7)), 0.01, 0.2) * 0.3, ww(6, "defaulted") + 0.3, 0.4)
    # 7 everyone runs: steps and a whoosh; the gap stretches with a creak
    for k in range(10):
        place(out, G.stroll_step(R, 0.6) * 0.6, ww(7, "ran") + 0.14 * k, 0.4)
    place(out, G.creak(1.0, R, rate0=40, rate1=90, scale=0.3), ww(7, "wider") - 0.05, 0.4)
    # 8 a heartbeat of dread, then an arrow whistles down on "lost"
    t = LS[8]
    while t < w(8, -1):
        place(out, thud(1.4, 0.25, 90), t, 0.6)
        t += 0.4
    place(out, thud(2.0, 0.4, 110), ww(8, "billion") + 0.05, 0.8)
    # 9 the tower of losses: thud on "loss", then a crashing collapse on "harder"
    place(out, thud(1.6, 0.35, 160), ww(9, "loss"), 0.7)
    place(out, G.creak(0.7, R, rate0=60, rate1=110, scale=0.3), ww(9, "harder") - 0.35, 0.35)
    place(out, thud(2.2, 0.5, 140), ww(9, "harder") + 0.02, 0.9)
    place(out, chips(10) * 1.1, ww(9, "harder") + 0.04, 0.7)
    # 10 almost everything gone: wind and loose papers
    place(out, G.breeze(LE[10] - LS[10], R, 0.5), LS[10], 0.35)
    # 11 the Fed phones: rings, sacks drop into the net with a boing each, a hopeful ding
    place(out, phone_ring(0.9), ww(11, "called") - 0.2, 0.7)
    place(out, phone_ring(0.9), ww(11, "called") + 0.55, 0.6)
    for k in range(14):
        place(out, boing(0.4, 200 + 12 * k, 600 + 20 * k, 0.3), ww(11, "Fourteen") + 0.1 * k, 0.4)
    place(out, I.glock(I.m2f(91), 0.6, R, 1.6), ww(11, "crash"), 0.55)
    place(out, I.glock(I.m2f(96), 0.5, R, 1.6), ww(11, "crash") + 0.08, 0.45)
    # 12 Thorp: a toe click, small stacks clack, the tower wobbles and falls
    place(out, click(1500) * 1.8, ww(12, "Thorp") + 0.25, 0.8)
    place(out, chips(3) * 0.8, ww(12, "sized"), 0.5)
    place(out, G.creak(0.8, R, rate0=60, rate1=110, scale=0.3), ww(12, "wipe") - 0.5, 0.3)
    place(out, thud(2.0, 0.4, 200), ww(12, "wipe") - 0.02, 0.8)
    place(out, chips(10) * 1.1, ww(12, "wipe") + 0.02, 0.6)
    # 13 a check ding, the dial sweeps up (rising whoosh), an alarm buzz on "survive"
    place(out, I.glock(I.m2f(91), 0.55, R, 1.6), ww(13, "right"), 0.5)
    place(out, G.whoosh(0.9, R, peak=0.8, f_lo=300, f_hi=3000), ww(13, "big"), 0.5)
    place(out, np.sin(2 * np.pi * 540 * tt(0.5)) * (np.sin(2 * np.pi * 9 * tt(0.5)) > 0) * 0.3, ww(13, "survive"), 0.5)
    # 14 nickels clink, the steamroller rumbles in and flattens the last one
    for k in range(4):
        place(out, pan(G.clink(R, f0=R.uniform(3000, 4600), dur=0.12), R.uniform(-0.3, 0.3)), LS[14] + 0.2 + 0.18 * k, 0.4)
    place(out, pan(lp(colored(ns(LE[14] - ww(14, "steamroller") + 0.4), R, -0.6), 300) * 0.5 * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * tt(LE[14] - ww(14, "steamroller") + 0.4))), 0.1), ww(14, "steamroller") - 0.2, 0.6)
    place(out, thud(2.4, 0.6, 90), w(14, -1) + 0.02, 1.0)
    place(out, boing(0.8, 120, 700, 0.5), w(14, -1) + 0.12, 0.45)
    return out


def mix():
    v, sr = read_wav(str(HERE / "voice" / "voice.wav"))
    assert sr == SR, sr
    v = np.atleast_2d(v)
    if v.shape[0] == 1:
        v = np.vstack([v, v])
    voice = np.zeros((2, N)); voice[:, : min(N, v.shape[1])] = v[:, :N]
    key = np.zeros(N)
    for wd in WORDS:
        key[ns(max(0, wd["start"] - 0.08)): ns(wd["end"] + 0.15)] = 1.0
    key = np.convolve(key, np.ones(ns(0.12)) / ns(0.12), mode="same")
    music, fx = score(), sfx()
    rms = lambda x: np.sqrt(np.mean(x ** 2) + 1e-12)  # noqa: E731
    vr = rms(voice[:, voice.any(axis=0)])
    music *= (vr / rms(music)) * dbg(-13.0 + 3.0)
    fx *= (vr / rms(fx)) * dbg(-12.0)
    music *= dbg(-9.0) ** key[None, :]
    out = voice + music + fx
    out /= max(1e-6, np.abs(out).max()) / 0.89
    (HERE / "audio").mkdir(exist_ok=True)
    write_wav(str(HERE / "audio" / "mix.wav"), out)
    for name, x in [("voice", voice), ("music", music), ("sfx", fx)]:
        write_wav(str(HERE / "audio" / f"stem_{name}.wav"), x / max(1e-6, np.abs(x).max()) * 0.89)
    print(f"mix: {N / SR:.2f} s")


if __name__ == "__main__":
    mix()
