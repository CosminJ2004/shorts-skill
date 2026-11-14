"""Sound for "The Shoe Computer": an original synthesized score (a swinging 1960s lounge-jazz groove in C: walking pizz
bass, brushes, vibraphone comping and a glock/vibes hook, with brass stabs on the punchlines) plus SFX locked to the
narration's real word times (voice/words.json), so a new voice take re-times the sound too.

Uses the cartoon-3d-short skill's synthesis blocks (dsp.py, instruments.py, sfx_gen.py). Output: audio/mix.wav (48 kHz
stereo, exact length) plus stems. Loudness is set when muxing (-14 LUFS, -1.5 dBTP).
"""
import json
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
R = rng(1961)
WORDS = json.loads((HERE / "voice" / "words.json").read_text(encoding="utf-8"))
LINES = [[w for w in WORDS if w["sentence"] == i] for i in range(NL)]
LS = [ln[0]["start"] for ln in LINES]
LE = [ln[-1]["end"] for ln in LINES]
DUR = LE[-1] + 45 / FPS
N = ns(DUR)


def w(i, k):
    """start (s) of the k-th word of line i (negative k from the end)"""
    return LINES[i][k]["start"]


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
    """a small, dry switch click"""
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


# ---------------------------------------------------------------- score
BPM = 126
Q = 60 / BPM
CH = {"C": [48, 52, 55, 59], "A7": [45, 49, 52, 55], "Dm": [50, 53, 57, 60], "G7": [43, 47, 50, 53], "Fm": [41, 44, 48, 51], "Em": [52, 55, 59, 62]}
PROG = ["C", "A7", "Dm", "G7"]
HOOK = [76, 79, 77, 74, 72, 74, 76, 69, 71, 72, 74, 79, 76, 72, 69, 67]  # a cheeky vibes/glock tune


def lounge(music, t0, t1, vel=0.6, hook=True, major=True, density=1.0):
    """swing 4/4: walking bass on every beat, brushes on 2 and 4, vibes comping, a hook note on the off-beats"""
    nb = int(np.ceil((t1 - t0) / (4 * Q)))
    mi = 0
    prog = PROG if major else ["Fm", "A7", "Dm", "G7"]
    for b in range(nb):
        name = prog[b % len(prog)]
        ch = CH[name]
        walk = [ch[0], ch[1], ch[2], ch[1] + 1 if b % 2 else ch[2] - 1]
        for k in range(4):
            t = t0 + (b * 4 + k) * Q
            if t >= t1:
                break
            place(music, pan(I.pluck(I.m2f(walk[k] - 12 + (0 if k < 3 else 0)), 0.55 * vel, R, 0.3, bright=0.45, pos=0.2), -0.15), t, 0.9)
            if k in (1, 3):
                place(music, pan(I.brush(0.4 * vel, R, 0.3, swish=True), 0.1), t, 0.55)
            if k in (0, 2) and density > 0.7:
                place(music, pan(I.brush(0.2 * vel, R, 0.25), -0.1), t + Q * 0.66, 0.4)
            if k in (0, 2):  # comping chord on the swung off-beat
                for j, m in enumerate(ch):
                    place(music, pan(I.vibes(I.m2f(m + 12), 0.28 * vel, R, 0.7), 0.2), t + Q * 0.66 + j * 0.006, 0.5)
            if hook and k in (1, 3) and (b % 2 == 0):
                place(music, pan(I.glock(I.m2f(HOOK[mi % len(HOOK)] + 12), 0.42 * vel, R, 1.0), 0.28), t + Q * 0.33, 0.5)
                mi += 1


