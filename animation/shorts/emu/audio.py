"""Sound for "The War Australia Lost to Birds": an original synthesized bush-band score (banjo-like plucks, tuba,
fife, brushes, a military snare for the army) plus frame-locked SFX, mixed under the voice.

Uses the cartoon-3d-short skill's synthesis building blocks (dsp.py, instruments.py, sfx_gen.py); the score, cue list
and mix are ours. Frames match src/videos/emu/story.ts (30 fps) and the aligned voice/words.json.
Output: audio/mix.wav (48 kHz stereo, exact length) plus stems. Loudness is set when muxing (-14 LUFS, -1.5 dBTP).
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
TOTAL = 2010  # story frames (story.ts)


def _warp():
    """story frame -> video frame, the same warp as src/videos/emu/timewarp.ts (word starts of the first narration vs
    the directed one, piecewise linear, smoothed over +-15 frames, monotonic)"""
    old = json.loads((HERE / "voice" / "words_kokoro.json").read_text(encoding="utf-8"))
    new = json.loads((HERE / "voice" / "words.json").read_text(encoding="utf-8"))
    A = [(0.0, 0.0)] + [(o["start"] * FPS, n["start"] * FPS) for o, n in zip(old, new, strict=True)]
    A += [(old[-1]["end"] * FPS, new[-1]["end"] * FPS), (TOTAL + 60, new[-1]["end"] * FPS + (TOTAL + 60 - old[-1]["end"] * FPS))]
    xs, ys = np.array([a[0] for a in A]), np.array([a[1] for a in A])
    raw = np.interp(np.arange(TOTAL + 61), xs, ys)
    n = len(raw)
    sm = np.array([raw[o - h: o + h + 1].mean() for o in range(n) for h in [min(15, o, n - 1 - o)]])  # shrinking window
    sm[0] = 0.0
    for o in range(1, len(sm)):
        sm[o] = max(sm[o], sm[o - 1] + 0.15)
    return sm


WARP = _warp()
VTOTAL = int(np.ceil(WARP[TOTAL]))
DUR = VTOTAL / FPS
N = ns(DUR)
fr = lambda f: float(np.interp(f, np.arange(len(WARP)), WARP)) / FPS  # noqa: E731  story frame -> video seconds
# id: (a, b, light) as in story.ts
SHOTS = {1: (0, 104, "golden"), 2: (104, 139, "golden"), 3: (139, 165, "golden"), 4: (165, 302, "day"), 5: (302, 376, "golden"),
         6: (376, 429, "day"), 7: (429, 563, "day"), 8: (563, 592, "golden"), 9: (592, 620, "golden"), 10: (620, 704, "golden"),
         11: (704, 734, "golden"), 12: (734, 785, "day"), 13: (785, 826, "day"), 14: (826, 950, "day"), 15: (950, 1075, "golden"),
         16: (1075, 1131, "day"), 17: (1131, 1276, "day"), 18: (1276, 1347, "inside"), 19: (1347, 1535, "golden"),
         20: (1535, 1586, "golden"), 21: (1586, 1768, "golden"), 22: (1768, 1865, "golden"), 23: (1865, TOTAL, "golden")}

R = rng(1932)


def buf():
    return np.zeros((2, N))


# ---------------------------------------------------------------- score
# 118 bpm, G major bush band: banjo-like plucks on the off-beats, tuba on 1 and 3, brushes, a fife tune.
BPM = 118
Q = 60 / BPM
BAR = 4 * Q
CH = {"G": [55, 59, 62], "C": [48, 52, 55], "D": [50, 54, 57], "Em": [52, 55, 59], "Am": [45, 48, 52], "Bm": [47, 50, 54]}
PROG = ["G", "C", "D", "G"]
TUNE = [(0, 74, 0.5), (0.5, 71, 0.5), (1, 74, 0.5), (1.5, 76, 0.5), (2, 79, 1), (3, 78, 1),
        (4, 76, 0.5), (4.5, 74, 0.5), (5, 72, 0.5), (5.5, 71, 0.5), (6, 69, 2),
        (8, 71, 0.5), (8.5, 74, 0.5), (9, 79, 0.5), (9.5, 78, 0.5), (10, 76, 1), (11, 74, 1),
        (12, 72, 0.5), (12.5, 71, 0.5), (13, 69, 0.5), (13.5, 66, 0.5), (14, 67, 2)]


def banjo(f, vel, dur=0.4):
    return I.pluck(f, vel, R, dur + 0.25, bright=0.8, pos=0.08)


def section(music, t0, t1, *, tune=True, fife=False, drum=True, snare=False, pad=False, vel=0.6, minor=False, half=False):
    prog = ["Em", "Am", "Bm", "Em"] if minor else PROG
    q = Q * (2 if half else 1)
    nb = int(np.ceil((t1 - t0) / (4 * q)))
    for b in range(nb):
        tb = t0 + b * 4 * q
        name = prog[b % 4]
        if pad:
            place(music, I.pad([I.m2f(m) for m in CH[name]], 4 * q, 0.22 * vel, R, att=0.4, rel=0.6), tb, 0.35)
        for k in range(4):
            t = tb + k * q
            if t >= t1:
                break
            if k % 2 == 0:  # tuba on 1 and 3
                place(music, pan(I.brass(I.m2f(CH[name][0] - 12 + (7 if k == 2 else 0)), q * 0.8, 0.55 * vel, R, kind="tuba"), -0.1), t, 0.8)
            else:  # banjo chord on 2 and 4
                for j, m in enumerate(CH[name]):
                    place(music, pan(banjo(I.m2f(m + 12), 0.35 * vel), 0.25), t + j * 0.012, 0.6)
            if drum:
                place(music, pan(I.brush(0.32 * vel * (1.4 if k % 2 else 0.8), R, 0.2), 0.2), t, 0.55)
                place(music, pan(I.brush(0.18 * vel, R, 0.12), 0.2), t + q / 2, 0.5)
            if snare and k % 2:
                place(music, pan(I.snare(0.35 * vel, R, 0.25), -0.15), t, 0.5)
    if tune:
        loop = 16 * Q
        for k in range(int(np.ceil((t1 - t0) / loop))):
            for beat, m, ln in TUNE:
                t = t0 + k * loop + beat * Q
                if t < t1 - 0.05:
                    mm = m - (3 if minor and m % 12 in (11, 4) else 0)
                    place(music, pan(banjo(I.m2f(mm), 0.45 * vel, ln * Q), 0.1), t, 0.85)
                    if fife:
                        place(music, pan(I.fife(I.m2f(mm + 12), ln * Q * 0.9, 0.2 * vel, R), -0.2), t, 0.55)


def fanfare(music, t, gain=0.7, notes=(67, 71, 74, 79)):
    for k, m in enumerate(notes):
        place(music, pan(I.brass(I.m2f(m), 0.16 if k < len(notes) - 1 else 0.7, 0.7, R, kind="horn"), 0.1 * k - 0.15), t + k * 0.12, gain)


def sad_trombone(music, t0, gain=0.6):
    for k, m in enumerate([50, 49, 48, 47]):
        place(music, I.brass(I.m2f(m), 0.28 if k < 3 else 0.9, 0.5, R, kind="soft", fall=-0.08 if k == 3 else 0.0), t0 + k * 0.3, gain)


def sting(music, t, chord="G", gain=0.7):
    for m in CH[chord]:
        place(music, I.glock(I.m2f(m + 12), 0.45, R, 2.0), t, gain)
    place(music, I.timpani(I.m2f(CH[chord][0] - 12), 0.7, R), t, gain * 0.85)


def score():
    music = buf()
    s = lambda i: (fr(SHOTS[i][0]), fr(SHOTS[i][1]))  # noqa: E731
    section(music, 0.0, s(3)[1], fife=True, vel=0.75)                       # hook
    section(music, s(4)[0], s(5)[1], fife=False, drum=False, pad=True, vel=0.6)  # the farm, the emus arrive
    section(music, s(6)[0], s(7)[1], tune=False, snare=True, vel=0.7)        # the army
    section(music, s(8)[0], s(11)[0], tune=False, drum=False, pad=True, minor=True, half=True, vel=0.55)  # stalking
    section(music, s(12)[0], s(14)[1], fife=True, snare=True, vel=0.8)       # the truck chase
    section(music, s(15)[0], s(15)[1], tune=False, drum=False, pad=True, minor=True, half=True, vel=0.5)  # the lookout
    section(music, s(16)[0], s(18)[1], fife=False, vel=0.6)                  # You see
    section(music, s(19)[0], s(20)[1], tune=False, drum=False, pad=True, minor=True, half=True, vel=0.5)  # December
    section(music, s(21)[0], s(21)[1], tune=False, snare=True, vel=0.6)      # the major's quote
    section(music, s(22)[0], s(22)[1], fife=True, drum=False, minor=True, half=True, vel=0.55)  # home
    section(music, s(23)[0], DUR - 0.8, fife=True, snare=True, vel=0.8)      # coat of arms
    fanfare(music, fr(431))                       # "The army sent"
    fanfare(music, fr(1931), 0.75, (67, 71, 74, 79, 83))  # "Australia's coat of arms"
    for f0, chord in [(165, "G"), (1075, "D"), (1157, "G"), (1535, "C")]:
        sting(music, fr(f0), chord)
    sting(music, DUR - 1.0, "G")
    for f0 in [708, 826, 1803]:                  # "jammed", "Unluckily", "refused"
        sad_trombone(music, fr(f0))
    for k in range(16):                          # snare roll into "any army in the world"
        place(music, I.snare(0.2 + 0.03 * k, R, 0.12), fr(1690) + k * 0.06, 0.5)
    place(music, I.cymbal(0.6, R, 2.0), fr(1722), 0.5)
    return music


# ---------------------------------------------------------------- sfx
def thud(gain=2.0, dur=0.8, f=150):
    return lp(R.standard_normal(ns(dur)), f) * np.exp(-tt(dur) / 0.14) * gain


def pop(f0=520):
    return modal(0.25, [(f0, 1.0, 0.05), (f0 * 1.9, 0.4, 0.03)], R, glide=0.6, glide_tau=0.03) * 0.8


def emu_boom(n=3, gain=1.0):
    """the emu's deep drumming: low hollow pulses (~70-90 Hz) with a throaty buzz"""
    out = np.zeros(ns(0.6 * n + 0.6))
    for k in range(n):
        d = 0.45
        x = np.sin(2 * np.pi * np.cumsum(np.full(ns(d), 78 - 4 * k)) / SR) * np.exp(-((tt(d) - 0.12) / 0.11) ** 2)
        x += 0.25 * bp(colored(ns(d), R, -0.5), 90, 400) * np.exp(-tt(d) / 0.15)
        s0 = ns(0.55 * k)
        out[s0:s0 + len(x)] += x * gain
    return out


