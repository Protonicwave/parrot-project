"""Signal primitives: band limiting, envelopes, frequency tracks and measurement."""

import numpy as np

SAMPLE_RATE = 22050     # plenty for a 5 kHz ceiling
PEAK = 0.94             # leave a little headroom before the encoder

# The working band. Taken from the budgerigar audiogram: best sensitivity near
# 3 kHz, poor response above 8 kHz. It is also the passband of a cheap PA horn,
# so nothing outside it survives the speaker either.
BAND_LOW = 1000.0
BAND_HIGH = 5000.0


def samples(seconds):
    """Sample count for a duration, never zero."""
    return max(1, int(round(seconds * SAMPLE_RATE)))


def bandpass(x, lo, hi, rolloff=0.3):
    """Zero-phase band limit with raised-cosine edges."""
    n = len(x)
    spec = np.fft.rfft(x)
    freq = np.fft.rfftfreq(n, 1.0 / SAMPLE_RATE)
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


# Relative audibility across the band, from the budgerigar audiogram: best
# sensitivity near 3 kHz, falling away towards both edges. Energy at 5 kHz is
# real power the amplifier pays for and the bird barely registers.
_HEARING_HZ = (0.0, 900.0, 1200.0, 2000.0, 3200.0, 3900.0, 4500.0, 5000.0, 5800.0)
_HEARING_GAIN = (0.0, 0.50, 0.80, 1.00, 1.00, 0.88, 0.60, 0.42, 0.0)


def weight_to_hearing(x):
    """Tilt a band limited signal towards the frequencies the target species hears best."""
    n = len(x)
    spec = np.fft.rfft(x)
    freq = np.fft.rfftfreq(n, 1.0 / SAMPLE_RATE)
    gain = np.interp(freq, _HEARING_HZ, _HEARING_GAIN, left=0.0, right=0.0)
    return np.fft.irfft(spec * gain, n)


def envelope(n, attack, decay, curve=2.0):
    """Percussive envelope. attack and decay are fractions of the whole."""
    env = np.ones(n)
    a = max(1, int(n * attack))
    d = max(1, int(n * decay))
    env[:a] = np.linspace(0.0, 1.0, a) ** 0.6
    env[n - d:] = np.linspace(1.0, 0.0, d) ** curve
    return env


def fade_edges(x, seconds=0.01):
    """Taper both ends so a cut clip does not click."""
    n = min(samples(seconds), len(x) // 2)
    if n < 2:
        return x
    out = x.copy()
    ramp = np.linspace(0.0, 1.0, n)
    out[:n] *= ramp
    out[-n:] *= ramp[::-1]
    return out


def wander(n, rate, depth, rng):
    """Smooth random walk, used to make tones sound alive rather than synthetic."""
    steps = max(2, int(n / SAMPLE_RATE * rate))
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
    phase = 2 * np.pi * np.cumsum(f_track) / SAMPLE_RATE
    out = np.zeros(n)
    for i, amp in enumerate(harmonics, start=1):
        if f_track.max() * i > SAMPLE_RATE / 2.2:
            break
        out += amp * np.sin(i * phase + rng.uniform(0, 2 * np.pi))
    return out


def normalise(x, level=1.0):
    peak = np.abs(x).max()
    if peak < 1e-9:
        return x
    return x / peak * level


def loudest_window(x, seconds, hop_seconds=0.05):
    """
    The most energetic stretch of a recording.

    Field recordings open with wind and handling noise and the bird is rarely at
    the start, so the clip worth keeping is found rather than assumed.
    """
    width = samples(seconds)
    if len(x) <= width:
        return x
    hop = max(1, samples(hop_seconds))
    energy = np.cumsum(np.concatenate([[0.0], x.astype(np.float64) ** 2]))
    starts = np.arange(0, len(x) - width, hop)
    totals = energy[starts + width] - energy[starts]
    return x[starts[int(np.argmax(totals)):][0]:][:width]


def spectrum(x):
    """Magnitude spectrum and its frequency axis."""
    window = np.hanning(len(x))
    magnitude = np.abs(np.fft.rfft(x * window))
    return np.fft.rfftfreq(len(x), 1.0 / SAMPLE_RATE), magnitude


def band_energy_fraction(x, lo=BAND_LOW, hi=BAND_HIGH):
    """Share of total energy falling inside a band."""
    freq, magnitude = spectrum(x)
    power = magnitude ** 2
    total = power.sum()
    if total <= 0:
        return 0.0
    return float(power[(freq >= lo) & (freq <= hi)].sum() / total)


def spectral_centroid(x):
    """Energy weighted mean frequency, the usual one number summary of brightness."""
    freq, magnitude = spectrum(x)
    power = magnitude ** 2
    total = power.sum()
    if total <= 0:
        return 0.0
    return float((freq * power).sum() / total)
