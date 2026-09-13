# Sunflower Guard

A phone plays randomised bird scare audio, loud, through whatever speaker a farm
already owns. It protects sunflower heads from rose-ringed parakeets during the
three to five weeks the seed is worth eating.

**This document is the contract.** Every decision below is settled. Phases read
this file instead of reconstructing the reasoning, and nothing here is reopened
without a deliberate amendment. If a phase finds a genuine flaw, it amends this
document first and then builds.

Repository: <https://github.com/Protonicwave/parrot-project>

Status: specification frozen. No application code written yet.

---

## 1. Why the design is what it is

Six findings shaped every decision. They are recorded so nobody relitigates them.

| Finding | Consequence |
| --- | --- |
| Birds cannot hear ultrasound. Budgerigar audiogram runs roughly 77 Hz to 7.6 kHz, best sensitivity near 3 kHz. USDA NWRC puts most birds at 1 to 5 kHz with poor response above 10 kHz. | All audio is band limited to 1 to 5 kHz. Every ultrasonic repeller on the market is silence to a parrot. |
| Habituation is the failure mode. Birds ignore a call they hear on a predictable schedule. | Randomised gaps within a track, and six tracks taking turns across the season. This is the mechanism, not a feature. |
| Rose-ringed parakeets take 20 to 50 per cent of a sunflower crop, up to 90 per cent in bad areas. Even with recommended practice, farmers lose 10 to 40 per cent. | The problem is worth solving. Realistic target is a large reduction, not elimination. |
| Damage concentrates at field margins and falls close to zero beyond about 50 m from the edge. | Speaker placement advice matters more than speaker count. Perimeter, on the roost facing side. |
| Acoustic deterrents alone achieve roughly 44 to 54 per cent damage reduction in field trials. | Ship the agronomy advice alongside. Sound is one component. |
| Cheap PA reflex horns pass roughly 400 Hz to 5 kHz at 105 to 110 dB per watt at one metre. | The hardware the farm already owns is the correct hardware. We supply nothing physical. |

The audible band is also where human hearing peaks. The deployment is rural with
no close neighbours, which is the only reason full volume is viable.

---

## 2. Frozen decisions

Do not reopen these. Each cost real discussion.

1. **No hardware.** We ship audio files and a web page. The farm supplies the
   speaker.
2. **No scheduling.** The farmer presses play whenever they want. Dawn and dusk
   guidance appears as one advisory line, never as a gate.
3. **One screen, one action.** Tap anywhere to play, tap again to stop.
4. **Rotation is automatic by default.** Six tracks take turns. The track chip is
   tappable and cycles through the six, then returns to automatic. It must always
   be possible to get back to automatic.
5. **Offline always.** No account, no network at runtime, no analytics, no
   telemetry, no permissions beyond audio playback.
6. **Nepali is the default language.** English is the deliberate switch. Both are
   first class and every string exists in both from the outset.
7. **Light and dark grounds follow the clock** for screen readability only. They
   carry no scheduling meaning.
8. **Synthesised audio ships first.** Real recordings are an upgrade in Phase 2,
   not a blocker for Phase 1.

---

## 3. Product specification

### 3.1 Behaviour

- The app holds six audio tracks, each fifteen minutes long. A track is almost
  entirely silence with roughly seven scare events at irregular intervals.
- An event escalates: a parakeet alarm or hawk call first, a distress scream or
  mobbing chorus second, and sometimes a broadband bang as the closer. The bang
  is deliberately held back and not used every time.
- Pressing play starts today's track from the beginning. Pressing again stops it.
- Playback continues when the screen locks. This is non negotiable. A farmer sets
  it going and puts the phone in a pocket.
- The day counter counts days since first run. It is cosmetic. Rotation derives
  from the same counter, so the counter being off by a few days changes nothing
  that matters.
- Track selection is automatic unless the farmer has cycled the chip. A manual
  choice persists until cycled back to automatic.
- Volume is the single most common field failure. The reminder line is permanent,
  not a dismissible dialog.

### 3.2 States

Five states, all on one screen. There are no other screens.

