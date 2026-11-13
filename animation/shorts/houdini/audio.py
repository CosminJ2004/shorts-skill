"""Sound for "The Last Escape": an original synthesized score (a spooky-vaudeville waltz in E minor: pizzicato bass,
music-box and vibraphone, a ghostly "theremin" sine; it brightens to E major on the twist and the last line) plus SFX
locked to the narration's real word times (voice/words.json), so a new voice take re-times the sound too.

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
R = rng(1926)
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


def theremin(notes, t_note, gain=0.3):
    """a ghostly sine with slow vibrato and portamento between notes (midi list, seconds per note)"""
    dur = len(notes) * t_note + 0.6
    t = tt(dur)
    f = np.zeros_like(t)
    for k, m in enumerate(notes):
        f[ns(k * t_note):] = I.m2f(m)
    f = np.convolve(f, np.ones(ns(0.09)) / ns(0.09), mode="same")
    f[: ns(0.05)] = I.m2f(notes[0])
    f *= 1 + 0.012 * np.sin(2 * np.pi * 5.5 * t)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.15 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    return fades(x * gain, 0.15, 0.4)


def tick(f0=3200):
    x = modal(0.05, [(f0, 0.4, 0.01)], R)
    x[: ns(0.03)] += hp(colored(ns(0.03), R, 0.0), 2000) * np.exp(-tt(0.03) / 0.004) * 0.8
    return x


# ---------------------------------------------------------------- score
BPM = 138  # a waltz: 3 beats a bar
Q = 60 / BPM
CHM = {"Em": [52, 55, 59], "Am": [45, 48, 52], "B7": [47, 51, 54], "C": [48, 52, 55], "E": [52, 56, 59], "A": [45, 49, 52]}


def pizz(f, vel, dur=0.25):
    return I.pluck(f, vel, R, dur, bright=0.55, pos=0.2)


def waltz(music, t0, t1, vel=0.6, major=False, box=True):
    """oom-pah-pah: pizz bass on 1, stabs on 2 and 3; a music-box line on top every other bar"""
    prog = ["E", "A", "B7", "E"] if major else ["Em", "Am", "B7", "Em", "C", "Am", "B7", "Em"]
    mel = [71, 67, 64, 72, 69, 64, 71, 66, 63, 64, 67, 71, 72, 76, 72, 71, 69, 66, 64, 63, 64] if not major else [68, 71, 76, 73, 69, 76, 75, 71, 66, 68, 71, 76]
    nb = int(np.ceil((t1 - t0) / (3 * Q)))
    mi = 0
    for b in range(nb):
        name = prog[b % len(prog)]
        for k in range(3):
            t = t0 + (b * 3 + k) * Q
            if t >= t1:
                break
            if k == 0:
                place(music, pan(pizz(I.m2f(CHM[name][0] - 12), 0.65 * vel), -0.15), t, 0.9)
            else:
                for j, m in enumerate(CHM[name]):
                    place(music, pan(pizz(I.m2f(m + 12), 0.25 * vel, 0.18), 0.2), t + j * 0.008, 0.6)
            if box and (b % 2 == 0 or major):
                place(music, pan(I.musicbox(I.m2f(mel[mi % len(mel)] + 12), 0.45 * vel, R, 1.0), 0.25), t, 0.55)
                mi += 1


def score():
    music = buf()
    waltz(music, 0.0, LS[2] - 0.1, 0.6)
    place(music, theremin([64, 71, 70, 67, 64], 0.9, 0.22), 0.3, 0.6)
    waltz(music, LS[2], LS[6] - 0.15, 0.75, box=True)
    # the punch: everything stops; a drone through the fever and the death
    place(music, I.pad([I.m2f(40), I.m2f(47), I.m2f(52)], LS[9] - LS[7], 0.4, R, att=0.8, rel=1.0), LS[7], 0.5)
    place(music, theremin([64, 63, 62, 59], 0.7, 0.18), LS[8] - 0.2, 0.6)
    waltz(music, LS[9], LS[12] - 0.1, 0.65)
    # the roof: slow, sparse vibes
    for k, m in enumerate([64, 67, 71, 74, 71, 67, 64, 63, 64, 67, 71, 76]):
        t = LS[12] + k * Q * 1.5
        if t < LS[14] - 0.2:
            place(music, pan(I.vibes(I.m2f(m + 12), 0.45, R, 1.8), 0.15 * (k % 2 * 2 - 1)), t, 0.6)
    waltz(music, LS[14], w(14, -4) - 0.1, 0.55, box=False)
    place(music, theremin([71, 76, 75, 71, 76], 0.45, 0.25), LS[14] + 0.2, 0.55)
    waltz(music, w(14, -4), DUR - 0.4, 0.75, major=True)
    # stings
    for t, gain in [(w(1, -3), 0.8), (w(2, -1), 0.9), (w(9, -2), 1.0)]:
        place(music, I.timpani(I.m2f(40), 0.9, R), t, gain)
        place(music, I.brass(I.m2f(52), 0.6, 0.6, R, kind="horn"), t, 0.3 * gain)
    for k, m in enumerate([76, 79, 83, 88]):  # magic sparkle (Doyle), the password
        place(music, I.glock(I.m2f(m), 0.5, R, 1.4), w(5, -3) + k * 0.07, 0.6)
        place(music, I.glock(I.m2f(m + 2), 0.45, R, 1.4), w(11, -2) + k * 0.09, 0.55)
    for k, m in enumerate([52, 51, 50, 49]):  # "Nothing.": a sad trombone
        place(music, I.brass(I.m2f(m), 0.28 if k < 3 else 0.8, 0.5, R, kind="soft", fall=-0.08 if k == 3 else 0.0), w(12, -1) + k * 0.26, 0.45)
    place(music, I.cymbal(0.7, R, 2.4), w(14, -1), 0.6)
    for k, m in enumerate([64, 68, 71, 76, 80, 83, 88]):
        place(music, I.glock(I.m2f(m), 0.55, R, 1.6), w(14, -1) + 0.05 + k * 0.06, 0.6)
    return music


# ---------------------------------------------------------------- sfx
def sfx():
    out = buf()
    # room tone; the roof gets crickets and far traffic; the theatre a murmuring house
    for i in range(NL):
        a, b = LS[i] - 0.13, (LS[i + 1] - 0.13 if i < NL - 1 else DUR)
        d = b - a
        if i in (12, 13):
            place(out, G.crickets(d, R, 3) * 0.5, a, 0.5)
            place(out, G.breeze(d, R, 0.4), a, 0.35)
        elif i in (2, 3, 7):
            place(out, G.babble(d, R, 150, 1.0) * 0.12, a, 0.6)
        else:
            place(out, pan(lp(colored(ns(d), R, -1.2), 220) * 0.2, 0.0), a, 0.8)
    # the hook: a low séance hum, a candle gust and a ghostly "whoo" on "same dead man"
    for k in range(3):
        place(out, lp(colored(ns(2.2), R, -0.8), 400) * fades(np.ones(ns(2.2)), 0.5, 0.8) * 0.2, LS[0] + 0.2 + k * 0.6, 0.4)
    place(out, G.whoosh(1.0, R, peak=0.5, f_lo=200, f_hi=1500), w(0, -3) - 0.3, 0.5)
    # the ghost whistles innocently on "a hundred years"
    t0, wh = I.whistle([(k * 0.18, 0.2, m, 0.6) for k, m in enumerate([79, 76, 79, 83])], R)
    place(out, wh, w(1, -3) + 0.05 + t0, 0.35)
    # handcuffs clatter, the cage drops and bursts, the whale "squelch"
    place(out, G.rattle(0.5, R), w(2, 4) - 0.05, 0.5)
    place(out, G.clink(R, f0=2400, dur=0.08), w(2, 4), 0.6)
    place(out, G.whoosh(0.35, R, peak=0.3, f_lo=300, f_hi=2000), w(2, 5) - 0.4, 0.5)
    place(out, thud(2.4, 0.6, 220), w(2, 5) - 0.12, 0.8)
    for k in range(4):
        place(out, G.clink(R, f0=R.uniform(600, 1200), dur=0.12), w(2, 6) + 0.07 + k * 0.05, 0.5)
    place(out, poof(1.0), w(2, 6) + 0.05, 0.5)
    sq = bp(colored(ns(0.5), R, -0.5), 200, 1200) * np.exp(-tt(0.5) / 0.12) * (1 + np.sin(2 * np.pi * 30 * tt(0.5)))
    place(out, sq, w(2, -1) - 0.2, 0.7)
    place(out, boing(0.8, 160, 500, 0.4), w(2, -1), 0.5)
    # the water cell: bubbles, the stopwatch ticking, faster at "three minutes"
    place(out, G.bubbles(LE[3] - LS[3] + 0.3, R, 9) * 0.6, LS[3], 0.4)
    t = LS[3]
    while t < LE[3] + 0.3:
        place(out, pan(tick(3600), 0.35), t, 0.4)
        t += 0.5 if t < w(3, -2) else 0.08
    # the séance crash: chair scrape, the rip, the cop's whistle, the camera flash
    place(out, G.creak(0.4, R, rate0=90, rate1=140, scale=0.4), w(4, 4) - 0.1, 0.5)
    rip = hp(colored(ns(0.25), R, 0.0), 1500) * np.exp(-tt(0.25) / 0.08)
    place(out, rip, w(4, 7) - 0.05, 0.6)
    whis = np.sin(2 * np.pi * np.cumsum(2900 + 300 * np.sign(np.sin(2 * np.pi * 28 * tt(0.6)))) / SR) * fades(np.ones(ns(0.6)), 0.02, 0.1) * 0.4
    place(out, whis, w(4, -1), 0.5)
    place(out, hp(colored(ns(0.3), R, 0.0), 3000) * np.exp(-tt(0.3) / 0.05) * 1.5, w(4, -1) + 0.1, 0.5)
    # Doyle: fairy twinkles
    for k in range(10):
        place(out, pan(I.triangle(0.25, R, 0.6, 2600 + 300 * (k % 4)), R.uniform(-0.5, 0.5)), LS[5] + k * 0.35, 0.35)
    # the punch: footsteps, the hit, an "oof", letters flutter
    for k in range(4):
        place(out, G.stroll_step(R, 0.5) * 0.6, LS[6] + 0.1 + k * 0.38, 0.4)
    place(out, thud(3.0, 0.5, 260), w(6, 6) - 0.02, 1.0)
    place(out, G.oof(R, kind="oof"), w(6, 6) + 0.06, 0.6)
    for k in range(5):
        place(out, pan(G.whoosh(0.18, R, peak=0.05, f_lo=1500, f_hi=6000) * 0.4, R.uniform(-0.5, 0.5)), w(6, 6) + 0.1 + k * 0.08, 0.3)
    # the fever: applause, the thermometer squeaks up and pops
    place(out, G.applause(LE[7] - w(7, 6) + 0.6, R, 30) * 0.6, w(7, 6), 0.4)
    place(out, G.oof(R, kind="ugh"), w(7, 2) + 0.05, 0.5)
    place(out, boing(0.6, 300, 1200, 1.2), w(7, 10) - 0.1, 0.35)
    place(out, pop(900) * 1.4, w(7, -1), 0.7)
    # Halloween: an owl-ish hoot (two low sines), a creaky chair, wind
    hoot = np.sin(2 * np.pi * np.cumsum(380 - 40 * tt(0.45)) / SR) * fades(np.ones(ns(0.45)), 0.05, 0.2) * 0.3
    place(out, hoot, LS[8] + 0.1, 0.4); place(out, hoot, LS[8] + 0.7, 0.35)
    place(out, G.breeze(LE[8] - LS[8] + 1.0, R, 0.8), LS[8] - 0.1, 0.5)
    # the book slams, the tub pops
    place(out, G.whoosh(0.4, R, peak=0.35, f_lo=200, f_hi=1500), w(9, 3) - 0.4, 0.5)
    place(out, thud(3.0, 0.8, 140), w(9, 3), 0.9)
    place(out, pop(420) * 1.6, w(9, -2) - 0.08, 0.7)
    place(out, boing(0.8, 200, 700, 0.4), w(9, -2), 0.5)
    # the psychics pop in, giggling
    for k in range(3):
        place(out, pop(600 + 80 * k) * 1.2, w(10, 4) - 0.1 + k * 5 / FPS, 0.6)
    # the password: a padlock click, a heart "bloop"
    place(out, G.clink(R, f0=1800, dur=0.06), w(11, -1) - 0.08, 0.7)
    place(out, thud(0.8, 0.2, 600), w(11, -1) - 0.06, 0.5)
    # ten years: a whoosh per year as the moon races; the sitters pop out; a tumbleweed
    for k in range(10):
        place(out, G.whoosh(0.22, R, peak=0.08, f_lo=600, f_hi=3000) * 0.5, w(12, 4) + k * (w(12, 8) - w(12, 4) + 0.3) / 10, 0.4)
    for k in range(3):
        place(out, pop(700 - 60 * k), w(12, 6 + k) - 0.1, 0.5)
    place(out, G.breeze(2.0, R, 1.2), w(12, -1) - 0.1, 0.5)
    # Bess blows out the candle
    place(out, bp(colored(ns(0.6), R, -0.3), 300, 3000) * np.exp(-tt(0.6) / 0.25), w(13, 2), 0.6)
    # today: the whisper, the candles snuff out, the ghost appears, the cuffs click open, the final poof
    place(out, hp(colored(ns(1.0), R, 0.0), 2500) * fades(np.ones(ns(1.0)), 0.1, 0.3) * 0.15, w(14, 5) - 0.1, 0.5)
    place(out, G.whoosh(0.8, R, peak=0.3, f_lo=200, f_hi=1200), w(14, -4) - 0.25, 0.6)
    place(out, G.clink(R, f0=2200, dur=0.1), w(14, -4) + 0.05, 0.6)
    place(out, poof(1.2), w(14, -4) - 0.05, 0.5)
    place(out, poof(1.0), LE[14] + 0.6, 0.5)
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
