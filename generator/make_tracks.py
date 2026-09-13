"""
Sunflower parakeet deterrent - track generator.

Builds a set of long, mostly-silent MP3 tracks. Each track scatters a handful of
randomised scare events across a long quiet stretch. The farmer plays one track
at dawn and another in the late afternoon, at full volume, through whatever
speaker is already on the farm.

Everything is band-limited to roughly 1-5 kHz. That is where parrot hearing peaks
(budgerigar audiogram best sensitivity near 3 kHz, poor response above 8 kHz) and
it is also the passband of a cheap PA horn speaker, so no power is wasted on
frequencies the birds cannot hear.

Dependencies: numpy, lameenc.
"""

import argparse
import json
import os
import random
import wave
from datetime import datetime

import numpy as np

SR = 22050          # plenty for a 5 kHz ceiling
PEAK = 0.94         # leave a little headroom before the encoder


# ---------------------------------------------------------------- primitives

def _n(seconds):
    return max(1, int(round(seconds * SR)))


def bandpass(x, lo, hi, rolloff=0.3):
    """Zero-phase band limit with raised-cosine edges."""
    n = len(x)
    spec = np.fft.rfft(x)
    freq = np.fft.rfftfreq(n, 1.0 / SR)
    gain = np.ones_like(freq)

    lo0 = max(1.0, lo * (1.0 - rolloff))
    hi1 = hi * (1.0 + rolloff)

    gain[freq < lo0] = 0.0
    band = (freq >= lo0) & (freq < lo)
    gain[band] = 0.5 - 0.5 * np.cos(np.pi * (freq[band] - lo0) / (lo - lo0))
    band = (freq > hi) & (freq <= hi1)
    gain[band] = 0.5 + 0.5 * np.cos(np.pi * (freq[band] - hi) / (hi1 - hi))
    gain[freq > hi1] = 0.0

    return np.fft.irfft(spec * gain, n)


def envelope(n, attack, decay, curve=2.0):
    """Percussive envelope. attack and decay are fractions of the whole."""
    env = np.ones(n)
    a = max(1, int(n * attack))
    d = max(1, int(n * decay))
    env[:a] = np.linspace(0.0, 1.0, a) ** 0.6
    env[n - d:] = np.linspace(1.0, 0.0, d) ** curve
    return env


def wander(n, rate, depth, rng):
    """Smooth random walk, used to make tones sound alive rather than synthetic."""
    steps = max(2, int(n / SR * rate))
    raw = rng.normal(0.0, 1.0, steps).cumsum()
    raw -= raw.mean()
    if np.abs(raw).max() > 0:
        raw /= np.abs(raw).max()
    return np.interp(np.linspace(0, steps - 1, n), np.arange(steps), raw) * depth


def voiced(f_track, harmonics, rng, jitter=0.0):
    """Additive harmonic tone following an instantaneous frequency track."""
    n = len(f_track)
    if jitter:
        f_track = f_track * (1.0 + wander(n, 70, jitter, rng))
    phase = 2 * np.pi * np.cumsum(f_track) / SR
    out = np.zeros(n)
    for i, amp in enumerate(harmonics, start=1):
        if f_track.max() * i > SR / 2.2:
            break
        out += amp * np.sin(i * phase + rng.uniform(0, 2 * np.pi))
    return out


def normalise(x, level=1.0):
    peak = np.abs(x).max()
    if peak < 1e-9:
        return x
    return x / peak * level


# ---------------------------------------------------------------- stimuli

def parakeet_alarm(rng):
    """
    Rose-ringed parakeet alarm screech, the harsh repeated call of a flock that
    has just seen something. Harmonic stack plus heavy amplitude roughness.
    """
    n_calls = rng.integers(4, 10)
    base = rng.uniform(1150, 1650)
    parts = []

    for _ in range(n_calls):
        dur = rng.uniform(0.11, 0.22)
        n = _n(dur)
        f0 = base * rng.uniform(0.92, 1.08)
        # short rise then a fall, which is the shape of the screech
        knee = int(n * rng.uniform(0.2, 0.35))
        f_track = np.concatenate([
            np.linspace(f0 * 0.82, f0 * 1.12, knee),
            np.linspace(f0 * 1.12, f0 * 0.88, n - knee),
        ])
        amps = [1.0, 0.85, 0.7, 0.55, 0.4, 0.3, 0.22]
        sig = voiced(f_track, amps, rng, jitter=0.035)
        sig = sig + rng.normal(0, 0.28, n)                 # breathy rasp
        rough = 1.0 - 0.45 * (0.5 + 0.5 * np.sin(
            2 * np.pi * rng.uniform(55, 110) * np.arange(n) / SR))
        sig = sig * rough * envelope(n, 0.06, 0.35)
        parts.append(sig)
        parts.append(np.zeros(_n(rng.uniform(0.05, 0.17))))

    return normalise(bandpass(np.concatenate(parts), 900, 5200))


