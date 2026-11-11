"""Sound for "The Castle That Fell Through Its Toilet": an original synthesized medieval-flavoured score plus
frame-locked SFX, mixed under the voice.

Uses the cartoon-3d-short skill's synthesis building blocks (dsp.py, instruments.py, sfx_gen.py); the score, cue list
and mix are ours. Frames match src/videos/castle/story.ts (30 fps). Output: audio/mix.wav (48 kHz stereo, exact
length) plus stems. Loudness is set when muxing (ffmpeg loudnorm -14 LUFS, -1.5 dBTP).
"""
import json
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[2] / ".claude" / "skills" / "cartoon-3d-short" / "templates" / "audio"))
from dsp import SR, ns, tt, rng, lp, hp, bp, colored, smooth_noise, fades, place, make_ir, convolve_st, dbg, pan, modal, read_wav, write_wav  # noqa: E402
import instruments as I  # noqa: E402
import sfx_gen as G  # noqa: E402

FPS = 30
TOTAL = 2034
DUR = TOTAL / FPS
N = ns(DUR)
fr = lambda f: f / FPS  # noqa: E731
# id: (a, b, light) as in story.ts
SHOTS = {1: (0, 124, "golden"), 2: (124, 269, "day"), 3: (269, 367, "day"), 4: (367, 482, "day"), 5: (482, 571, "golden"),
         6: (571, 683, "day"), 7: (683, 770, "day"), 8: (770, 855, "golden"), 9: (855, 929, "day"), 10: (929, 1077, "golden"),
         11: (1077, 1114, "golden"), 12: (1114, 1200, "golden"), 13: (1200, 1226, "golden"), 14: (1226, 1282, "golden"),
         15: (1282, 1368, "inside"), 16: (1368, 1472, "inside"), 17: (1472, 1613, "day"), 18: (1613, 1711, "bank"),
         19: (1711, 1755, "inside"), 20: (1755, 1790, "golden"), 21: (1790, 1840, "day"), 22: (1840, 1880, "inside"),
         23: (1880, 1966, "golden"), 24: (1966, TOTAL, "golden")}

R = rng(1204)


def buf():
    return np.zeros((2, N))


# ---------------------------------------------------------------- score
# 112 bpm, D dorian: a plucked lute-like line with a fife on top, drone pad and a tabor (brush) beat.
BPM = 112
Q = 60 / BPM
BAR = 4 * Q
CH = {"Dm": [50, 53, 57], "C": [48, 52, 55], "G": [43, 47, 50], "Am": [45, 48, 52], "F": [41, 45, 48], "Bb": [46, 50, 53]}
PROG = ["Dm", "C", "Dm", "G"]
TUNE = [(0, 74, 0.5), (0.5, 76, 0.5), (1, 77, 1), (2, 76, 0.5), (2.5, 74, 0.5), (3, 72, 1),
        (4, 74, 1.5), (5.5, 71, 0.5), (6, 69, 2),
        (8, 69, 0.5), (8.5, 72, 0.5), (9, 74, 1), (10, 76, 0.5), (10.5, 77, 0.5), (11, 79, 1),
        (12, 77, 1), (13, 76, 0.5), (13.5, 72, 0.5), (14, 74, 2)]


def lute(f, vel, dur=0.5):
    return I.pluck(f, vel, R, dur + 0.4, bright=0.62, pos=0.12)


def section(music, t0, t1, *, tune=True, fife=False, drum=True, pad=True, vel=0.6, sneaky=False):
    prog = ["Dm", "Am", "Dm", "Am"] if sneaky else PROG
    nb = int(np.ceil((t1 - t0) / BAR))
    for b in range(nb):
        tb = t0 + b * BAR
        name = prog[b % 4]
        if pad:
            place(music, I.pad([I.m2f(m) for m in CH[name]] + [I.m2f(38)], BAR, 0.28 * vel, R, att=0.3, rel=0.5), tb, 0.35)
        for k, off in enumerate([0, 1, 2, 3]):  # bass lute on the beat
            t = tb + off * Q
            if t < t1:
                place(music, pan(lute(I.m2f(CH[name][0] - 12 + (7 if k == 2 else 0)), 0.5 * vel, 0.35), -0.15), t, 0.9)
        if drum:
            for k in range(8 if not sneaky else 4):
                t = tb + k * Q / (2 if not sneaky else 1)
                if t < t1:
                    place(music, pan(I.brush(0.3 * vel * (1.4 if k % 4 == 0 else 0.8), R, 0.18), 0.25), t, 0.55)
    if tune:
        loop = 16 * Q
        for k in range(int(np.ceil((t1 - t0) / loop))):
            for beat, m, ln in TUNE:
                t = t0 + k * loop + beat * Q
                if t < t1 - 0.05:
                    mm = m - (12 if sneaky else 0)
                    place(music, pan(lute(I.m2f(mm), 0.5 * vel, ln * Q), 0.15), t)
                    if fife:
                        place(music, pan(I.fife(I.m2f(mm + 12), ln * Q * 0.9, 0.22 * vel, R), -0.2), t, 0.55)