def burst(dur, rate=11.0, gain=1.0):
    """a Lewis gun burst: sharp cracks with a low body, ~11 rounds/s (it fired ~550-600 rounds/min)"""
    out = np.zeros(ns(dur + 0.3))
    for k in range(int(dur * rate)):
        crack = hp(colored(ns(0.06), R, 0.0), 1500) * np.exp(-tt(0.06) / 0.008) * 1.4 + lp(R.standard_normal(ns(0.12)), 300)[: ns(0.06)] * 0.0
        body = lp(R.standard_normal(ns(0.15)), 220) * np.exp(-tt(0.15) / 0.035) * 2.2
        s0 = ns(k / rate + R.uniform(0, 0.006))
        out[s0:s0 + len(crack)] += crack * gain
        out[s0:s0 + len(body)] += body * gain
    return out


def engine(dur, rpm=1.0, gain=1.0):
    """a 1930s truck engine: a lumpy low saw at the firing rate plus mechanical noise"""
    t = tt(dur)
    f = 32 * rpm * (1 + 0.04 * np.sin(2 * np.pi * 0.7 * t))
    ph = np.cumsum(f) / SR
    x = (2 * (ph % 1) - 1) * 0.6 + 0.4 * np.sign(np.sin(2 * np.pi * ph * 2))
    x = lp(x, 380) + 0.25 * bp(colored(len(t), R, 0.0), 300, 2400) * (0.6 + 0.4 * np.sin(2 * np.pi * ph * 4))
    return fades(x * gain, 0.3, 0.4)


