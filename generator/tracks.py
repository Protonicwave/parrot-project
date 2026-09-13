"""Event assembly and the layout of a long, mostly silent track."""

import numpy as np

import dsp
from stimuli import VOICES, startle_bang

# Gaps between events. Irregular by design: a bird that can predict the next
# burst has already stopped being frightened by it.
GAP_MIN = 80.0
GAP_MAX = 200.0


def build_event(rng, library):
    """
    One scare event: two or three stimuli in sequence, escalating.

    The ordering is deliberate. An alarm or a hawk call arrives first, because a
    bird that flushes on the warning never learns how empty the bang is. The bang
    is held back as the closer and is not used every time.
    """
    opener = str(rng.choice(["alarm", "shikra", "alarm", "chatter"]))
    parts = [VOICES[opener](rng, library),
             np.zeros(dsp.samples(rng.uniform(0.25, 0.9)))]

    options = [k for k in ("distress", "shikra", "alarm", "chatter") if k != opener]
    middle = str(rng.choice(options))
    parts.append(VOICES[middle](rng, library) * rng.uniform(0.85, 1.0))

    used = [opener, middle]

    if rng.random() < 0.55:
        parts.append(np.zeros(dsp.samples(rng.uniform(0.15, 0.6))))
        parts.append(startle_bang(rng))
        used.append("bang")

    return dsp.normalise(np.concatenate(parts), rng.uniform(0.85, 1.0)), used


def build_track(minutes, rng, library, gap_min=GAP_MIN, gap_max=GAP_MAX):
    """
    A long, mostly silent track. The silence is the active ingredient: it is what
    keeps the loud parts loud, and it is why a bird cannot predict the next one.
    """
    total = dsp.samples(minutes * 60)
    track = np.zeros(total)
    log = []

    cursor = dsp.samples(rng.uniform(8, 30))
    while cursor < total:
        event, used = build_event(rng, library)
        if cursor + len(event) >= total:
            break
        track[cursor:cursor + len(event)] += event
        log.append({
            "at_seconds": round(cursor / dsp.SAMPLE_RATE, 2),
            "duration": round(len(event) / dsp.SAMPLE_RATE, 2),
            "stimuli": used,
        })
        cursor += len(event) + dsp.samples(rng.uniform(gap_min, gap_max))

    return dsp.normalise(track, dsp.PEAK), log