| State | Shown | Notes |
| --- | --- | --- |
| Ready, automatic | Play mark, action word, duration, advisory line, tick strip, day counter, outlined track chip, volume line | Default on open |
| Ready, manual track | As above, filled track chip, advisory line swaps to the return to automatic hint | Only differs by the chip and one line |
| Playing | Status dot, countdown, stop mark, live tick strip with playhead, events sounded count, day and track as plain text | Track is not tappable while playing |
| Finished | Tick, completion word, invitation to press again, spent tick strip, day counter, track chip | Never mentions a next scheduled time |
| Ready after dark | Identical layout on the dark ground | Purely a palette swap |

The tick strip is the product explained in one graphic. Fifteen minutes, seven
scares, irregular gaps, silence everywhere else. Each track has its own scatter,
so the strip must be generated from the track's real event times, never faked.

### 3.3 Strings

Every string exists in both languages. Nepali is authored first because
Devanagari runs longer and a layout designed around English will break.

| Key | Nepali | English |
| --- | --- | --- |
| app name | सूर्यमुखी रक्षक | Sunflower Guard |
| play | बजाउनुहोस् | Play |
| stop | रोक्नुहोस् | Stop |
| playing | बज्दै छ | Playing |
| finished | सकियो | Finished |
| duration | १५ मिनेट | 15 minutes |
| remaining | बाँकी | left |
| day | दिन | Day |
| track | धुन | Track |
| advisory | बिहान र साँझमा सबैभन्दा प्रभावकारी | Works best at dawn and dusk |
| back to auto | थिच्दै जानुहोस्, स्वचालितमा फर्कन्छ | Keep tapping to return to automatic |
| volume | स्पिकरको आवाज पूरा बढाउनुहोस् | Keep the speaker at full volume |
| events sounded | ७ मध्ये ३ वटा आवाज बजिसके | 3 of 7 sounded |
| press again | फेरि बजाउन थिच्नुहोस् | Press again any time you want another run |

Nepali numerals ० १ २ ३ ४ ५ ६ ७ ८ ९ are used throughout the Nepali interface,
including the countdown and all counters.

**Every Nepali string above is unverified.** It was authored without a native
speaker. Phase 2 must have a Nepali speaker check the lot. Flag this in the
README so it cannot be forgotten.

### 3.4 Interface rules that must not be broken

These are correctness requirements, not preferences. Two of them were caught as
live bugs during design review.

1. Devanagari text must never be set in a font lacking Devanagari coverage. Latin
   faces silently fall back and render as the wrong typeface or as empty boxes.
   Pair Noto Sans Devanagari with the Latin face and give every rule a fallback.
2. Devanagari body copy is never smaller than 16px, and line height is 1.7
   throughout so matras above and below the baseline do not collide.
3. Letter spacing is never applied to Devanagari. It breaks conjunct and matra
   positioning. Latin only.
4. Every interactive target is at least 44px in its smallest dimension. Cold
   hands, dusty screens, low light.
5. No fake status bar and no fake keyboard. The real ones render on top.
6. The page must not scroll. Everything fits one viewport at 390 by 844 and
   scales down cleanly to narrower phones.
7. Copy must never contradict the data on screen. A season view that claims
   tracks never repeat while displaying a six track cycle is a defect.

---

## 4. Repository architecture

```
<repository root>/
├── README.md                 What this is, how to run it, the unverified Nepali warning
├── PLAN.md                   This document
├── .gitignore                Generated audio is reproducible, so it is not versioned
├── .editorconfig             UTF-8, LF, 2 spaces, 4 for Python
├── app/
│   ├── index.html            Shell. No inline logic
│   ├── package.json          Marks app/src as ES modules for the test runner
│   ├── manifest.webmanifest
│   ├── service-worker.js     Precache shell, cache tracks on demand
│   ├── assets/
│   │   ├── styles/app.css
│   │   ├── locales/{ne,en}.json
│   │   └── tracks/           Six audio files plus manifest.json
│   └── src/
│       ├── main.js           Composition root. The only module that wires things
│       ├── core/             Pure. No DOM, no clock, no storage, no audio
│       │   ├── rotation.js   Day index to track index
│       │   ├── session.js    State machine and its transitions
│       │   └── numerals.js   Latin to Devanagari digit mapping
│       ├── platform/         Impure. Each wraps exactly one browser capability
│       │   ├── player.js     Audio element lifecycle and wake behaviour
│       │   ├── clock.js      Current time and day index
│       │   └── store.js      Persistence
│       └── ui/
│           ├── render.js     State to DOM
│           └── strings.js    Locale lookup and numeral substitution
├── generator/
│   ├── dsp.py               Band limiting, envelopes, frequency tracks
│   ├── stimuli.py           The five stimulus voices
│   ├── tracks.py            Event assembly and track layout
│   ├── encode.py            WAV and MP3 output
│   ├── cli.py               Argument parsing and entry point
│   └── README.md
├── docs/
│   ├── design/              Reference mockup and the earlier design directions
│   └── field-guide/         One page farmer note, Nepali and English
└── tests/
    ├── core/                Unit tests for the pure modules
    └── generator/           Spectral assertions on generated audio
```

