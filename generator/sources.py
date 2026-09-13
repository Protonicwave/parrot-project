"""Xeno-canto search, download, local cache and the licence ledger."""

import io
import json
import os
import pathlib

import av
import numpy as np
import requests

import dsp

API = "https://xeno-canto.org/api/3/recordings"
CACHE = pathlib.Path(__file__).with_name("recordings")
LEDGER = pathlib.Path(__file__).with_name("recordings.json")
USER_AGENT = "sunflower-guard/1.0 (+https://github.com/Protonicwave/parrot-project)"

# The subcontinental population is the one doing the damage, so its recordings
# are preferred. Call dialect varies between feral European flocks and the
# native range, and borealis is the subspecies named in the plan.
HOME_RANGE = ("India", "Nepal", "Pakistan", "Bangladesh", "Sri Lanka")

# What each voice is built from. The two roles absent from the archive, distress
# and bang, are synthesised instead and so do not appear here.
ROLES = {
    "alarm": {
        "query": 'sp:"Psittacula krameri" type:"alarm call"',
        "type_must_include": "alarm call",
        "wanted": 6,
    },
    "chatter": {
        "query": 'sp:"Psittacula krameri" type:"flight call"',
        "type_must_include": "flight call",
        "wanted": 6,
    },
    "shikra": {
        "query": 'sp:"Accipiter badius" q:">C"',
        "type_must_include": "call",
        "wanted": 5,
    },
}

# A recording is kept only if its best passage is genuinely in the working band.
# Field recordings fail this in two directions: traffic and wind put the energy
# below the band, cicadas put it above. Both sound like a usable call in the
# archive listing and neither carries to a bird through a horn speaker.
MIN_BAND_FRACTION = 0.60
KEEP_SECONDS = 6.0          # generous region around the best passage
PROBE_SECONDS = 2.5         # window length used to judge a recording

# Where the energy of a kept passage must sit. The ceiling matters because a
# distant recording under cicadas keeps its shape but moves up the spectrum,
# away from the 3 kHz the birds hear best.
CENTROID_RANGE = (2200.0, 3900.0)

# Clip lengths the track builder may ask for. Every one of them is checked,
# because a region that is usable at one length and rumbling at another would
# put an unusable clip in a track depending only on a dice roll.
CLIP_LENGTHS = (1.4, 1.8, 2.2, 2.6, 3.0, 3.4, 3.6)


def api_key():
    """The key, from the environment or from .env. Never committed."""
    key = os.environ.get("XC_API_KEY", "").strip()
    if key:
        return key
    env = pathlib.Path(__file__).resolve().parent.parent / ".env"
    if env.exists():
        for line in env.read_text(encoding="utf-8-sig").splitlines():
            line = line.strip()
            if line.startswith("XC_API_KEY="):
                key = line.split("=", 1)[1].strip().strip('"').strip("'")
                if key:
                    return key
    raise SystemExit(
        "No Xeno-canto API key. Put XC_API_KEY in .env or in the environment.\n"
        "The key is on your account page at https://xeno-canto.org/account"
    )


def search(query, key, pages=2):
    """Every record for a query, up to a page limit."""
    found = []
    for page in range(1, pages + 1):
        response = requests.get(
            API,
            params={"query": query, "key": key, "page": page},
            headers={"User-Agent": USER_AGENT},
            timeout=60,
        )
        response.raise_for_status()
        body = response.json()
        found.extend(body.get("recordings", []))
        if page >= int(body.get("numPages", 1)):
            break
    return found


def usable(records, type_must_include):
    """
    The records we are allowed to use and want to use.

    The type filter is applied again here on purpose. Xeno-canto silently drops
    a type term it does not recognise and returns the unfiltered set, so a
    server side filter alone would quietly fill the tracks with ordinary calls.
    """
    keep = []
    for record in records:
        if "-nd" in record["lic"]:
            continue                                    # NoDerivatives, and a clip is a derivative
        if record["q"] not in ("A", "B"):
            continue
        if type_must_include not in record["type"].lower():
            continue
        if not _seconds(record["length"]):
            continue
        keep.append(record)
    return keep


def _seconds(length):
    """Xeno-canto gives m:ss, occasionally h:mm:ss."""
    try:
        parts = [int(p) for p in length.split(":")]
    except ValueError:
        return 0
    total = 0
    for part in parts:
        total = total * 60 + part
    return total


def rank(record):
    """Best first: home range, then grade, then a length that is worth cutting."""
    home = 0 if record["cnt"] in HOME_RANGE else 1
    grade = 0 if record["q"] == "A" else 1
    duration = _seconds(record["length"])
    awkward = 0 if 4 <= duration <= 120 else 1
    return (home, grade, awkward, int(record["id"]))


def download(record, key):
    """Raw bytes for a recording, cached on disk so a rebuild costs nothing."""
    CACHE.mkdir(exist_ok=True)
    path = CACHE / ("XC%s.mp3" % record["id"])
    if path.exists() and path.stat().st_size > 0:
        return path
    response = requests.get(
        record["file"],
        params={"key": key},
        headers={"User-Agent": USER_AGENT},
        timeout=120,
    )
    response.raise_for_status()
    path.write_bytes(response.content)
    return path