def distress_scream(rng):
    """
    A caught bird. Longer, more chaotic, with the frequency jumps and broken
    voicing that make a distress call different from an ordinary alarm.
    """
    n_calls = rng.integers(3, 6)
    parts = []

    for _ in range(n_calls):
        dur = rng.uniform(0.3, 0.65)
        n = _n(dur)
        f0 = rng.uniform(1300, 1900)
        f_track = f0 * (1.0 + wander(n, 14, 0.28, rng))
        # abrupt register break partway through, a hallmark of real distress
        if rng.random() < 0.7:
            brk = int(n * rng.uniform(0.3, 0.7))
            f_track[brk:] = f_track[brk:] * rng.uniform(1.25, 1.6)
        amps = [1.0, 0.9, 0.8, 0.65, 0.5, 0.4, 0.3, 0.22]
        sig = voiced(f_track, amps, rng, jitter=0.07)
        sig = sig + rng.normal(0, 0.45, n)
        rough = 1.0 - 0.5 * (0.5 + 0.5 * np.sin(
            2 * np.pi * rng.uniform(40, 90) * np.arange(n) / SR))
        sig = sig * rough * envelope(n, 0.03, 0.25, curve=1.4)
        parts.append(sig)
        parts.append(np.zeros(_n(rng.uniform(0.08, 0.3))))

    return normalise(bandpass(np.concatenate(parts), 950, 5400))


def shikra_call(rng):
    """
    Shikra (Accipiter badius), the hawk that actually hunts parakeets across the
    Terai and the hills. Sharp, clear, two-note call repeated in a series.
    Tonal and piercing rather than harsh.
    """
    n_pairs = rng.integers(3, 7)
    base = rng.uniform(2200, 3000)
    parts = []

    for _ in range(n_pairs):
        # first note: short and high
        n1 = _n(rng.uniform(0.06, 0.1))
        f1 = np.linspace(base * 1.05, base * 1.15, n1)
        a = voiced(f1, [1.0, 0.5, 0.25, 0.12], rng, jitter=0.012)
        a = a * envelope(n1, 0.1, 0.45)

        gap = np.zeros(_n(rng.uniform(0.04, 0.07)))

        # second note: longer, falling
        n2 = _n(rng.uniform(0.16, 0.26))
        f2 = np.linspace(base * 1.0, base * 0.74, n2)
        b = voiced(f2, [1.0, 0.45, 0.2, 0.1], rng, jitter=0.015)
        b = b * envelope(n2, 0.08, 0.5)

        parts += [a, gap, b, np.zeros(_n(rng.uniform(0.22, 0.5)))]
        base = base * rng.uniform(0.98, 1.02)

    return normalise(bandpass(np.concatenate(parts), 1600, 5200))


def startle_bang(rng):
    """
    Broadband transient with a near-instant attack. Does not need to be
    species-accurate: a sharp unexpected crack triggers a startle response on
    its own, and it is the component that habituates slowest.
    """
    n_bangs = rng.integers(1, 4)
    parts = []
    for _ in range(n_bangs):
        n = _n(rng.uniform(0.12, 0.3))
        sig = rng.normal(0, 1.0, n)
        sig = sig * np.exp(-np.linspace(0, rng.uniform(9, 18), n))
        ramp = _n(0.0015)
        sig[:ramp] = sig[:ramp] * np.linspace(0, 1, ramp)
        parts.append(bandpass(sig, 700, 5600))
        if rng.random() < 0.5:
            parts.append(np.zeros(_n(rng.uniform(0.06, 0.25))))
    return normalise(np.concatenate(parts))


def mob_chatter(rng):
    """
    The ragged chorus of a flock mobbing a predator. Dense, overlapping and
    irregular, which is hard for a bird to file away as background noise.
    """
    n = _n(rng.uniform(1.4, 3.0))
    out = np.zeros(n)

    for _ in range(int(rng.integers(14, 30))):
        cn = _n(rng.uniform(0.04, 0.12))
        if cn >= n:
            continue
        start = int(rng.integers(0, n - cn))
        f0 = rng.uniform(1400, 3200)
        direction = 1 if rng.random() < 0.5 else -1
        f_track = np.linspace(f0, f0 * (1 + direction * rng.uniform(0.15, 0.5)), cn)
        sig = voiced(f_track, [1.0, 0.7, 0.5, 0.35, 0.2], rng, jitter=0.05)
        sig = sig + rng.normal(0, 0.3, cn)
        sig = sig * envelope(cn, 0.08, 0.4) * rng.uniform(0.5, 1.0)
        out[start:start + cn] += sig

    return normalise(bandpass(out, 1100, 5200))


