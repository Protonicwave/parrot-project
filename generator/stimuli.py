"""The five stimulus voices: three cut from real recordings, two synthesised."""

import numpy as np

import dsp


class Library:
    """Decoded source recordings, keyed by the role they play."""

    def __init__(self, clips):
        self.clips = clips

    def clip(self, role, rng, seconds):
        """
        The loudest stretch of a randomly chosen recording.

        The pool is already band weighted and trimmed to a verified passage by
        sources.prepare, so all that is left here is choosing the length.
        """
        pool = self.clips[role]
        source = pool[int(rng.integers(0, len(pool)))]
        return dsp.normalise(dsp.fade_edges(dsp.loudest_window(source, seconds)))


def parakeet_alarm(rng, library):
    """Rose-ringed parakeet alarm, the harsh repeated screech of a flock that has seen something."""
    return library.clip("alarm", rng, rng.uniform(1.8, 3.6))


def mob_chatter(rng, library):
    """The ragged chorus of a flock in flight, dense and irregular."""
    return library.clip("chatter", rng, rng.uniform(1.6, 3.2))


def shikra_call(rng, library):
    """Shikra, the hawk that actually hunts parakeets across the Terai and the hills."""
    return library.clip("shikra", rng, rng.uniform(1.4, 2.8))


def distress_scream(rng, library=None):
    """
    A caught bird. Synthesised, because Xeno-canto holds no distress recording
    for any parrot: a distress call means a bird in the hand, which is not what
    a field archive collects. Frequency jumps and broken voicing are what
    separate distress from an ordinary alarm, so they are modelled explicitly.
    """
    n_calls = rng.integers(3, 6)
    parts = []

    for _ in range(n_calls):
        n = dsp.samples(rng.uniform(0.3, 0.65))
        f0 = rng.uniform(1300, 1900)
        f_track = f0 * (1.0 + dsp.wander(n, 14, 0.28, rng))
        # abrupt register break partway through, a hallmark of real distress
        if rng.random() < 0.7:
            brk = int(n * rng.uniform(0.3, 0.7))
            f_track[brk:] = f_track[brk:] * rng.uniform(1.25, 1.6)
        amps = [1.0, 0.9, 0.8, 0.65, 0.5, 0.4, 0.3, 0.22]
        sig = dsp.voiced(f_track, amps, rng, jitter=0.07)
        sig = sig + rng.normal(0, 0.45, n)
        rough = 1.0 - 0.5 * (0.5 + 0.5 * np.sin(
            2 * np.pi * rng.uniform(40, 90) * np.arange(n) / dsp.SAMPLE_RATE))
        sig = sig * rough * dsp.envelope(n, 0.03, 0.25, curve=1.4)
        parts.append(sig)
        parts.append(np.zeros(dsp.samples(rng.uniform(0.08, 0.3))))

    return dsp.normalise(dsp.weight_to_hearing(np.concatenate(parts)))


def startle_bang(rng, library=None):
    """
    Broadband transient with a near-instant attack. Does not need to be species
    accurate: a sharp unexpected crack triggers a startle response on its own,
    and it is the component that habituates slowest.
    """
    n_bangs = rng.integers(1, 4)
    parts = []
    for _ in range(n_bangs):
        n = dsp.samples(rng.uniform(0.12, 0.3))
        sig = rng.normal(0, 1.0, n)
        sig = sig * np.exp(-np.linspace(0, rng.uniform(9, 18), n))
        ramp = dsp.samples(0.0015)
        sig[:ramp] = sig[:ramp] * np.linspace(0, 1, ramp)
        parts.append(sig)
        if rng.random() < 0.5:
            parts.append(np.zeros(dsp.samples(rng.uniform(0.06, 0.25))))
    # Band limit the assembled burst rather than each piece. Filtering first and
    # joining afterwards leaves a step at every join, and a step is broadband.
    return dsp.normalise(dsp.weight_to_hearing(np.concatenate(parts)))


VOICES = {
    "alarm": parakeet_alarm,
    "distress": distress_scream,
    "shikra": shikra_call,
    "bang": startle_bang,
    "chatter": mob_chatter,
}
