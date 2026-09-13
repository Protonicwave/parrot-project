# Track generator

Builds the six fifteen minute tracks the app plays. Each is almost entirely
silence with roughly seven scare events scattered at irregular intervals.

## Running it

    pip install numpy requests av
    python cli.py --seed 1337

Writes the tracks, `manifest.json` and `CREDITS.md` into `app/assets/tracks/`.
A Xeno-canto API key is required, in `.env` at the repository root or in the
environment as `XC_API_KEY`. The key is on your account page at
<https://xeno-canto.org/account>.

Downloads are cached in `recordings/`, so only the first run needs the network.

## Modules

| File | Owns |
| --- | --- |
| `dsp.py` | Band limiting, envelopes, frequency tracks, spectral measurement |
| `sources.py` | Xeno-canto search, download, cache and the licence ledger |
| `stimuli.py` | The five stimulus voices |
| `tracks.py` | Event assembly and track layout |
| `encode.py` | WAV and variable bitrate MP3 output |
| `cli.py` | Argument parsing and entry point |

`recordings.json` pins every recording the tracks are built from. It is
versioned; the downloaded audio is not, because the identifiers are enough to
fetch it again.

## Where the audio comes from

Three of the five voices are real field recordings from Xeno-canto: the
parakeet alarm, the flock chatter and the shikra. Two are synthesised.

The distress scream is synthesised because Xeno-canto holds no distress
recording for any parrot. The count is zero across the whole of Psittaciformes,
which is what an archive of field recordings would be expected to hold: a
distress call means a bird in the hand. The broadband bang is synthesised
because it does not need to be species accurate.

Recordings under a NoDerivatives licence are excluded. Band limiting a
recording and cutting a clip from it are plainly derivative acts.

## Two traps in the Xeno-canto API

Both cost time, so they are recorded here.

**An unrecognised `type:` term is silently ignored.** `type:"agitated call"`
does not return nothing, it returns every recording of the species. A search
alone would therefore fill the tracks with ordinary calls and look like it had
worked, so `sources.usable` applies the type filter a second time locally.

**Some files are served as WAV under an `.mp3` name, and a few carry corrupt
frames.** The decoder sniffs the real format and skips damaged packets rather
than discarding a recording over three bad packets in six hundred.

## Choosing recordings

A recording is kept only if the best passage in it is genuinely in the working
band: at least 60 per cent of its energy between 1 and 5 kHz, with the centre
of mass between 2.2 and 3.9 kHz at every clip length the builder might cut.

Field recordings fail this in both directions. Traffic and wind put the energy
below the band, cicadas put it above. Either can sound like a usable call in
the archive listing while carrying nothing a bird would hear through a horn
speaker. Roughly a quarter of otherwise eligible candidates are rejected this
way, which is why the search asks for more than it needs.

Recordings from the native range are preferred, since that is the population
doing the damage. This succeeds for the flock calls and the shikra, which come
from India and Bangladesh, and fails for the alarm calls: Xeno-canto holds no
subcontinental alarm call of this species that passes the band check, so those
six come from feral European flocks instead.
