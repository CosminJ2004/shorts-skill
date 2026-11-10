"""Sound for "The Pyramid Wearing a Church": an original synthesized score + frame-locked SFX, mixed under the voice.

Uses the cartoon-3d-short skill's synthesis building blocks (dsp.py, instruments.py, sfx_gen.py); the score, cue list
and mix are ours. Frames match src/videos/pyramid/story.ts (30 fps). Output: audio/mix.wav (48 kHz stereo, exact
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
TOTAL = 1806
DUR = TOTAL / FPS
N = ns(DUR)
fr = lambda f: f / FPS  # noqa: E731
SHOTS = {1: (0, 124, "day"), 2: (124, 251, "golden"), 3: (251, 428, "golden"), 4: (428, 551, "golden"), 5: (551, 661, "day"),
         6: (661, 834, "golden"), 7: (834, 931, "day"), 8: (931, 1048, "day"), 9: (1048, 1179, "day"), 10: (1179, 1312, "day"),
         11: (1312, 1487, "tunnel"), 12: (1487, 1630, "tunnel"), 13: (1630, TOTAL, "day")}

R = rng(1594)


def buf():
    return np.zeros((2, N))


# ---------------------------------------------------------------- score
# 108 bpm, F major, a sunny marimba-and-glock tune with a soft pad; sections follow the story beats.
BPM = 108
Q = 60 / BPM
BAR = 4 * Q
CH = {"F": [53, 57, 60], "C": [48, 52, 55], "Dm": [50, 53, 57], "Bb": [46, 50, 53], "Gm": [55, 58, 62], "Am": [45, 48, 52]}
PROG = ["F", "C", "Dm", "Bb"]
TUNE = [(0, 72, 1), (1, 74, 0.5), (1.5, 76, 0.5), (2, 77, 1), (3, 76, 1),
        (4, 74, 1.5), (5.5, 72, 0.5), (6, 74, 2),
        (8, 69, 1), (9, 72, 1), (10, 74, 0.5), (10.5, 72, 0.5), (11, 69, 1),
        (12, 70, 1.5), (13.5, 69, 0.5), (14, 67, 2)]  # beats, midi, length


def marimba(f, vel, dur=0.6):
    return I.pluck(f, vel, R, dur, ) if False else I.vibes(f, vel * 0.9, R, dur, damp=dur * 0.6, trem_depth=0.0)


def bass_note(m, t, vel, music):
    place(music, pan(I.pluck(I.m2f(m - 12), vel, R, 0.8), -0.1), t, 0.9)


def chord_pad(name, t, dur, vel, music):
    place(music, I.pad([I.m2f(m) for m in CH[name]], dur, vel, R, att=0.4, rel=0.6), t, 0.35)


def section(music, t0, t1, *, tune=True, pad=True, bass=True, perc=False, glock_top=False, minor=False, vel=0.6):
    """fill [t0, t1) with the loop: 4-bar progression, optional tune / bass / soft shaker"""
    prog = ["Dm", "Am", "Bb", "C"] if minor else PROG
    nb = int(np.ceil((t1 - t0) / BAR))
    for b in range(nb):
        tb = t0 + b * BAR
        name = prog[b % 4]
        if pad:
            chord_pad(name, tb, BAR, 0.32 * vel, music)
        if bass:
            for k, off in enumerate([0, 1.5, 2, 3]):
                tt0 = tb + off * Q
                if tt0 < t1:
                    bass_note(CH[name][0] + (7 if k == 2 else 0), tt0, 0.55 * vel, music)
        if perc:
            for k in range(8):
                tt0 = tb + k * Q / 2
                if tt0 < t1:
                    place(music, pan(I.brush(0.25 * vel * (1.3 if k % 2 == 0 else 0.8), R, 0.15), 0.3), tt0, 0.5)
    if tune:
        loop = 16 * Q
        for k in range(int(np.ceil((t1 - t0) / loop))):
            for beat, m, ln in TUNE:
                t = t0 + k * loop + beat * Q
                if t < t1 - 0.05:
                    mm = m - (3 if minor and m % 12 in (4, 9) else 0)
                    place(music, pan(marimba(I.m2f(mm), 0.55 * vel, ln * Q + 0.2), 0.15), t)
                    if glock_top:
                        place(music, pan(I.glock(I.m2f(mm + 12), 0.25 * vel, R, 1.2), -0.2), t, 0.6)


def score():
    music = buf()
    s = lambda i: (fr(SHOTS[i][0]), fr(SHOTS[i][1]))  # noqa: E731
    section(music, 0.0, s(1)[1], perc=True, glock_top=True, vel=0.75)                 # hook
    section(music, s(2)[0], s(4)[1], perc=True, vel=0.65)                              # building, grandkids
    section(music, s(5)[0], s(5)[1], perc=True, glock_top=True, vel=0.7)               # twice Giza
    section(music, s(6)[0], s(7)[1], tune=False, bass=False, vel=0.6, minor=True)      # the city shrinks, overgrowth
    section(music, s(8)[0], s(9)[1], perc=True, vel=0.6)                               # the church, lucky/unlucky
    section(music, s(10)[0], s(10)[1], tune=True, bass=True, glock_top=True, vel=0.55) # nesting dolls
    section(music, s(11)[0], s(12)[0], tune=False, perc=False, minor=True, vel=0.55)   # tunnels
    section(music, s(12)[0], s(12)[1], tune=True, minor=False, glock_top=True, vel=0.5)
    section(music, s(13)[0], DUR - 1.2, perc=True, glock_top=True, vel=0.75)           # reprise
    # stings
    for t, chord in [(fr(124), "F"), (fr(1012), "F"), (fr(1500), "Dm"), (fr(1565), "F"), (DUR - 1.3, "F")]:
        for m in CH[chord]:
            place(music, I.glock(I.m2f(m + 12), 0.5, R, 2.0), t, 0.7)
        place(music, I.timpani(I.m2f(CH[chord][0] - 12), 0.7, R), t, 0.6)
    # sad two-note brass under "Unluckily"
    place(music, I.brass(I.m2f(46), 0.45, 0.6, R), fr(1104), 0.7)
    place(music, I.brass(I.m2f(45), 0.7, 0.5, R), fr(1104) + 0.5, 0.7)
    return music


# ---------------------------------------------------------------- sfx
def sfx():
    out = buf()
    room = make_ir(1.6, 7, early=[(0.011, 0.5, -0.5), (0.017, 0.4, 0.6)])  # tunnel reverb
    tun = buf()
    # ambience per light: breeze + birds outside, rain during the overgrowth, a low rumble underground
    for i, (a, b, light) in SHOTS.items():
        d = fr(b - a)
        if light == "tunnel":
            place(tun, pan(lp(colored(ns(d), R, -1.2), 180) * 0.25, 0.0), fr(a))
            for k in range(int(d / 1.3)):
                place(tun, pan(modal(0.4, [(R.uniform(1800, 2600), 1.0, 0.03)], R) * 0.25, R.uniform(-0.6, 0.6)), fr(a) + k * 1.3 + R.uniform(0, 0.6))
        else:
            place(out, G.breeze(d, R, 0.6 if light == "day" else 0.4), fr(a), 0.5)
            if light == "day":
                place(out, G.bird_chirps(d, R, 0.4), fr(a), 0.45)
    # rain then birds (overgrowth, shot 6)
    rain = hp(colored(ns(3.0), R, 0.2), 1500) * smooth_noise(ns(3.0), R, 3) * 0.12
    place(out, fades(rain, 0.6, 0.8), fr(724), 1.0)
    place(out, G.bird_chirps(2.0, R, 1.2), fr(790), 0.7)
    for k in range(10):  # trees popping up
        place(out, pan(I.pluck(I.m2f(72 + (k * 5) % 12), 0.3, R, 0.3), R.uniform(-0.6, 0.6)), fr(792 + k * 4), 0.6)
    # whooshes on glides / the flash / the crane
    for f0, d, pk in [(60, 0.9, 0.45), (122, 0.6, 0.3), (190, 0.9, 0.45), (360, 0.5, 0.15), (500, 0.9, 0.45), (785, 0.9, 0.45),
                      (1005, 0.8, 0.4), (1100, 0.5, 0.12), (1400, 0.5, 0.15), (1560, 0.5, 0.15), (1700, 1.8, 0.9)]:
        place(out, G.whoosh(d, R, peak=pk), fr(f0) - pk * 0.3, 0.55)
    # builders' hammers (shot 2)
    for k in range(9):
        place(out, pan(G.hammer_hit(R, 0.35), -0.4), fr(130) + 0.45 + k * 0.9, 0.5)
    # each new stage lands: deep thud + timpani + dust
    for f0, big in [(396, 1.0), (452, 0.7), (490, 0.8), (522, 1.1)]:
        thud = lp(R.standard_normal(ns(0.8)), 160) * np.exp(-tt(0.8) / 0.12) * 2.2
        place(out, thud * big, fr(f0), 0.9)
        place(out, I.timpani(I.m2f(36), 0.8 * big, R), fr(f0), 0.6)
        place(out, bp(colored(ns(1.2), R, 0.0), 300, 3000) * np.exp(-tt(1.2) / 0.35) * 0.25, fr(f0) + 0.05, 0.6)
    # the church lands: thud + bells
    place(out, lp(R.standard_normal(ns(0.8)), 160) * np.exp(-tt(0.8) / 0.12) * 2.0, fr(1012), 0.9)
    bell = lambda f: modal(3.5, [(f, 1.0, 2.5), (f * 2.0, 0.5, 1.6), (f * 2.4, 0.35, 1.2), (f * 3.0, 0.25, 0.8), (f * 4.2, 0.15, 0.5)], R)  # noqa: E731
    for k, f in enumerate([523, 659, 784, 523]):
        place(out, pan(bell(f) * 0.35, 0.3 * (k % 2 * 2 - 1)), fr(1016) + k * 0.42, 0.7)
    # nesting dolls: three lifts (whoosh up + wooden "plonk")
    for f0 in [1226, 1254, 1290]:
        place(out, G.whoosh(0.7, R, peak=0.35, f_lo=300, f_hi=3000), fr(f0), 0.5)
        place(out, modal(0.4, [(320, 1.0, 0.08), (690, 0.6, 0.05), (1240, 0.3, 0.03)], R) * 0.8, fr(f0) + 0.02, 0.7)
    # tunnel footsteps (shot 11, ~1 step per 0.5 s) and the gasp at the stair, a muffled party at the mural
    for k in range(int(fr(1487 - 1312) / 0.5)):
        place(tun, pan(G.stroll_step(R, 0.7), 0.1 * (-1) ** k), fr(1312) + 0.2 + k * 0.5, 0.7)
    place(tun, G.babble(fr(1630 - 1560), R, 190, 1.0) * 0.18, fr(1560), 1.0)
    wet = convolve_st(tun, room)[:, :N]
    out[:, : wet.shape[1]] += wet * 0.55
    out += tun * 0.6
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
    # duck the music by -4 dB while the voice speaks (key = words.json)
    key = np.zeros(N)
    for w in words:
        key[ns(max(0, w["start"] - 0.08)): ns(w["end"] + 0.15)] = 1.0
    key = np.convolve(key, np.ones(ns(0.12)) / ns(0.12), mode="same")
    music, fx = score(), sfx()
    rms = lambda x: np.sqrt(np.mean(x ** 2) + 1e-12)  # noqa: E731
    vr = rms(voice[:, voice.any(axis=0)]) if voice.any() else 0.1
    music *= (vr / rms(music)) * dbg(-13.0 + 3.0)  # skill rule: music +3 dB over our base
    fx *= (vr / rms(fx)) * dbg(-12.0 - 6.0 + 6.0)  # SFX bed sits ~-12 dB under the voice
    music *= dbg(-4.0) ** key[None, :]
    out = voice + music + fx
    out /= max(1e-6, np.abs(out).max()) / 0.89
    (HERE / "audio").mkdir(exist_ok=True)
    write_wav(str(HERE / "audio" / "mix.wav"), out)
    for name, x in [("voice", voice), ("music", music), ("sfx", fx)]:
        write_wav(str(HERE / "audio" / f"stem_{name}.wav"), x / max(1e-6, np.abs(x).max()) * 0.89)
    print(f"mix: {N / SR:.2f} s")


if __name__ == "__main__":
    mix()