**The one architectural rule: pure core, impure edges.** Rotation, the state
machine and numeral conversion are pure functions taking their inputs as
arguments. The clock, storage, audio and DOM live behind thin wrappers in
`platform/` and `ui/`. `main.js` is the only place they meet. This is what makes
the logic testable without a browser, and it is the whole of the architecture.

Scalable here means clean seams, not layers. This is a one screen application.
Adding a framework, a state container, a build step or a dependency injection
container to it would be worse engineering, not better. If a future phase needs a
second crop or a second target species, the seam it extends is `assets/tracks/`
and `locales/`, not the module graph.

---

## 5. Engineering standards

### 5.1 Principles

- **No runtime dependencies.** Vanilla ES modules, served as written. No bundler,
  no transpiler, no framework. The app must run from a static directory.
- **One module, one responsibility**, stated in its first line.
- **Functions do one thing** and are named for what they return or change.
- **No premature abstraction.** Two similar things stay separate. Three earn a
  shared helper.
- **Fail visibly in development, degrade quietly in the field.** A missing track
  must not produce a blank screen.
- **No dead code, no commented out code, no speculative options.**

### 5.2 Performance budget

Targets, not aspirations. A phase that misses one says so at handover.

| Budget | Target |
| --- | --- |
| Application JavaScript, gzipped | Under 10 KB |
| CSS, gzipped | Under 4 KB |
| First contentful paint, low end Android | Under 1 second |
| Time from tap to first audio sample | Under 200 ms |
| DOM nodes on screen | Under 120 |
| Re-renders per second while playing | One, driven by the countdown only |
| Runtime allocations while playing | None in the render path |

Notes that follow from these. Render by mutating the specific text nodes that
change, never by rebuilding the screen. The tick strip is static once drawn, so
only the playhead moves.

Amended in Phase 1: fonts are the ones already on the phone rather than a self
hosted subset. Shipping no font file at all beats shipping a small one, and it
is the same answer to the same problem, which was that a rural first load cannot
wait on a font CDN. The rule in 3.4.1 is unchanged and is what makes this safe:
every font stack in the stylesheet ends in a Devanagari capable family, so
Devanagari can never fall into a Latin only face.

### 5.3 Audio payload

Six fifteen minute tracks at constant 64 kbps come to 43 MB, which is too much to
pull over a rural connection.

**Switch the encoder to variable bitrate.** Roughly 85 per cent of each track is
digital silence, which VBR encodes at almost no cost while constant bitrate pays
full price for it. Expect a four to eightfold reduction, bringing the set to
somewhere between 5 and 12 MB. Measure the real figure and record it.

The audio is band limited to 5 kHz, so quality is unaffected by dropping the
ceiling. Do not go below 22.05 kHz sampling.

The service worker caches the shell at install and fetches tracks on first run.
Never download silently.

Amended in Phase 1: the track is cached when the farmer presses play on it, and
there is no separate prompt. A prompt needs somewhere to live, and the only
screen there is has five states that section 3.2 fixes. Pressing play is already
an explicit request for that one track, and nothing else is ever fetched: the
other five stay on the server until a day or a chip tap calls for them. What the
original wording bought and this does not is the size shown up front, so a farmer
on a metered connection learns the cost by watching it arrive.

### 5.4 Comments and naming

This standard is mandatory and applies to every file, JavaScript, Python, CSS
and HTML alike.

- **UK English spelling.** Colour, behaviour, normalise, initialise, centre,
  analyse, licence as a noun. Applies to identifiers as well as prose.
- **Brief.** One line wherever one line will do. A comment longer than the code
  it describes is usually a sign the code needs renaming instead.
- **No em-dashes.** Use commas, colons, brackets or a full stop.
- **Explain why, not what.** The code already says what. A comment earns its
  place by recording a constraint, a trade off, or a piece of domain knowledge
  that is not visible locally. The 1 to 5 kHz band limit is worth a comment
  because it comes from an audiogram. A loop counter is not.