def score():
    music = buf()
    lounge(music, 0.0, LS[2] - 0.1, 0.65)
    lounge(music, LS[2], LS[5] - 0.1, 0.7, hook=True)
    # the forty-four percent: a rising chromatic run, then the beat drops out for "five"
    for k, m in enumerate([60, 62, 64, 65, 67, 69, 71, 72]):
        place(music, I.vibes(I.m2f(m + 12), 0.5, R, 0.8), w(5, 7) + k * 0.05, 0.55)
    lounge(music, LS[5] + 0.3, LS[7] - 0.1, 0.7)
    place(music, I.brass(I.m2f(48), 0.5, 0.55, R, kind="soft", fall=-0.06), w(6, -1) - 0.1, 0.4)
    # Vegas: bright, brassy stab and a faster feel
    lounge(music, LS[7], LS[8] - 0.1, 0.8, density=1.2)
    # the nervous bit: a minor-key walk, a tense pad
    lounge(music, LS[8], w(8, -1) - 0.05, 0.6, hook=False, major=False)
    place(music, I.pad([I.m2f(41), I.m2f(48), I.m2f(51)], w(8, -1) - w(8, 7), 0.28, R, att=0.4, rel=0.4), w(8, 7), 0.5)
    for k, m in enumerate([52, 51, 50, 49]):  # sad trombone on "quit"
        place(music, I.brass(I.m2f(m), 0.28 if k < 3 else 0.8, 0.5, R, kind="soft", fall=-0.08 if k == 3 else 0.0), w(8, -1) + 0.15 + k * 0.26, 0.45)
    lounge(music, LS[9], LS[10] - 0.1, 0.6)
    # the museum: a music-box version of the hook
    for k, m in enumerate(HOOK[:10]):
        t = LS[10] + 0.1 + k * Q * 0.75
        if t < LS[11] - 0.2:
            place(music, pan(I.musicbox(I.m2f(m + 12), 0.5, R, 1.0), 0.1), t, 0.55)
    lounge(music, LS[11], LS[13] - 0.1, 0.7)
    lounge(music, LS[13], LS[14] - 0.05, 0.8, density=1.2)
    lounge(music, LS[14], DUR - 0.5, 0.65, hook=False)
    # stings on the punchlines
    for t, gain in [(w(0, -1), 0.8), (w(2, -1), 0.7), (w(8, -1), 0.0), (w(12, -1), 0.8), (w(14, -1), 1.0)]:
        if gain:
            place(music, I.timpani(I.m2f(43), 0.8, R), t, gain * 0.8)
            place(music, I.brass(I.m2f(55), 0.5, 0.65, R, kind="horn"), t, 0.35 * gain)
    place(music, I.cymbal(0.7, R, 2.4), w(14, -1), 0.6)
    for k, m in enumerate([72, 76, 79, 84, 88]):
        place(music, I.glock(I.m2f(m), 0.55, R, 1.6), w(14, -1) + 0.05 + k * 0.06, 0.6)
    return music


