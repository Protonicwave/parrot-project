# Sunflower Guard

A phone plays randomised bird scare audio, loud, through whatever speaker a farm
already owns. It protects sunflower heads from rose-ringed parakeets during the
three to five weeks the seed is worth eating.

No hardware, no account, no network at runtime. Press play, put the phone down.

    git clone https://github.com/Protonicwave/parrot-project.git

> **The Nepali interface strings are unverified.** They were authored without a
> native speaker. Nothing goes to a real farm until a Nepali speaker has checked
> every string listed in section 3.3 of `PLAN.md`.

> **Nobody has listened to the audio yet.** The synthesised calls pass spectral
> checks but have never been heard. Play `app/assets/tracks/track_01.mp3` and
> judge whether the alarm reads as a bird or as a synthesiser.

## Status

| Phase | Scope | State |
| --- | --- | --- |
| 0 | Specification, repository skeleton, README | Complete |
| 1 | The application, `app/` and `tests/core/` | Complete |
| 2 | Real recordings and the field guide, `generator/`, `docs/field-guide/` | Not started |

Phases 1 and 2 touch disjoint directories and have no dependency on each other.
They can run in either order, or at the same time.

`PLAN.md` is the contract. Read it before changing anything. It carries the
frozen decisions, the full specification, the engineering standards and the
acceptance criteria for each phase.

## Layout

| Path | Holds |
| --- | --- |
| `PLAN.md` | The specification and phase plan |
| `app/` | The application. Static files, no build step |
| `app/src/core/` | Pure logic. No DOM, no clock, no storage, no audio |
| `app/src/platform/` | Thin wrappers over browser capabilities |
| `app/src/ui/` | Rendering and locale lookup |
| `app/assets/tracks/` | The six audio tracks and their event manifest |
| `generator/` | Python tooling that produces the tracks |
| `docs/design/` | Reference mockup and the earlier design directions |
| `docs/field-guide/` | One page farmer note, Nepali and English |
| `tests/` | Unit tests for the pure core, spectral assertions for the generator |

`docs/design/mockup.html` is the visual reference Phase 1 builds against. Open it
in a browser.

## Running it

The app is static files with no build step, but it uses ES modules and a service
worker, so it needs a server rather than a double clicked file:

    python -m http.server 8765 --directory app

Then open <http://localhost:8765/>. The first press of play pulls the day's
track, about 7 MB, and caches it. After that the whole app works with the
network off.

## Running the tests

    node --test "tests/core/*.test.mjs"

Node 18 or newer. No dependencies to install.

## Regenerating the audio

The tracks are generated, not authored, so they are excluded from version
control. Recreate the exact shipped set with its recorded seed:

    python generator/make_tracks.py --minutes 15 --count 6 --seed 1337 --out app/assets/tracks

Requires `numpy` and `lameenc`. Omit `--seed` for a fresh set, which is the point
of the tool: a farm that has used the same six tracks for a season can be handed
six it has never heard.

Everything is band limited to 1 to 5 kHz, which is where parrot hearing peaks and
where a cheap PA horn actually radiates. No energy is wasted above 8 kHz, where
birds hear poorly or not at all.

## Contributing

One branch per phase, named for it, for example `phase-1-application`. Branch
from an up to date `main`, open a pull request, and never push to `main`
directly.

Commit subjects are imperative and under about 70 characters, and the body
explains why rather than restating the diff. Pull request descriptions are plain
prose. Check the work against the acceptance criteria in section 6 of `PLAN.md`
before opening one, and say plainly if something missed a target.

## Standards

Set out in full in section 5 of `PLAN.md`. In short: no runtime dependencies,
pure core and impure edges, UK English throughout including identifiers, brief
comments that explain why rather than what, and no em-dashes anywhere.
