"""Assertions on the tracks that actually ship, and on the manifest that describes them."""

import json
import pathlib

import numpy as np
import pytest

import dsp
import sources

TRACKS = pathlib.Path(__file__).resolve().parents[2] / "app" / "assets" / "tracks"

MIN_BAND_FRACTION = 0.70
MAX_ABOVE_8K = 0.01
CENTROID_RANGE = (2000.0, 4000.0)
MAX_PAYLOAD_MB = 15.0       # section 6 of PLAN.md
SILENCE = 1e-4              # below this a sample is silence for practical purposes

# MP3 carries an encoder delay of roughly 0.08 s, so decoded audio sits a little
# later than the manifest says. That is nine thousandths of one per cent of a
# fifteen minute track, far below one pixel of tick strip, so the tests absorb
# it rather than the audio being shifted to hide it.
DECODER_SLACK = 0.2


@pytest.fixture(scope="module")
def manifest():
    path = TRACKS / "manifest.json"
    if not path.exists():
        pytest.skip("No manifest. Run the generator first.")
    return json.loads(path.read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def decoded(manifest):
    """Every shipped track, decoded once."""
    audio = {}
    for entry in manifest["tracks"]:
        path = TRACKS / entry["file"]
        if not path.exists():
            pytest.skip("No %s. Run the generator first." % entry["file"])
        audio[entry["file"]] = sources.decode(path)
    return audio


def scare_tracks(manifest):
    """The six the product has always had. A rest track carries a single event,
    so the assertions about scatter and count do not apply to it."""
    return [entry for entry in manifest["tracks"] if entry.get("kind", "scare") == "scare"]


def _event_windows(entry, samples, slack=0.0):
    for event in entry["log"]:
        start = max(0, dsp.samples(event["at_seconds"] - slack))
        end = min(dsp.samples(event["at_seconds"] + event["duration"] + slack), samples)
        yield event, start, end


def test_every_event_time_in_the_manifest_has_audio(manifest, decoded):
    """
    The tick strip is drawn from these times, so a time with no sound behind it
    is a lie told to the farmer about what the app is doing.
    """
    for entry in manifest["tracks"]:
        track = decoded[entry["file"]]
        for event, start, end in _event_windows(entry, len(track)):
            loudest = float(np.abs(track[start:end]).max())
            assert loudest > 0.05, (
                "%s claims an event at %.2fs but peaks at %.4f there"
                % (entry["file"], event["at_seconds"], loudest))


def test_the_gaps_between_events_are_silent(manifest, decoded):
    """Silence is the active ingredient. Anything in the gaps would habituate the birds."""
    for entry in manifest["tracks"]:
        track = decoded[entry["file"]]
        sounding = np.zeros(len(track), dtype=bool)
        for _, start, end in _event_windows(entry, len(track), DECODER_SLACK):
            sounding[start:end] = True
        gaps = track[~sounding]
        assert float(np.abs(gaps).max()) < 0.02, (
            "%s has sound outside its declared events" % entry["file"])


def test_tracks_are_mostly_silence(manifest, decoded):
    """The plan budgets for a track that is overwhelmingly quiet. VBR depends on it."""
    for entry in manifest["tracks"]:
        track = decoded[entry["file"]]
        quiet = float((np.abs(track) < SILENCE).mean())
        assert quiet > 0.80, "%s is only %.0f%% silence" % (entry["file"], quiet * 100)


def test_events_sit_in_the_working_band(manifest, decoded):
    """Spectral assertions apply to the audio as encoded, not only as generated."""
    for entry in manifest["tracks"]:
        track = decoded[entry["file"]]
        for event, start, end in _event_windows(entry, len(track)):
            sound = track[start:end]
            where = "%s at %.2fs" % (entry["file"], event["at_seconds"])
            assert dsp.band_energy_fraction(sound) >= MIN_BAND_FRACTION, where
            assert dsp.band_energy_fraction(sound, 8000.0, dsp.SAMPLE_RATE / 2) <= MAX_ABOVE_8K, where
            centroid = dsp.spectral_centroid(sound)
            assert CENTROID_RANGE[0] <= centroid <= CENTROID_RANGE[1], (
                "%s centroid %.0f Hz" % (where, centroid))


def test_event_count_matches_the_plan(manifest):
    """Roughly seven scares per track. Far fewer stops working, far more habituates."""
    for entry in scare_tracks(manifest):
        assert 5 <= entry["events"] <= 9, (
            "%s has %d events" % (entry["file"], entry["events"]))
        assert entry["events"] == len(entry["log"])


def test_gaps_are_irregular(manifest):
    """
    A predictable schedule is the failure mode the whole design exists to avoid.

    What matters is spread, not that no two gaps ever coincide. Two gaps landing
    within a second of each other across a quarter of an hour is chance, and a
    bird cannot use it.
    """
    for entry in scare_tracks(manifest):
        starts = [event["at_seconds"] for event in entry["log"]]
        gaps = np.diff(starts)
        assert gaps.min() > 60.0, "%s has a gap of only %.0fs" % (entry["file"], gaps.min())
        assert gaps.max() - gaps.min() > 20.0, (
            "%s gaps span only %.0fs, close to a fixed interval"
            % (entry["file"], gaps.max() - gaps.min()))


def test_payload_fits_the_budget(manifest):
    """Section 6 caps the whole set at 15 MB over a rural connection."""
    total = sum(entry["size_mb"] for entry in manifest["tracks"])
    assert total <= MAX_PAYLOAD_MB, "payload is %.2f MB" % total


def test_every_recording_is_credited(manifest):
    """The Creative Commons licences require attribution to travel with the audio."""
    assert manifest["recordings"], "no attribution shipped with the tracks"
    for entry in manifest["recordings"]:
        for field in ("id", "recordist", "licence", "url", "species"):
            assert entry.get(field), "%s missing %s" % (entry.get("id"), field)
        assert "-nd" not in entry["licence"], (
            "%s is NoDerivatives and cannot be cut or filtered" % entry["id"])


def test_declared_duration_matches_the_manifest(manifest, decoded):
    """
    Phase 2 shipped tracks whose container claimed seventeen and a half minutes
    for fifteen minutes of audio, and every test passed, because the application
    reads length from the manifest and never asked the file. One assertion that
    decodes each track closes that whole class.
    """
    wanted = manifest["minutes_per_track"] * 60
    for entry in manifest["tracks"]:
        seconds = len(decoded[entry["file"]]) / dsp.SAMPLE_RATE
        assert abs(seconds - wanted) < 1.0, (
            "%s decodes to %.1fs against a declared %.1fs"
            % (entry["file"], seconds, wanted))


def test_every_track_says_what_kind_it_is(manifest):
    """Section 4.1 of PLAN.md. One word per track, and the whole of what Phase 3 added."""
    for entry in manifest["tracks"]:
        assert entry["kind"] in ("scare", "rest"), (
            "%s has kind %r" % (entry["file"], entry.get("kind")))


def test_rest_tracks_carry_exactly_one_event(manifest):
    """A rest track is the same fifteen minutes with a single event in it."""
    rests = [entry for entry in manifest["tracks"] if entry["kind"] == "rest"]
    assert len(rests) >= 2, "one rest track makes a thinned out stretch predictable"
    for entry in rests:
        assert entry["events"] == 1, "%s has %d events" % (entry["file"], entry["events"])
        assert len(entry["log"]) == 1


def test_events_are_not_all_at_the_same_level(manifest, decoded):
    """
    Every event used to arrive at the same loudness, so every alarm sounded like
    it was at the same distance. Real flocks are not.
    """
    peaks = []
    for entry in scare_tracks(manifest):
        track = decoded[entry["file"]]
        for _, start, end in _event_windows(entry, len(track)):
            peaks.append(float(np.abs(track[start:end]).max()))
    assert min(peaks) < 0.75 * max(peaks), (
        "event peaks span only %.2f to %.2f" % (min(peaks), max(peaks)))


def test_some_alarms_come_to_nothing(manifest):
    """Roughly one event in five is a single call that does not escalate, as real ones do."""
    counts = [len(event["stimuli"]) for entry in manifest["tracks"] for event in entry["log"]]
    lone = sum(1 for count in counts if count == 1)
    assert lone > 0, "every event escalates, so the escalation carries no information"
    assert lone < len(counts) / 2, "%d of %d events are a single call" % (lone, len(counts))