# ---------------------------------------------------------------- sfx
def sfx():
    out = buf()
    # room tone per place: casino murmur and slots, lab hum, street night, museum hush, office hum
    casino, lab, street, museum, desk = (0, 3, 8, 14), (1, 2, 4, 5), (7,), (10,), (13,)
    for i in range(NL):
        a, b = LS[i] - 0.13, (LS[i + 1] - 0.13 if i < NL - 1 else DUR)
        d = b - a
        if i in casino:
            place(out, G.babble(d, R, 150, 1.0) * 0.13, a, 0.6)
            for k in range(int(d * 0.9)):
                place(out, pan(I.glock(I.m2f(R.choice([84, 88, 91, 93])), 0.3, R, 0.5), R.uniform(-0.8, 0.8)), a + R.uniform(0, d), 0.12)
        elif i in lab:
            place(out, pan(lp(colored(ns(d), R, -1.2), 180) * 0.25, 0.0), a, 0.8)
        elif i in street:
            place(out, G.breeze(d, R, 0.5), a, 0.3)
            place(out, G.babble(d, R, 140, 1.0) * 0.1, a, 0.5)
        elif i in desk:
            place(out, pan(lp(colored(ns(d), R, -1.0), 260) * 0.18, 0.0), a, 0.8)
        else:
            place(out, pan(lp(colored(ns(d), R, -1.2), 220) * 0.12, 0.0), a, 0.8)
    # hook: the roulette ball clatters round the wheel, ticking slower, then a win flourish on "roulette"
    t = LS[0] + 0.3
    gap = 0.07
    while t < w(0, -1):
        place(out, pan(tick(2600 + 600 * R.random()), 0.1), t, 0.35)
        t += gap
        gap = min(0.22, gap * 1.07)
    for k, m in enumerate([84, 88, 91, 96]):
        place(out, I.glock(I.m2f(m), 0.5, R, 1.4), w(0, -1) + 0.02 + k * 0.05, 0.6)
    place(out, boing(0.6, 200, 800, 0.4), w(0, 9) - 0.02, 0.4)  # the computer pops in the shoes
    for k in range(3):
        place(out, pan(click(1400 + 300 * k), (k - 1) * 0.3), w(0, 9) + 0.12 + 0.1 * k, 0.4)
    # Shannon: a lightbulb "ding", the phone buzz
    place(out, I.glock(I.m2f(91), 0.6, R, 1.6), w(1, 9), 0.55)
    place(out, I.glock(I.m2f(96), 0.5, R, 1.6), w(1, 9) + 0.07, 0.45)
    for k in range(3):
        place(out, pan(G.whoosh(0.2, R, peak=0.05, f_lo=1500, f_hi=5000) * 0.5, 0.5), w(1, 14) + 0.05 + k * 0.18, 0.35)
    # chalk scratches, the apple drops and bonks
    for k in range(6):
        place(out, hp(colored(ns(0.18), R, 0.0), 2500) * np.exp(-tt(0.18) / 0.06) * 0.4, LS[2] + 0.4 + k * 0.5, 0.3)
    place(out, G.whoosh(0.3, R, peak=0.3, f_lo=300, f_hi=2000), w(2, 13) - 0.2, 0.4)
    place(out, thud(1.8, 0.4, 300), w(2, 14), 0.8)
    place(out, boing(0.8, 250, 900, 0.5), w(2, 14) + 0.05, 0.4)
    # the stopwatch ticks while the ball is timed; the slice lights with a chime
    t = w(3, 6)
    while t < w(3, 17):
        place(out, pan(tick(3600), 0.35), t, 0.4)
        t += 0.25
    place(out, I.glock(I.m2f(88), 0.7, R, 1.6), w(3, 17), 0.6)
    # twelve transistors: little pops as they appear; the switches click on every "toe"
    for k in range(6):
        place(out, pop(700 + 70 * k) * 0.6, w(4, 3) + k * 0.07, 0.35)
    for k in range(5):
        place(out, pan(click(1500 + 100 * (k % 3)), -0.2), w(4, 16) + k * 0.22, 0.6)
    # the basement test: a rising buzz and a cheer as the bar fills
    place(out, G.whoosh(0.7, R, peak=0.8, f_lo=300, f_hi=2600), w(5, 7), 0.5)
    place(out, G.applause(LE[5] - w(5, 8) + 0.6, R, 20) * 0.6, w(5, 8) + 0.3, 0.4)
    # forty-four vs five: a "wah wah" and cash fluttering out of the roller's pockets
    for k in range(4):
        place(out, pan(G.whoosh(0.15, R, peak=0.05, f_lo=1500, f_hi=6000) * 0.4, R.uniform(-0.5, 0.5)), w(6, 7) + 0.05 + k * 0.1, 0.35)
    # Vegas: a jet pass, a neon buzz, a doorbell chime
    place(out, G.whoosh(1.6, R, peak=0.45, f_lo=150, f_hi=1500), LS[7] - 0.1, 0.7)
    place(out, I.glock(I.m2f(91), 0.55, R, 1.4), w(7, 6), 0.5)
    for k in range(4):
        place(out, G.stroll_step(R, 0.5) * 0.5, LS[7] + 0.9 + k * 0.38, 0.35)
    # the nerves: heartbeat thumps; the guard's whistle; the run
    t = w(8, 7)
    while t < w(8, 13):
        place(out, thud(1.4, 0.25, 90), t, 0.7)
        t += 0.36
    whis = np.sin(2 * np.pi * np.cumsum(2900 + 300 * np.sign(np.sin(2 * np.pi * 28 * tt(0.5)))) / SR) * fades(np.ones(ns(0.5)), 0.02, 0.1) * 0.35
    place(out, whis, w(8, 10) - 0.05, 0.5)
    place(out, G.whoosh(0.5, R, peak=0.2, f_lo=300, f_hi=2500), w(8, 13) - 0.05, 0.5)
    for k in range(6):
        place(out, G.stroll_step(R, 0.6) * 0.7, w(8, 13) + 0.05 + k * 0.1, 0.4)
    # five years: calendar pages whoosh; the Guinness record fanfare
    for k in range(5):
        place(out, G.whoosh(0.22, R, peak=0.08, f_lo=700, f_hi=3500) * 0.5, w(9, 3) + k * 0.2, 0.4)
    place(out, hp(colored(ns(0.25), R, 0.0), 2000) * np.exp(-tt(0.25) / 0.08), w(9, 3) - 0.05, 0.4)
    for k, m in enumerate([72, 76, 79, 84]):
        place(out, I.brass(I.m2f(m), 0.2, 0.55, R, kind="horn"), w(9, 7) - 0.05 + k * 0.09, 0.4)
    place(out, G.applause(LE[9] - w(9, 7) + 0.4, R, 24) * 0.7, w(9, 7) + 0.1, 0.4)
    # the museum: echoey steps, a "ding" for the heart eyes
    for k in range(3):
        place(out, G.stroll_step(R, 0.4) * 0.4, LS[10] + 0.1 + k * 0.5, 0.3)
    place(out, I.glock(I.m2f(96), 0.5, R, 1.6), w(10, 10), 0.5)
    place(out, boing(0.6, 300, 1200, 0.5), w(10, 10) + 0.05, 0.4)
    # the wheel is tossed away (whoosh, crash); the market screen pops with a blip
    place(out, G.whoosh(0.5, R, peak=0.25, f_lo=250, f_hi=2000), w(11, 9) - 0.1, 0.5)
    place(out, G.clink(R, f0=900, dur=0.2), w(11, 9) + 0.55, 0.5)
    place(out, pop(950) * 1.2, w(11, -1) - 0.05, 0.6)
    for k in range(4):
        place(out, pan(I.glock(I.m2f(79 + 3 * k), 0.4, R, 0.4), 0.3), w(11, -1) + 0.1 + k * 0.08, 0.35)
    # the chips: a stack clacks, the tower wobbles and collapses
    place(out, chips(3) * 0.8, LS[12] + 0.5, 0.5)
    place(out, chips(6) * 0.7, w(12, 5), 0.5)
    place(out, G.creak(0.8, R, rate0=60, rate1=110, scale=0.3), w(12, 9), 0.3)
    place(out, thud(2.0, 0.4, 200), w(12, 15) - 0.02, 0.8)
    place(out, chips(10) * 1.1, w(12, 15) + 0.02, 0.7)
    place(out, G.whoosh(0.4, R, peak=0.2, f_lo=300, f_hi=2000), w(12, 15) - 0.15, 0.4)
    # the trading desk: a blip per screen, a ping
    for k in range(5):
        place(out, pan(I.glock(I.m2f(84 + 2 * (k % 3)), 0.35, R, 0.5), R.uniform(-0.6, 0.6)), LS[13] + 0.2 + k * 0.45, 0.3)
    place(out, pop(850) * 1.2, w(13, 8) - 0.05, 0.6)
    # the last gag: a toe-click, a ping
    place(out, click(1500) * 2.0, w(14, -1) + 0.02, 0.9)
    place(out, I.glock(I.m2f(91), 0.55, R, 1.4), w(14, -1) + 0.05, 0.5)
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