def fanfare(music, t, gain=0.7):
    for k, m in enumerate([62, 66, 69, 74]):
        place(music, pan(I.brass(I.m2f(m), 0.18 if k < 3 else 0.6, 0.7, R, kind="horn"), 0.1 * k - 0.15), t + k * 0.13, gain)


def score():
    music = buf()
    s = lambda i: (fr(SHOTS[i][0]), fr(SHOTS[i][1]))  # noqa: E731
    section(music, 0.0, s(1)[1], fife=True, vel=0.75)                                  # hook
    section(music, s(2)[0], s(5)[1], fife=False, vel=0.65)                              # Richard builds
    section(music, s(6)[0], s(7)[1], fife=True, vel=0.65)                               # iron / butter
    section(music, s(8)[0], s(9)[1], tune=False, drum=False, vel=0.55)                  # Richard dies, John
    section(music, s(10)[0], s(11)[1], vel=0.7)                                         # siege
    section(music, s(12)[0], s(16)[1], sneaky=True, vel=0.6)                            # the climb (tiptoe)
    section(music, s(17)[0], s(18)[1], fife=True, vel=0.55)                             # you see
    section(music, s(19)[0], s(22)[1], vel=0.75)                                        # they pour in
    section(music, s(23)[0], DUR - 1.0, fife=True, vel=0.75)                            # reprise
    fanfare(music, fr(186))                      # "Richard the Lionheart" (aligned word time)
    fanfare(music, fr(1831), 0.6)                # the French flag
    for t, chord in [(fr(124), "Dm"), (fr(1056), "Dm"), (fr(1288), "C"), (fr(1472), "Dm"), (DUR - 1.1, "Dm")]:
        for m in CH[chord]:
            place(music, I.glock(I.m2f(m + 12), 0.45, R, 2.0), t, 0.7)
        place(music, I.timpani(I.m2f(CH[chord][0] - 12), 0.7, R), t, 0.6)
    # sad trombone under "Unluckily" and when Richard dies
    for t0 in [fr(1368), fr(777)]:
        for k, m in enumerate([46, 45, 44]):
            place(music, I.brass(I.m2f(m), 0.3 if k < 2 else 0.8, 0.5, R, kind="soft", fall=-0.08 if k == 2 else 0.0), t0 + k * 0.32, 0.6)
    return music


# ---------------------------------------------------------------- sfx
def bell(f):
    return modal(3.0, [(f, 1.0, 2.2), (f * 2.0, 0.5, 1.4), (f * 2.4, 0.35, 1.0), (f * 3.0, 0.25, 0.7), (f * 4.2, 0.15, 0.4)], R)


def thud(gain=2.0, dur=0.8, f=150):
    return lp(R.standard_normal(ns(dur)), f) * np.exp(-tt(dur) / 0.14) * gain


def pop(f0=520):
    return modal(0.25, [(f0, 1.0, 0.05), (f0 * 1.9, 0.4, 0.03)], R, glide=0.6, glide_tau=0.03) * 0.8