- **One line at the top of each module** stating what it owns.
- **No decorative banners, no ASCII art, no section dividers.**
- **No commented out code.** Version control remembers it.
- **No TODO without a name and a date.** Otherwise delete it.
- **Document the surprising, not the obvious.** If a value looks arbitrary, say
  where it came from.
- **Names are full words.** No abbreviations beyond established domain terms.
  `trackIndex`, not `ti`. `bandLimit`, not `bl`.

### 5.5 Commits and pull requests

Written output follows the same rules as comments in 5.4. UK English, brief, no
em-dashes, and it explains why rather than what.

- **Subject line in the imperative**, under about 70 characters, saying what the
  commit does. A short type prefix such as `docs:` or `fix:` is fine.
- **Body explains the reasoning**, not the diff. The diff is already there.
- **Commits are coherent units.** Three commits that each do one thing beat one
  that does three.
- **No tool attribution of any kind.** No generated by lines, no co-author
  trailers, no session links, in commits or pull requests. The history reads as
  the work of the people on the project.
- **Pull request descriptions are prose**, written the way you would explain the
  change to a colleague. Say what it does, why, and anything a reviewer needs to
  know before reading the diff. A checklist is fine where there is genuinely a
  list, but a wall of ticked boxes is not a description.
- **Report a missed target in a sentence** rather than hiding it or dressing it
  up.

### 5.6 Testing

Cheap and targeted. Testing was never the expensive part, so do not cut it, but
do not gold plate it either.

- **Pure core modules get unit tests.** Rotation across a full season including
  the wrap, every state transition including the invalid ones, numeral conversion
  both directions.
- **The generator gets spectral assertions**, which are the cheapest useful check
  available. For each stimulus: at least 70 per cent of energy between 1 and
  5 kHz, effectively none above 8 kHz, spectral centroid between 2 and 4 kHz, and
  peak amplitude within range. These caught nothing during design only because
  the design was already right, and they cost almost nothing to run.
- **No DOM testing framework.** The rendering layer is small enough to check by
  opening it.
- **One manual pass per phase**, against the interface rules in section 3.4.

---

## 6. Phase plan

Three phases. Phase 0 completes in the session that produced this document,
because that session already holds all the research and rebuilding that context
elsewhere is pure waste. Phases 1 and 2 each begin in a fresh session.

Phases 1 and 2 touch **completely disjoint directories** and have no dependency
on each other. They can run in either order, or in parallel.

### Phase 0: specification

- **Entry:** the design is settled.
- **Scope:** this document, plus the repository skeleton and README.
- **Exit:** `PLAN.md` exists and answers every question a builder would ask.
- **Status:** complete on delivery of this file.

### Phase 1: the application

- **Entry:** `PLAN.md` read. Nothing else needs reading.
- **Scope:** the whole of `app/` and `tests/core/`. One screen, five states, two
  languages, offline, installable, the track chip cycle, the tick strip driven by
  real event times from the track manifest.
- **Out of scope:** audio regeneration, real recordings, the field guide, any
  second screen, settings, onboarding, analytics.
- **Acceptance:**
  1. Loads and runs with the network disabled after first visit.
  2. Plays, stops, and survives a screen lock without stopping.
  3. Language switches instantly and every string changes, numerals included.
  4. Track chip cycles through all six and returns to automatic.
  5. Manual choice and language survive a restart.
  6. Every rule in section 3.4 holds, checked deliberately.
  7. Every budget in section 5.2 met or the miss reported.
  8. Core unit tests pass.
- **Size:** a few hundred lines. Do not split it. Splitting a build across
  sessions means re-reading your own code, which is the most wasteful token there
  is.

### Phase 2: real audio and the field pack

- **Entry:** `PLAN.md` read, plus a Xeno-canto API key obtained by the user.
- **Scope:** `generator/`, `app/assets/tracks/`, `docs/field-guide/`.
  - Refactor the existing single file generator into the module layout in
    section 4 and add the spectral tests.
  - Switch to variable bitrate and record the real size reduction.
  - Pull genuine rose-ringed parakeet alarm and distress calls, and genuine
    shikra calls, from Xeno-canto. Keep licence and attribution for each.
  - Rebuild the six tracks with real recordings as the payload, keeping the
    synthesised broadband bangs, which do not need to be species accurate.
  - Write the one page field guide in Nepali and English: do not plant beside the
    roost trees, choose hybrids with downward facing heads and long bracts, sow
    in step with neighbours to dilute the flock, site the speaker on the roost
    facing margin.
  - Have a Nepali speaker verify every string in section 3.3.