def boing(t0_gain=1.0, f0=180, f1=520, dur=0.45):
    t = tt(dur)
    f = f0 + (f1 - f0) * (1 - np.exp(-t / 0.06)) + 40 * np.sin(2 * np.pi * 18 * t) * np.exp(-t / 0.2)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.18) * 0.7 * t0_gain


def stampede(dur, density=14.0, gain=1.0):
    out = buf_mono(dur)
    for k in range(int(dur * density)):
        x = G.stroll_step(R, scuff=0.2) * R.uniform(0.5, 1.0)
        s0 = ns(R.uniform(0, dur))
        out[s0:s0 + len(x)] += x[: max(0, len(out) - s0)] * gain
    return out


def buf_mono(dur):
    return np.zeros(ns(dur) + ns(0.5))


def sfx():
    out = buf()
    inside = buf()
    # ambience: breeze everywhere; magpie-ish chirps by day; crickets at golden hour; room tone inside
    for i, (a, b, light) in SHOTS.items():
        d = fr(b) - fr(a)
        if light == "inside":
            place(inside, pan(lp(colored(ns(d), R, -1.2), 220) * 0.2, 0.0), fr(a))
            continue
        place(out, G.breeze(d, R, 0.55 if light == "day" else 0.45), fr(a), 0.5)
        if light == "day":
            place(out, G.bird_chirps(d, R, 0.35), fr(a), 0.35)
        else:
            place(out, G.crickets(d, R, 2), fr(a), 0.18)
    # whooshes on glides and cuts
    for f0, d, pk in [(58, 1.2, 0.6), (162, 0.7, 0.35), (215, 1.2, 0.6), (348, 0.8, 0.4), (494, 1.1, 0.5), (892, 0.8, 0.4),
                      (994, 1.0, 0.5), (1194, 0.5, 0.25), (1290, 0.9, 0.5), (1458, 1.0, 0.5), (1700, 1.1, 0.5), (1900, 1.3, 0.6)]:
        place(out, G.whoosh(d, R, peak=pk), fr(f0) - pk * 0.3, 0.45)
    # risers into the big reveals (riser 1-2 s before, impact on it)
    for f0, d in [(165, 1.0), (1157, 1.2), (1931, 1.4)]:
        place(out, G.whoosh(d, R, peak=d * 0.95, f_lo=200, f_hi=4000, tail=0.05), fr(f0) - d * 0.95, 0.45)
    # emus: footsteps of the hook flock, booming calls
    for k in range(10):
        place(out, pan(G.stroll_step(R, scuff=0.3) * 0.6, R.uniform(-0.4, 0.4)), fr(6) + k * 0.36, 0.35)
    for f0, n in [(20, 3), (150, 2), (330, 4), (1010, 3), (1560, 2), (1880, 3)]:
        place(out, emu_boom(n, 1.2), fr(f0), 0.55)
    # "with machine guns": the burst
    place(out, burst(0.75), fr(111), 0.9)
    # the hat pops on the emu
    place(out, pop(640) * 1.2, fr(148), 0.7)
    # the farm: windmill creak, hammering, a dog? (no) - a rooster-free farm: windmill + hammer
    place(out, G.creak(1.6, R, rate0=40, rate1=60, scale=0.5), fr(190), 0.35)
    for k in range(7):
        place(out, pan(G.hammer_hit(R, 0.5), -0.5), fr(240) + k * 0.43, 0.3)
    # the horde: a rumble of feet; munching at "ate it"
    place(out, stampede(1.8, 22, 0.6), fr(302), 0.5)
    for k in range(9):
        place(out, pan(bp(colored(ns(0.07), R, 0.0), 1500, 6000) * np.exp(-tt(0.07) / 0.02), R.uniform(-0.4, 0.4)), fr(352) + k * 0.13, 0.5)
    # the farmers: a stomp on "army" (fist)
    place(out, thud(1.2, 0.3, 300), fr(403), 0.5)
    # the line-up pops: major, soldier, soldier, gun, gun, six crates (rising pitch)
    for k, f0 in enumerate([445, 467, 473, 499, 505]):
        place(out, pop(420 + 50 * k) * 1.3, fr(f0 + 2), 0.8)
    for k in range(6):
        place(out, thud(1.0, 0.25, 260), fr(526 + k * 3.4 + 4), 0.6)
        place(out, pop(700 + 60 * k), fr(526 + k * 3.4 + 4), 0.45)
    # the photobombing emu's footsteps
    for k in range(5):
        place(out, pan(G.stroll_step(R, scuff=0.3) * 0.5, 0.4), fr(530) + k * 0.33, 0.3)
    # day one: binocular focus clicks; day three: many footsteps; the jam: click-clack + spring boing
    for k in range(3):
        place(out, G.clink(R, f0=3200, dur=0.04) * 0.6, fr(572) + k * 0.12, 0.4)
    place(out, stampede(2.6, 12, 0.5), fr(622), 0.45)
    place(out, burst(0.25), fr(700), 0.7)
    place(out, G.clink(R, f0=1800, dur=0.08) * 1.0, fr(712), 0.8)
    place(out, G.clink(R, f0=1400, dur=0.08) * 1.0, fr(715), 0.8)
    place(out, boing(1.0), fr(714), 0.7)
    place(out, stampede(0.8, 30, 0.7), fr(716), 0.6)
    # the truck: engine from shot 12 to 14, gear grind, the gun clanks onto the pintle
    place(out, engine(fr(950) - fr(736), 1.0, 0.8), fr(736), 0.5)
    place(out, thud(1.5, 0.3, 400) + 0.0, fr(752), 0.6)
    place(out, G.clink(R, f0=900, dur=0.2), fr(752), 0.6)
    # rattles on the bumps; the gunner's bursts at the sky
    for k in range(18):
        place(out, pan(G.rattle(0.18, R, density=40), R.uniform(-0.3, 0.3)) if False else G.rattle(0.18, R, density=40) * 0.5, fr(896) + k * 0.16 + R.uniform(0, 0.05), 0.5)
    for f0 in [910, 916, 925, 931, 940]:
        place(out, burst(0.15), fr(f0), 0.6)
    place(out, stampede(3.6, 26, 0.6), fr(830), 0.5)  # the emus overtake
    place(out, G.whoa(R), fr(902), 0.3)
    # the lookout: a sharp alarm boom
    place(out, emu_boom(2, 1.5), fr(1040), 0.6)
    # You see: the target ring dings, the burst whooshes out, stampede in all directions
    place(out, I.triangle(0.6, R, 1.2), fr(1110), 0.5)
    place(out, stampede(2.0, 40, 0.8), fr(1157), 0.7)
    place(out, thud(1.6, 0.5, 200), fr(1157), 0.6)
    place(out, stampede(2.4, 18, 0.7), fr(1194), 0.6)
    # marbles: the jar tips, clatter and roll, the hand swoops and grabs nothing
    for k in range(36):
        place(inside, pan(G.clink(R, f0=R.uniform(2200, 4200), dur=0.06), R.uniform(-0.6, 0.6)), fr(1279) + k * 0.035 + R.uniform(0, 0.03), 0.45)
    roll = bp(colored(ns(1.6), R, 0.0), 900, 5000) * smooth_noise(ns(1.6), R, 40) * np.exp(-tt(1.6) / 0.7) * 0.5
    place(inside, roll, fr(1285), 0.6)
    place(inside, thud(1.4, 0.4, 250), fr(1322), 0.7)
    place(inside, G.whoosh(0.4, R, peak=0.2) * 0.5, fr(1330), 0.6)
    # December: the cases cascade onto the pile
    for k in range(60):
        place(out, pan(G.clink(R, f0=R.uniform(2400, 5200), dur=0.08), R.uniform(-0.5, 0.5)), fr(1391) + k * 0.018 + R.uniform(0, 0.02), 0.35)
    place(out, thud(1.4, 0.4, 300), fr(1394), 0.6)
    # the campfire crackle under December
    crack = hp(colored(ns(5.0), R, 0.0), 1200) * (R.random(ns(5.0)) > 0.997) * 3.0 + lp(colored(ns(5.0), R, -1.0), 500) * 0.3
    place(out, fades(crack, 0.3, 0.6), fr(1350), 0.4)
    # ten bullets: ten pops climbing a scale
    for k in range(10):
        place(out, pop(520 + 40 * k) * 1.1, fr(1540 + k * 3.2 + 2), 0.6)
    # the emu division marches in step behind the major
    for k in range(10):
        place(out, pan(G.stroll_step(R, scuff=0.2) * 0.7, 0.3), fr(1700) + k * 0.333, 0.35)
    # the army drives home: engine fading away, three backfires (no, no, no)
    eng = engine(fr(1865) - fr(1768), 0.9, 0.9) * np.linspace(1.0, 0.15, ns(fr(1865) - fr(1768)))
    place(out, eng, fr(1768), 0.5)
    for f0 in [1828, 1836, 1842]:
        place(out, thud(2.4, 0.5, 260) + 0.0, fr(f0), 0.8)
        place(out, hp(colored(ns(0.12), R, 0.0), 800) * np.exp(-tt(0.12) / 0.02) * 1.2, fr(f0), 0.6)
    # the farmer's running steps
    for k in range(6):
        place(out, pan(G.stroll_step(R, scuff=0.5), -0.2), fr(1770) + k * 0.2, 0.4)
    # coat of arms: the wink ding, the kangaroo's boing
    place(out, I.glock(I.m2f(91), 0.5, R, 1.4), fr(1958), 0.6)
    place(out, boing(0.8, 200, 600, 0.35), fr(1975), 0.4)
    out += inside * 0.7
    return out


