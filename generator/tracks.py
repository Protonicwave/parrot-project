"""Event assembly and the layout of a long, mostly silent track."""

import numpy as np

import dsp
from stimuli import VOICES, startle_bang

# Gaps between events. Irregular by design: a bird that can predict the next
# burst has already stopped being frightened by it.
GAP_MIN = 80.0
GAP_MAX = 200.0

# Peak of one event as a fraction of full scale. Every event used to arrive at
# the same loudness, so every alarm sounded like it was at the same distance,
# and real flocks are not.
LEVEL_RANGE = (0.55, 1.0)

# Roughly one event in five is a single call that comes to nothing, because
# real alarms often do. It is what keeps the escalation informative.
LONE_CALL_CHANCE = 0.2


def build_event(rng, library):
    """
    One scare event: usually two or three stimuli in sequence, escalating.

    The ordering is deliberate. An alarm or a hawk call arrives first, because a
    bird that flushes on the warning never learns how empty the bang is. The bang
    is held back as the closer and is not used every time.
    """
    level = rng.uniform(*LEVEL_RANGE)
    opener = str(rng.choice(["alarm", "shikra", "alarm", "chatter"]))
    first = VOICES[opener](rng, library)

    if rng.random() < LONE_CALL_CHANCE:
        return dsp.normalise(first, level), [opener]

    parts = [first, np.zeros(dsp.samples(rng.uniform(0.25, 0.9)))]

    options = [k for k in ("distress", "shikra", "alarm", "chatter") if k != opener]
    middle = str(rng.choice(options))
    parts.append(VOICES[middle](rng, library) * rng.uniform(0.85, 1.0))

    used = [opener, middle]

    if rng.random() < 0.55:
        parts.append(np.zeros(dsp.samples(rng.uniform(0.15, 0.6))))
        parts.append(startle_bang(rng))
        used.append("bang")

    return dsp.normalise(np.concatenate(parts), level), used


def _place(track, cursor, event, log, used):
    track[cursor:cursor + len(event)] += event
    log.append({
        "at_seconds": round(cursor / dsp.SAMPLE_RATE, 2),
        "duration": round(len(event) / dsp.SAMPLE_RATE, 2),
        "stimuli": used,
    })


def build_track(minutes, rng, library, gap_min=GAP_MIN, gap_max=GAP_MAX):
    """
    A long, mostly silent track. The silence is the active ingredient: it is what
    keeps the loud parts loud, and it is why a bird cannot predict the next one.
    """
    total = dsp.samples(minutes * 60)
    track = np.zeros(total)
    log = []
    recent = ()

    cursor = dsp.samples(rng.uniform(8, 30))
    while cursor < total:
        library.start_event(recent)
        event, used = build_event(rng, library)
        recent = tuple(library.used)
        if cursor + len(event) >= total:
            break
        _place(track, cursor, event, log, used)
        cursor += len(event) + dsp.samples(rng.uniform(gap_min, gap_max))

    return dsp.normalise(track, dsp.PEAK), log


def build_rest_track(minutes, rng, library):
    """
    The same fifteen minutes carrying a single event.

    All day mode thins the middle of the day out with these rather than with
    pauses, because a phone suspends an app that is not actually playing. The
    silence has to be in the file for the next event ever to fire.
    """
    total = dsp.samples(minutes * 60)
    track = np.zeros(total)
    log = []

    library.start_event()
    event, used = build_event(rng, library)
    # Anywhere but the very ends, so a farmer who starts one mid track still
    # hears it and the join to the next carries no sound across it.
    margin = dsp.samples(30.0)
    cursor = int(rng.integers(margin, total - len(event) - margin))
    _place(track, cursor, event, log, used)

    # Scaled rather than normalised: normalising one event would pull it back up
    # to full scale and throw away the level it was given.
    return track * dsp.PEAK, log