def decode(path):
    """
    Mono float samples at the working rate.

    Damaged packets are skipped rather than fatal. A handful of files in the
    archive carry a few corrupt frames, and dropping a whole usable recording
    over three bad packets in six hundred would be the wrong trade.
    """
    resampler = av.AudioResampler(format="fltp", layout="mono", rate=dsp.SAMPLE_RATE)
    chunks = []
    damaged = 0
    with av.open(str(path)) as container:
        for packet in container.demux(audio=0):
            try:
                frames = packet.decode()
            except av.error.InvalidDataError:
                damaged += 1
                continue
            for frame in frames:
                for resampled in resampler.resample(frame):
                    chunks.append(resampled.to_ndarray().reshape(-1))
    if damaged:
        print("  %s: skipped %d damaged packet(s)" % (path.name, damaged))
    if not chunks:
        return np.zeros(0)
    return np.concatenate(chunks).astype(np.float64)


def attribution(record):
    """What the licence obliges us to keep and show."""
    return {
        "id": "XC" + str(record["id"]),
        "species": ("%s %s" % (record["gen"], record["sp"])).strip(),
        "english": record["en"],
        "recordist": record["rec"],
        "country": record["cnt"],
        "type": record["type"],
        "quality": record["q"],
        "licence": record["lic"],
        "url": record["url"],
    }


def prepare(audio):
    """
    Weight a recording towards the working band and keep its best passage.

    Returns the kept audio, the in-band fraction of that passage measured on the
    untouched signal, and the widest spread of centroid across every clip length
    the builder might cut from it. Those figures decide whether it is kept.
    """
    weighted = dsp.weight_to_hearing(audio)
    probe = dsp.samples(PROBE_SECONDS)
    if len(weighted) <= probe:
        kept = dsp.normalise(weighted)
        return kept, dsp.band_energy_fraction(audio), _centroid_spread(kept)

    # Locate the best passage on the weighted signal, then judge it on the raw
    # one, so a recording cannot pass by virtue of the weighting alone.
    hop = max(1, dsp.samples(0.05))
    energy = np.cumsum(np.concatenate([[0.0], weighted ** 2]))
    starts = np.arange(0, len(weighted) - probe, hop)
    best = int(starts[int(np.argmax(energy[starts + probe] - energy[starts]))])
    fraction = dsp.band_energy_fraction(audio[best:best + probe])

    keep = dsp.samples(KEEP_SECONDS)
    start = max(0, best - (keep - probe) // 2)
    kept = dsp.normalise(weighted[start:start + keep])
    return kept, fraction, _centroid_spread(kept)


def _centroid_spread(kept):
    """Lowest and highest centroid across every clip length the builder may cut."""
    centroids = [
        dsp.spectral_centroid(dsp.fade_edges(dsp.loudest_window(kept, seconds)))
        for seconds in CLIP_LENGTHS
    ]
    return min(centroids), max(centroids)


def load_cached():
    """
    Rebuild the clip pools from the ledger and the download cache, no network.

    The tests use this. They assert on the audio that actually ships, and a test
    that needs an API key and a working connection to run is a test that stops
    being run.
    """
    if not LEDGER.exists():
        raise FileNotFoundError(
            "No %s. Run the generator once to fetch and pin the recordings." % LEDGER.name)

    clips = {}
    for entry in json.loads(LEDGER.read_text(encoding="utf-8")):
        path = CACHE / (entry["id"] + ".mp3")
        if not path.exists():
            raise FileNotFoundError(
                "%s is pinned in %s but not in the cache. Run the generator to refetch."
                % (entry["id"], LEDGER.name))
        prepared, _, _ = prepare(decode(path))
        clips.setdefault(entry["role"], []).append(prepared)
    return clips


def gather(key, roles=ROLES, log=print):
    """
    Fetch every role and return prepared clips plus the ledger.

    Candidates are taken in rank order until enough have passed the band check,
    so a role is filled with the best recordings that are actually usable rather
    than the best ones the search happened to return.
    """
    clips = {}
    ledger = []

    for role, spec in roles.items():
        records = search(spec["query"], key)
        candidates = usable(records, spec["type_must_include"])
        if not candidates:
            raise SystemExit(
                "No usable recording for role %r. The query returned %d records "
                "but none survived the licence, grade and type filters."
                % (role, len(records))
            )

        kept, rejected = [], 0
        for record in sorted(candidates, key=rank):
            if len(kept) >= spec["wanted"]:
                break
            audio = decode(download(record, key))
            if len(audio) < dsp.samples(1.0):
                rejected += 1
                continue
            prepared, fraction, centroids = prepare(audio)
            if fraction < MIN_BAND_FRACTION:
                log("  %-9s rejected, %.0f%% in band" % ("XC" + record["id"], fraction * 100))
                rejected += 1
                continue
            if not (CENTROID_RANGE[0] <= centroids[0]
                    and centroids[1] <= CENTROID_RANGE[1]):
                log("  %-9s rejected, centroid %.0f to %.0f Hz"
                    % ("XC" + record["id"], centroids[0], centroids[1]))
                rejected += 1
                continue
            kept.append(prepared)
            entry = attribution(record)
            entry["role"] = role
            entry["band_fraction"] = round(fraction, 3)
            entry["centroid_hz"] = [round(centroids[0]), round(centroids[1])]
            ledger.append(entry)

        if len(kept) < 2:
            raise SystemExit(
                "Only %d usable recording(s) for role %r after the band check."
                % (len(kept), role)
            )
        clips[role] = kept
        log("%-8s kept %d of %d candidates (%d rejected on band content)"
            % (role, len(kept), len(candidates), rejected))

    LEDGER.write_text(json.dumps(ledger, indent=2, ensure_ascii=False) + "\n",
                      encoding="utf-8")
    return clips, ledger