# ---------------------------------------------------------------- mix
def mix():
    v, sr = read_wav(str(HERE / "voice" / "voice.wav"))
    assert sr == SR, sr
    v = np.atleast_2d(v)
    if v.shape[0] == 1:
        v = np.vstack([v, v])
    voice = np.zeros((2, N)); voice[:, : min(N, v.shape[1])] = v[:, :N]
    words = json.loads((HERE / "voice" / "words.json").read_text(encoding="utf-8"))
    key = np.zeros(N)
    for w in words:
        key[ns(max(0, w["start"] - 0.08)): ns(w["end"] + 0.15)] = 1.0
    key = np.convolve(key, np.ones(ns(0.12)) / ns(0.12), mode="same")
    music, fx = score(), sfx()
    rms = lambda x: np.sqrt(np.mean(x ** 2) + 1e-12)  # noqa: E731
    vr = rms(voice[:, voice.any(axis=0)]) if voice.any() else 0.1
    music *= (vr / rms(music)) * dbg(-13.0 + 3.0)  # skill rule: music +3 dB over our base
    fx *= (vr / rms(fx)) * dbg(-12.0 - 6.0 + 6.0)  # SFX bed ~-12 dB under the voice
    music *= dbg(-9.0) ** key[None, :]  # duck -9 dB under the voice
    out = voice + music + fx
    out /= max(1e-6, np.abs(out).max()) / 0.89
    (HERE / "audio").mkdir(exist_ok=True)
    write_wav(str(HERE / "audio" / "mix.wav"), out)
    for name, x in [("voice", voice), ("music", music), ("sfx", fx)]:
        write_wav(str(HERE / "audio" / f"stem_{name}.wav"), x / max(1e-6, np.abs(x).max()) * 0.89)
    print(f"mix: {N / SR:.2f} s")


if __name__ == "__main__":
    mix()