- **Out of scope:** anything inside `app/src/`.
- **Acceptance:**
  1. Spectral assertions pass for every stimulus and every track.
  2. Total payload under 15 MB, with the real figure recorded.
  3. Every recording carries its Xeno-canto identifier, recordist and licence.
  4. Track manifest still lists exact event times, so the tick strip stays honest.
  5. Field guide fits one page in both languages.

### Why three

Three is the number of genuine forks left. Fewer, and a build gets mixed with an
unrelated data task. More, and each extra boundary charges a context reload tax
for nothing. Phase 1 and Phase 2 share no files, which is the cleanest split
available.

---

## 7. How to run each session

These rules exist because of what the design work actually cost. The expense was
never verification. It was building at full fidelity while decisions were still
open, then rebuilding when they closed.

1. **This document is the handover, not the chat history.** Start with one read
   of `PLAN.md`. Do not go digging through old conversations.
2. **Fidelity follows commitment.** Sketch in prose while a choice is open. Build
   at full polish only once it is closed.
3. **Ask everything that blocks the phase at the start**, in one batch, then
   proceed under stated assumptions rather than stopping again.
4. **Never read a published artifact back to check a publish.** Check the local
   file. One such read cost roughly 40,000 tokens during design.
5. **One review pass per phase, at the end, on finished work.** Not per file, not
   mid build. The design review caught a screen about to clip and five Devanagari
   strings set in fonts with no Devanagari coverage, which is exactly the class of
   defect that survives casual reading.
6. **Prefer cheap numeric checks over looking.** The spectral check on the audio
   cost almost nothing and proved more than listening would have.
7. **Amend this document before deviating from it**, so the next session inherits
   the decision rather than the confusion.
8. **One branch per phase**, named for it, for example `phase-1-application`.
   Branch from an up to date `main`, open a pull request, and never push to
   `main` directly. The phase is finished when its pull request merges, so the
   branch name and the phase number are the same fact in two places.
9. **Check the work against the acceptance criteria** in section 6 before opening
   the pull request, then describe the change in plain prose. Say what it does,
   why, and what a reviewer should know. Anything that missed a target gets a
   sentence saying so. Do not paste the criteria in as a tick list.

Each phase is written to be completed at medium effort. The decisions are made,
the acceptance criteria are explicit, and the out of scope list is explicit. There
is no exploration required and none is wanted. If a phase feels like it needs
open ended investigation, that is a signal this document has a gap, and the gap
should be filled here rather than improvised there.

---

## 8. Open questions for a human

Neither blocks Phase 1.

1. **Nepali verification.** Every Nepali string is unverified. Needs a native
   speaker before any field use.
2. **Listening test.** The synthesised calls have been checked spectrally but
   never heard. Somebody needs to play a track and say whether the alarm reads as
   a bird or as a synthesiser. If it reads as a synthesiser, Phase 2 fixes it
   with real recordings anyway.

## 9. Reference figures

Kept here so no phase needs to search for them again.

- Parrot hearing: roughly 77 Hz to 7.6 kHz, peak sensitivity near 3 kHz, poor
  above 8 kHz, no ultrasound, no infrasound.
- Working band: 1 to 5 kHz. Stimulus spectral centroids measured at 2544 to
  3396 Hz, with zero energy above 8 kHz.
- Track shape: 15 minutes, about seven events, gaps of 80 to 200 seconds.
- Vulnerable window: three to five weeks, milk stage to harvest.
- Reported sunflower losses: 20 to 50 per cent typical, up to 90 per cent in bad
  areas, 10 to 40 per cent even with recommended practice.
- Acoustic deterrent effectiveness: roughly 44 to 54 per cent damage reduction.
- Damage falls to near zero beyond about 50 m from the field margin.
- PA reflex horn: roughly 400 Hz to 5 kHz, 105 to 110 dB per watt at one metre.
- Target species: rose-ringed parakeet, *Psittacula krameri borealis*. Main
  predator to voice: shikra, *Accipiter badius*.