STIMULI = {
    "alarm": parakeet_alarm,
    "distress": distress_scream,
    "shikra": shikra_call,
    "bang": startle_bang,
    "chatter": mob_chatter,
}


# ---------------------------------------------------------------- events

def build_event(rng):
    """
    One scare event: two or three stimuli in sequence, escalating.

    The ordering is deliberate. An alarm or a hawk call arrives first, because a
    bird that flushes on the warning never learns how empty the bang is. The bang
    is held back as the closer and is not used every time.
    """
    opener = str(rng.choice(["alarm", "shikra", "alarm", "chatter"]))
    parts = [STIMULI[opener](rng), np.zeros(_n(rng.uniform(0.25, 0.9)))]

    options = [k for k in ("distress", "shikra", "alarm", "chatter") if k != opener]
    middle = str(rng.choice(options))
    parts.append(STIMULI[middle](rng) * rng.uniform(0.85, 1.0))

    used = [opener, middle]

    if rng.random() < 0.55:
        parts.append(np.zeros(_n(rng.uniform(0.15, 0.6))))
        parts.append(startle_bang(rng))
        used.append("bang")

    return normalise(np.concatenate(parts), rng.uniform(0.85, 1.0)), used


def build_track(minutes, rng, gap_min=80, gap_max=200):
    """
    A long, mostly silent track. The silence is the active ingredient: it is what
    keeps the loud parts loud, and it is why a bird cannot predict the next one.
    """
    total = _n(minutes * 60)
    track = np.zeros(total)
    log = []

    cursor = _n(rng.uniform(8, 30))
    while cursor < total:
        event, used = build_event(rng)
        if cursor + len(event) >= total:
            break
        track[cursor:cursor + len(event)] += event
        log.append({
            "at_seconds": round(cursor / SR, 2),
            "duration": round(len(event) / SR, 2),
            "stimuli": used,
        })
        cursor += len(event) + _n(rng.uniform(gap_min, gap_max))

    return normalise(track, PEAK), log


# ---------------------------------------------------------------- output

def _pcm(audio):
    return (np.clip(audio, -1.0, 1.0) * 32767).astype("<i2")


def write_wav(path, audio):
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(_pcm(audio).tobytes())


def write_mp3(path, audio, bitrate=64):
    import lameenc
    enc = lameenc.Encoder()
    enc.set_bit_rate(bitrate)
    enc.set_in_sample_rate(SR)
    enc.set_channels(1)
    enc.set_quality(2)
    data = enc.encode(_pcm(audio).tobytes())
    data += enc.flush()
    with open(path, "wb") as f:
        f.write(data)


def main():
    p = argparse.ArgumentParser(description="Generate parakeet deterrent tracks.")
    p.add_argument("--minutes", type=float, default=15.0,
                   help="length of each track in minutes")
    p.add_argument("--count", type=int, default=6,
                   help="how many different tracks to build")
    p.add_argument("--out", default="tracks", help="output directory")
    p.add_argument("--seed", type=int, default=None,
                   help="fix the seed to reproduce an exact set")
    p.add_argument("--wav", action="store_true", help="also write WAV files")
    p.add_argument("--bitrate", type=int, default=64)
    args = p.parse_args()

    seed = args.seed if args.seed is not None else random.SystemRandom().randrange(2 ** 31)
    os.makedirs(args.out, exist_ok=True)

    manifest = {
        "generated": datetime.now().isoformat(timespec="seconds"),
        "seed": seed,
        "sample_rate": SR,
        "minutes_per_track": args.minutes,
        "tracks": [],
    }

    for i in range(args.count):
        rng = np.random.default_rng(seed + i * 7919)
        audio, log = build_track(args.minutes, rng)

        name = "track_%02d" % (i + 1)
        mp3_path = os.path.join(args.out, name + ".mp3")
        write_mp3(mp3_path, audio, args.bitrate)
        if args.wav:
            write_wav(os.path.join(args.out, name + ".wav"), audio)

        size_mb = os.path.getsize(mp3_path) / 1e6
        manifest["tracks"].append({
            "file": name + ".mp3",
            "events": len(log),
            "size_mb": round(size_mb, 2),
            "log": log,
        })
        print("%s  %2d events  %5.1f MB" % (name + ".mp3", len(log), size_mb))

    with open(os.path.join(args.out, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)

    print("\nseed %d, written to %s" % (seed, os.path.abspath(args.out)))


if __name__ == "__main__":
    main()
