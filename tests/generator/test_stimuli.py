"""Spectral assertions on the five stimulus voices."""

import numpy as np
import pytest

import dsp
from stimuli import VOICES

DRAWS = 20                  # enough to catch a voice that is only usually right

MIN_BAND_FRACTION = 0.70    # section 5.6 of PLAN.md
MAX_ABOVE_8K = 0.01
CENTROID_RANGE = (2000.0, 4000.0)


@pytest.fixture(scope="module")
def rng():
    return np.random.default_rng(20260913)


@pytest.mark.parametrize("voice", sorted(VOICES))
def test_energy_sits_in_the_working_band(voice, library, rng):
    """At least 70 per cent of energy between 1 and 5 kHz, where the birds hear."""
    for _ in range(DRAWS):
        sound = VOICES[voice](rng, library)
        fraction = dsp.band_energy_fraction(sound)
        assert fraction >= MIN_BAND_FRACTION, (
            "%s put only %.1f%% of its energy in the band" % (voice, fraction * 100))


@pytest.mark.parametrize("voice", sorted(VOICES))
def test_nothing_audible_above_8_kilohertz(voice, library, rng):
    """Above 8 kHz a parakeet hears nothing, so energy there is wasted amplifier power."""
    for _ in range(DRAWS):
        sound = VOICES[voice](rng, library)
        fraction = dsp.band_energy_fraction(sound, 8000.0, dsp.SAMPLE_RATE / 2)
        assert fraction <= MAX_ABOVE_8K, (
            "%s put %.2f%% of its energy above 8 kHz" % (voice, fraction * 100))


@pytest.mark.parametrize("voice", sorted(VOICES))
def test_centroid_sits_near_best_hearing(voice, library, rng):
    """Peak sensitivity is near 3 kHz, so the centre of mass belongs between 2 and 4."""
    for _ in range(DRAWS):
        sound = VOICES[voice](rng, library)
        centroid = dsp.spectral_centroid(sound)
        assert CENTROID_RANGE[0] <= centroid <= CENTROID_RANGE[1], (
            "%s centroid at %.0f Hz" % (voice, centroid))


@pytest.mark.parametrize("voice", sorted(VOICES))
def test_peak_amplitude_is_in_range(voice, library, rng):
    """Normalised and not clipped, so the encoder has headroom."""
    for _ in range(DRAWS):
        sound = VOICES[voice](rng, library)
        peak = float(np.abs(sound).max())
        assert 0.5 <= peak <= 1.0, "%s peaked at %.3f" % (voice, peak)


def test_every_planned_voice_exists():
    """The plan names five stimuli. A missing one would silently shrink the variety."""
    assert sorted(VOICES) == ["alarm", "bang", "chatter", "distress", "shikra"]
