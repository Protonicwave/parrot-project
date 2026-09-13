"""Argument parsing and entry point for the track generator."""

import argparse
import json
import os
import pathlib
import random
from datetime import datetime

import numpy as np

import dsp
import encode
import sources
import tracks
from stimuli import Library


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description="Generate parakeet deterrent tracks.")
    parser.add_argument("--minutes", type=float, default=15.0,
                        help="length of each track in minutes")
    parser.add_argument("--count", type=int, default=6,
                        help="how many different tracks to build")
    parser.add_argument("--out", default="../app/assets/tracks",
                        help="output directory")
    parser.add_argument("--seed", type=int, default=None,
                        help="fix the seed to reproduce an exact set")
    parser.add_argument("--wav", action="store_true", help="also write WAV files")
    parser.add_argument("--quality", type=int, default=encode.VBR_QUALITY,
                        help="LAME VBR quality, 0 best to 9 smallest")
    return parser.parse_args(argv)


def main(argv=None):
    args = parse_args(argv)
    out = pathlib.Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    clips, ledger = sources.gather(sources.api_key())
    library = Library(clips)

    seed = args.seed if args.seed is not None else random.SystemRandom().randrange(2 ** 31)

    manifest = {
        "generated": datetime.now().isoformat(timespec="seconds"),
        "seed": seed,
        "sample_rate": dsp.SAMPLE_RATE,
        "minutes_per_track": args.minutes,
        "tracks": [],
        # The licence on every source recording requires attribution to travel
        # with the audio, so the credits ship beside the tracks rather than
        # living only in the generator.
        "recordings": ledger,
    }

    total_bytes = 0
    for index in range(args.count):
        rng = np.random.default_rng(seed + index * 7919)
        audio, log = tracks.build_track(args.minutes, rng, library)

        name = "track_%02d" % (index + 1)
        mp3_path = out / (name + ".mp3")
        written = encode.write_mp3(mp3_path, audio, args.quality)
        if args.wav:
            encode.write_wav(out / (name + ".wav"), audio)

        total_bytes += written
        manifest["tracks"].append({
            "file": name + ".mp3",
            "events": len(log),
            "size_mb": round(written / 1e6, 2),
            "log": log,
        })
        print("%s  %2d events  %5.2f MB" % (name + ".mp3", len(log), written / 1e6))

    (out / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    write_credits(out / "CREDITS.md", ledger)

    print("\nseed %d, %d tracks, %.2f MB total, written to %s"
          % (seed, args.count, total_bytes / 1e6, os.path.abspath(out)))
    return 0


def write_credits(path, ledger):
    """The attribution the Creative Commons licences require, in readable form."""
    lines = [
        "# Recording credits",
        "",
        "The bird calls in these tracks are field recordings from Xeno-canto,",
        "used under the Creative Commons licence shown against each one. They",
        "have been band limited and cut, which makes them derivative works, so",
        "the ShareAlike terms apply to the tracks as well.",
        "",
        "| Xeno-canto | Species | Recordist | Country | Licence |",
        "| --- | --- | --- | --- | --- |",
    ]
    for entry in ledger:
        lines.append("| [%s](%s) | *%s* | %s | %s | [%s](%s) |" % (
            entry["id"], entry["url"], entry["species"], entry["recordist"],
            entry["country"], entry["licence"].split("licenses/")[-1].rstrip("/"),
            entry["licence"]))
    lines.append("")
    lines.append("The broadband bangs and the distress scream are synthesised and")
    lines.append("carry no third party rights.")
    lines.append("")
    path.write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    raise SystemExit(main())
