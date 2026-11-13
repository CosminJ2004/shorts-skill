"""Sound for "Doomsday Is Today": an original synthesized score (a suspense-comedy pizzicato in D minor with a ticking
clock, turning to D major and "Happy Birthday" at the end; that melody is in the public domain) plus SFX locked to the
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
from dsp import SR, ns, tt, rng, lp, hp, bp, colored, smooth_noise, fades, place, dbg, pan, modal, read_wav, write_wav  # noqa: E402
import instruments as I  # noqa: E402
import sfx_gen as G  # noqa: E402

FPS = 30
R = rng(2026)
WORDS = json.loads((HERE / "voice" / "words.json").read_text(encoding="utf-8"))
LINES = [[w for w in WORDS if w["sentence"] == i] for i in range(17)]
LS = [ln[0]["start"] for ln in LINES]
LE = [ln[-1]["end"] for ln in LINES]
DUR = LE[16] + 40 / FPS
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


def boom(gain=1.0):
    return thud(3.0, 1.4, 90) * gain


def tick(f0=3200):
    x = modal(0.05, [(f0, 0.4, 0.01)], R)
    x[: ns(0.03)] += hp(colored(ns(0.03), R, 0.0), 2000) * np.exp(-tt(0.03) / 0.004) * 0.8
    return x


def boing(gain=1.0, f0=180, f1=520, dur=0.45):
    t = tt(dur)
    f = f0 + (f1 - f0) * (1 - np.exp(-t / 0.06)) + 40 * np.sin(2 * np.pi * 18 * t) * np.exp(-t / 0.2)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.18) * 0.7 * gain


def screech(dur=1.0, gain=1.0):
    t = tt(dur)
    f = 2400 - 900 * t / dur
    x = np.sin(2 * np.pi * np.cumsum(f + 120 * np.sin(2 * np.pi * 37 * t)) / SR) * 0.4 + bp(colored(len(t), R, 0.0), 1500, 5000) * 0.6
    return fades(x * gain, 0.02, 0.2)


def engine(dur, gain=1.0):
    t = tt(dur)
    ph = np.cumsum(46 * (1 + 0.05 * np.sin(2 * np.pi * 0.9 * t))) / SR
    x = lp((2 * (ph % 1) - 1) * 0.6 + 0.4 * np.sign(np.sin(2 * np.pi * ph * 2)), 420) + 0.2 * bp(colored(len(t), R, 0.0), 300, 2400)
    return fades(x * gain, 0.2, 0.3)


# ---------------------------------------------------------------- score
BPM = 112
Q = 60 / BPM
CHM = {"Dm": [50, 53, 57], "Gm": [43, 46, 50], "A7": [45, 49, 52], "Bb": [46, 50, 53], "D": [50, 54, 57], "G": [43, 47, 50], "A": [45, 49, 52]}


def pizz(f, vel, dur=0.25):
    return I.pluck(f, vel, R, dur, bright=0.55, pos=0.2)


def creep(music, t0, t1, vel=0.6, major=False):
    """walking pizzicato bass on the beat, an off-beat chord stab, and a clock tick on every eighth"""
    prog = ["D", "G", "A", "D"] if major else ["Dm", "Gm", "A7", "Dm"]
    nb = int(np.ceil((t1 - t0) / (4 * Q)))
    for b in range(nb):
        name = prog[b % 4]
        for k in range(4):
            t = t0 + (b * 4 + k) * Q
            if t >= t1:
                break
            root = CHM[name][0] - 12 + [0, 7, 12, 7][k]
            place(music, pan(pizz(I.m2f(root), 0.6 * vel), -0.15), t, 0.9)
            if k % 2:
                for j, m in enumerate(CHM[name]):
                    place(music, pan(pizz(I.m2f(m + 12), 0.28 * vel, 0.18), 0.2), t + j * 0.01, 0.6)
            for h in (0, 0.5):
                if t + h * Q < t1:
                    place(music, pan(tick(3600 if h else 2800), 0.35), t + h * Q, 0.25 * vel)


HB = [(0, 62, 0.75), (0.75, 62, 0.25), (1, 64, 1), (2, 62, 1), (3, 67, 1), (4, 66, 2),
      (6, 62, 0.75), (6.75, 62, 0.25), (7, 64, 1), (8, 62, 1), (9, 69, 1), (10, 67, 2)]  # Happy Birthday (public domain), D major


def score():
    music = buf()
    creep(music, 0.0, LS[3] - 0.1, 0.7)
    creep(music, LS[3], LS[7] - 0.2, 0.75)
    creep(music, LS[9], LS[11] - 0.1, 0.65)
    creep(music, LS[11], LS[14] - 0.1, 0.6)
    creep(music, LS[14], DUR - 0.5, 0.6, major=True)
    # stings on the date, the journal, infinity, the reveal, the brakes
    for t, gain in [(w(1, 0), 0.8), (w(1, 1), 0.8), (w(1, 3), 1.0), (w(2, 8), 0.9)]:
        place(music, I.timpani(I.m2f(38), 0.9, R), t, gain)
        place(music, I.brass(I.m2f(50), 0.6, 0.6, R, kind="horn"), t, 0.35 * gain)
    place(music, I.cymbal(0.7, R, 2.4), w(5, -1), 0.6)
    for k, m in enumerate([74, 78, 81, 86]):  # the birthday reveal: a bright arpeggio
        place(music, I.glock(I.m2f(m), 0.55, R, 1.4), w(7, -2) + k * 0.08, 0.7)
    for k, m in enumerate([86, 83, 79, 74, 79, 83, 86, 91]):  # magic sparkle
        place(music, I.musicbox(I.m2f(m), 0.5, R, 1.0), w(8, 7) + k * 0.05, 0.55)
    for k, m in enumerate([50, 49, 48, 47]):  # "ridiculous": a sad trombone
        place(music, I.brass(I.m2f(m), 0.28 if k < 3 else 0.8, 0.5, R, kind="soft", fall=-0.08 if k == 3 else 0.0), w(9, -1) + k * 0.28, 0.45)
    t0 = LS[16] - 0.2  # Happy Birthday on glock + pizz under the last line and the tail
    for beat, m, ln in HB:
        t = t0 + beat * Q * 0.75
        if t < DUR - 0.4:
            place(music, pan(I.glock(I.m2f(m + 12), 0.55, R, ln * Q * 1.2 + 0.3), 0.1), t, 0.75)
    place(music, I.cymbal(0.5, R, 2.0), DUR - 1.2, 0.4)
    return music


# ---------------------------------------------------------------- sfx
def sfx():
    out = buf()
    # room tone indoors, outdoor air, studio hush
    out_shots = {4, 5, 6, 10, 13, 14}
    studio = {1, 2, 8, 12, 15}
    for i in range(17):
        a, b = LS[i] - 0.13, (LS[i + 1] - 0.13 if i < 16 else DUR)
        d = b - a
        if i in out_shots:
            place(out, G.breeze(d, R, 0.5), a, 0.45)
            if i in (4, 6, 10, 14):
                place(out, G.babble(d, R, 160, 1.0) * 0.18, a, 0.6)
        elif i not in studio:
            place(out, pan(lp(colored(ns(d), R, -1.2), 220) * 0.2, 0.0), a, 0.8)
    # chalk on the board during the hook
    for k in range(10):
        place(out, pan(bp(colored(ns(0.22), R, 0.0), 1800, 6000) * np.exp(-tt(0.22) / 0.08) * 0.5, -0.3), LS[0] + 0.3 + k * 0.36, 0.45)
    place(out, boom(0.8), w(0, -2), 0.6)
    # the calendar: rapid page flips, three hits
    for k in range(16):
        place(out, pan(G.whoosh(0.12, R, peak=0.05, f_lo=1200, f_hi=6000) * 0.5, 0.2), LS[1] - 0.1 + k * (w(1, 3) - LS[1]) / 16, 0.4)
    for t in [w(1, 0), w(1, 1), w(1, 3)]:
        place(out, boom(1.0), t, 0.8)
    # the cult and the psychic pop in and get swept away; the journal slams
    place(out, pop(600) * 1.2, LS[2] - 0.05, 0.6)
    place(out, pop(660) * 1.2, w(2, 3) - 0.05, 0.6)
    for t in [w(2, 3), w(2, 6)]:
        place(out, G.whoosh(0.4, R, peak=0.12), t, 0.6)
    place(out, G.whoosh(0.5, R, peak=0.4, f_lo=200, f_hi=1500), w(2, 8) - 0.4, 0.5)
    place(out, thud(3.0, 0.8, 140), w(2, 8), 0.9)
    # the calculator cranks; papers fly; a gasp
    for k in range(int((w(3, -2) - LS[3]) / 0.09)):
        place(out, G.clink(R, f0=R.uniform(1800, 2600), dur=0.04) * 0.5, LS[3] + k * 0.09, 0.4)
    place(out, G.whoosh(0.6, R, peak=0.2, f_lo=800, f_hi=5000), w(3, -2) - 0.1, 0.5)
    place(out, G.whoa(R), w(3, -2) + 0.1, 0.35)
    # the doubling: pops speed up and climb
    lv = 0
    t = LS[4] + 0.07
    D = (LE[4] - LS[4] - 0.2) / ((1 - 0.7 ** 10) / 0.3)
    for k in range(10):
        tk = LS[4] + 0.07 + D * (1 - 0.7 ** k) / 0.3
        for j in range(min(6, 2 ** k)):
            place(out, pan(pop(420 + 45 * k + 20 * j), R.uniform(-0.5, 0.5)), tk + j * 0.02, 0.5)
    del lv, t
    # the coaster: chain-lift clacks accelerating, a riser into "infinity", the boom
    t, step = LS[5], 0.16
    while t < w(5, -1):
        place(out, G.clink(R, f0=900, dur=0.05) * 0.7, t, 0.5)
        t += step
        step = max(0.04, step * 0.94)
    place(out, G.whoosh(1.8, R, peak=1.7, f_lo=200, f_hi=5000, tail=0.05), w(5, -1) - 1.7, 0.6)
    place(out, boom(1.3), w(5, -1), 1.0)
    # the squeeze: groans, a rubbery squeak, the man popping out
    for k in range(5):
        place(out, G.oof(R, kind="ugh"), LS[6] + 0.3 + k * 0.6, 0.18)
    place(out, boing(1.0, 140, 700, 0.6), w(6, -3), 0.6)
    place(out, pop(380) * 1.4, w(6, -3), 0.6)
    # the birthday: a party horn
    horn = np.sign(np.sin(2 * np.pi * np.cumsum(420 + 60 * np.sin(2 * np.pi * 6 * tt(0.7))) / SR)) * np.exp(-tt(0.7) / 0.4) * 0.25
    place(out, lp(horn, 2500), w(7, -2), 0.6)
    # the magician: poof, the rabbit, doves
    place(out, lp(colored(ns(0.6), R, -0.5), 1800) * np.exp(-tt(0.6) / 0.15) * 1.2, w(8, 7), 0.6)
    place(out, boing(0.7, 300, 800, 0.3), w(8, -1), 0.5)
    for k in range(6):
        place(out, pan(G.whoosh(0.15, R, peak=0.05, f_lo=600, f_hi=3000) * 0.4, R.uniform(-0.5, 0.5)), w(8, -1) + 0.3 + k * 0.1, 0.4)
    # "ridiculous": laughter; letters swish down
    place(out, G.babble(2.0, R, 150, 1.0) * 0.4, LS[9], 0.6)
    for k in range(10):
        place(out, pan(G.whoosh(0.2, R, peak=0.06, f_lo=1500, f_hi=6000) * 0.4, R.uniform(-0.6, 0.6)), LS[9] + k * 0.2, 0.35)
    # thirty years: a time-lapse whoosh, the tower clock whirring, buildings thumping up
    place(out, G.whoosh(3.6, R, peak=1.8, f_lo=300, f_hi=3000), LS[10], 0.5)
    for k in range(40):
        place(out, tick(4200) * 0.6, LS[10] + k * 0.09, 0.3)
    for k in range(10):
        place(out, thud(0.8, 0.3, 220), LS[10] + 0.4 + k * 0.33, 0.4)
    # the chalk tap; the kids vanish (descending pops)
    place(out, G.clink(R, f0=2200, dur=0.06), LS[11] + 0.2, 0.5)
    for k, t in enumerate([w(12, 2), w(12, 3), w(12, 5), w(12, 8), w(12, -2), w(12, -1)]):
        place(out, pop(820 - 70 * k), t - 0.1, 0.6)
    # the car: engine, the screech and skid, the wobble at the edge, a pebble falls
    place(out, engine(LE[13] - LS[13] + 0.4, 0.9), LS[13] - 0.2, 0.5)
    place(out, screech(1.1, 0.9), w(13, -1) - 0.3, 0.6)
    place(out, thud(1.2, 0.4, 260), w(13, -1) + 0.6, 0.6)
    place(out, G.creak(0.8, R, rate0=60, rate1=40, scale=0.5), w(13, -1) + 0.7, 0.4)
    place(out, G.clink(R, f0=1600, dur=0.05) * 0.4, w(13, -1) + 1.4, 0.4)
    # golden plaza: birds; the sofa: fireworks on "didn't end"
    place(out, G.bird_chirps(LE[14] - LS[14] + 0.6, R, 0.4), LS[14], 0.4)
    for k in range(4):
        place(out, thud(1.0, 0.4, 500) + 0.0, w(15, -3) + k * 0.3, 0.5)
        place(out, pan(hp(colored(ns(0.8), R, 0.0), 2000) * (R.random(ns(0.8)) > 0.99) * 2.0 * np.exp(-tt(0.8) / 0.3), R.uniform(-0.6, 0.6)), w(15, -3) + k * 0.3 + 0.1, 0.4)
    # Heinz blows the candles out; a cheer
    place(out, bp(colored(ns(0.6), R, -0.3), 300, 3000) * np.exp(-tt(0.6) / 0.25), w(16, -1) - 0.1, 0.6)
    place(out, G.hurrah(R, 170, 1.0) * 0.5, w(16, -1) + 0.4, 0.5)
    place(out, lp(horn, 2500), w(16, -1) + 0.5, 0.5)
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