def sfx():
    out = buf()
    room = make_ir(1.4, 7, early=[(0.011, 0.5, -0.5), (0.017, 0.4, 0.6)])
    inside = buf()
    # ambience per light: breeze + birds outside, room tone inside
    for i, (a, b, light) in SHOTS.items():
        d = fr(b - a)
        if light in ("inside", "bank"):
            place(inside, pan(lp(colored(ns(d), R, -1.2), 220) * 0.2, 0.0), fr(a))
        else:
            place(out, G.breeze(d, R, 0.6 if light == "day" else 0.45), fr(a), 0.5)
            if light == "day":
                place(out, G.bird_chirps(d, R, 0.35), fr(a), 0.4)
    # whooshes on glides and the flash
    for f0, d, pk in [(86, 0.6, 0.3), (122, 0.6, 0.3), (226, 1.2, 0.6), (893, 0.9, 0.45), (1006, 0.9, 0.45), (1034, 0.7, 0.3),
                      (1148, 1.0, 0.5), (1322, 0.8, 0.4), (1548, 1.4, 0.7), (1662, 1.1, 0.5), (1988, 0.7, 0.35)]:
        place(out, G.whoosh(d, R, peak=pk), fr(f0) - pk * 0.3, 0.5)
    # the climber's scrapes (hook + shot 14)
    for k in range(6):
        place(out, pan(bp(colored(ns(0.18), R, 0.0), 800, 4000) * np.exp(-tt(0.18) / 0.05) * 0.6, -0.2), fr(90) + k * 0.33, 0.5)
        place(out, pan(bp(colored(ns(0.18), R, 0.0), 800, 4000) * np.exp(-tt(0.18) / 0.05) * 0.6, -0.2), fr(1230) + k * 0.3, 0.5)
    # 1196: builders' hammers
    for k in range(12):
        place(out, pan(G.hammer_hit(R, 0.4), 0.4 * (-1) ** k), fr(130) + 0.3 + k * 0.42, 0.45)
    # three rings rise: thuds; the keep
    for f0, g in [(287, 0.8), (295, 0.8), (302, 0.9), (357, 1.1)]:
        place(out, thud(1.8 * g), fr(f0), 0.8)
        place(out, I.timpani(I.m2f(38), 0.7 * g, R), fr(f0), 0.5)
    # coin sacks: thump + jingle; little castles pop
    for f0 in [388, 394, 400, 406]:
        place(out, thud(1.2, 0.4, 260), fr(f0), 0.7)
        for k in range(7):
            place(out, pan(G.clink(R), R.uniform(-0.5, 0.5)), fr(f0) + 0.02 + k * R.uniform(0.02, 0.05), 0.5)
    for k in range(5):
        place(out, pop(700 + 60 * k), fr(440 + k * 5), 0.6)
    # "daughter": a music-box twinkle
    for k, m in enumerate([81, 84, 88, 86]):
        place(out, pan(I.musicbox(I.m2f(m), 0.4, R, 1.2), 0.2), fr(548) + k * 0.14, 0.6)
    # "iron": anvil clang; "butter": squelch
    place(out, modal(1.2, [(980, 1.0, 0.5), (2510, 0.6, 0.3), (4120, 0.3, 0.2)], R) * 0.6, fr(672), 0.6)
    for f0 in [756, 1953]:
        squelch = bp(colored(ns(0.5), R, -0.5), 200, 1400) * np.exp(-tt(0.5) / 0.12) * smooth_noise(ns(0.5), R, 30) * 2.0
        place(out, squelch, fr(f0), 0.7)
        place(out, pop(300), fr(f0), 0.6)
    place(out, pop(380) * 1.2, fr(1971), 0.6)  # stone again
    # crown: falls, clatters, rolls
    place(out, modal(0.6, [(2100, 1.0, 0.12), (3300, 0.6, 0.08), (5200, 0.3, 0.05)], R) * 0.5, fr(789), 0.6)
    for k in range(10):
        place(out, pan(G.clink(R, f0=2000 + 300 * (k % 3), dur=0.08), 0.1 * k - 0.4), fr(792) + k * 0.08 + k * k * 0.006, 0.35)
    # the garderobe pops in, bells for the chapel
    place(out, pop(600) * 1.5, fr(913), 0.8)
    for k, f in enumerate([660, 784]):
        place(out, pan(bell(f) * 0.3, 0.3 * (k * 2 - 1)), fr(889) + k * 0.35, 0.6)
    # the siege: marching boots, picks, the collapse
    for k in range(int(fr(1006 - 929) / 0.5)):
        place(out, pan(G.boot(R, 0.7), 0.15 * (-1) ** k), fr(929) + k * 0.5, 0.5)
    for k in range(int(fr(1050 - 1014) / 0.35)):
        place(out, pan(G.clink(R, f0=R.uniform(1500, 2600), dur=0.1), R.uniform(-0.3, 0.3)), fr(1014) + k * 0.35, 0.6)
        place(out, thud(0.6, 0.2, 400), fr(1014) + k * 0.35, 0.5)
    # risers into the big reveals (GrowKaz sound rule: riser 1-2 s before, impact on it)
    for f0, d in [(1056, 1.6), (1288, 1.0), (1953, 1.2)]:
        place(out, G.whoosh(d, R, peak=d * 0.95, f_lo=200, f_hi=4000, tail=0.05), fr(f0) - d * 0.95, 0.45)
    rumble = lp(colored(ns(3.0), R, -1.0), 120) * np.exp(-tt(3.0) / 0.9) * 2.5
    place(out, rumble, fr(1050), 1.0)
    place(out, thud(3.0, 1.2, 110), fr(1060), 1.0)
    place(out, bp(colored(ns(2.0), R, 0.0), 300, 3500) * np.exp(-tt(2.0) / 0.5) * 0.5, fr(1062), 0.7)
    for k in range(14):
        place(out, pan(modal(0.3, [(R.uniform(300, 900), 1.0, 0.04)], R) * 0.5, R.uniform(-0.7, 0.7)), fr(1064) + R.uniform(0, 1.2), 0.6)
    # defenders laugh, the climber's "huh?"
    place(out, G.babble(1.1, R, 140, 1.0) * 0.25, fr(1080), 1.0)
    place(out, G.whoa(R), fr(1156), 0.35)
    # the pop out of the toilet seat, the gag, the fly
    place(inside, pop(420) * 1.6, fr(1288), 0.9)
    place(inside, G.oof(R, kind="ugh"), fr(1452), 0.5)
    fly = np.sin(2 * np.pi * np.cumsum(190 + 40 * np.sin(2 * np.pi * 4.2 * tt(3.4))) / SR) * (0.5 + 0.5 * smooth_noise(ns(3.4), R, 6))
    place(inside, pan(bp(np.sign(fly) * 0.3, 150, 2500) * 0.35, 0.3), fr(1368), 0.6)
    # the plop (shot 17)
    place(out, pop(900), fr(1545), 0.5)
    place(out, G.splash_big(R) * 0.25, fr(1598), 0.5)
    # the vault: heavy clunk, the doggy flap
    place(inside, thud(2.2, 0.6, 200), fr(1653), 0.8)
    place(inside, modal(0.8, [(220, 1.0, 0.3), (510, 0.6, 0.2)], R) * 0.6, fr(1653), 0.6)
    place(inside, G.creak(0.4, R, scale=0.6), fr(1684), 0.5)
    place(inside, pop(520), fr(1688), 0.6)
    # his friends pop up one by one, fire
    for f0 in [1716, 1727, 1737]:
        place(inside, pop(380 + (f0 - 1716) * 6) * 1.3, fr(f0 + 2), 0.8)
    crack = hp(colored(ns(1.4), R, 0.0), 1200) * (R.random(ns(1.4)) > 0.996) * 4.0 + lp(colored(ns(1.4), R, -1.0), 600) * 0.5
    place(inside, fades(crack, 0.1, 0.3), fr(1743), 0.6)
    # the gate: creak, bang, marching in, a cheer
    place(out, G.creak(0.9, R, rate0=80, rate1=140), fr(1760), 0.7)
    place(out, thud(2.0, 0.6, 180), fr(1778), 0.8)
    for k in range(6):
        place(out, pan(G.boot(R, 0.9), 0.2 * (-1) ** k), fr(1766) + k * 0.28, 0.6)
    place(out, G.hurrah(R, 150, 1.0) * 0.5, fr(1772), 0.6)
    # the flag on the keep
    place(out, G.flag_flutter(1.4, R) * 0.6, fr(1826), 0.6)
    # John: gasp
    place(inside, G.whoa(R), fr(1852), 0.35)
    # last beat: a cheeky flag flutter and the final sting
    place(out, G.flag_flutter(1.2, R) * 0.5, fr(1995), 0.6)
    wet = convolve_st(inside, room)[:, :N]
    out[:, : wet.shape[1]] += wet * 0.5
    out += inside * 0.65
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
    fx *= (vr / rms(fx)) * dbg(-12.0 - 6.0 + 6.0)  # SFX bed sits ~-12 dB under the voice
    music *= dbg(-9.0) ** key[None, :]  # duck -9 dB under the voice (was -4: the music fought the words)
    out = voice + music + fx
    out /= max(1e-6, np.abs(out).max()) / 0.89
    (HERE / "audio").mkdir(exist_ok=True)
    write_wav(str(HERE / "audio" / "mix.wav"), out)
    for name, x in [("voice", voice), ("music", music), ("sfx", fx)]:
        write_wav(str(HERE / "audio" / f"stem_{name}.wav"), x / max(1e-6, np.abs(x).max()) * 0.89)
    print(f"mix: {N / SR:.2f} s")


if __name__ == "__main__":
    mix()
