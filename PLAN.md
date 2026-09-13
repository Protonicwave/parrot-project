# Sunflower Guard

A phone plays randomised bird scare audio, loud, through whatever speaker a farm
already owns. It protects sunflower heads from rose-ringed parakeets during the
three to five weeks the seed is worth eating.

**This document is the contract.** Every decision below is settled. Phases read
this file instead of reconstructing the reasoning, and nothing here is reopened
without a deliberate amendment. If a phase finds a genuine flaw, it amends this
document first and then builds.

Repository: <https://github.com/Protonicwave/parrot-project>

Status: specification frozen. Phases 0, 1 and 2 complete, Phase 3 specified.

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

Amended in Phase 3, against decision 3. A settings screen is added, so the app
is no longer one screen. Decision 3 survives in the part that was load bearing:
the main screen still does one thing, the whole of it is still the button, and
nothing a farmer needs in the field has moved behind a menu. What settings buy
is a place for choices that are made once and then left alone, which is not the
same job as the one the main screen does. The cost is honest: a second screen is
a second thing to learn, and it is justified only while it holds settings that
are not already on the main screen. Section 6 records the test to apply before
adding a row to it.

Decision 2 is untouched and the distinction matters. All day mode varies how
densely it plays across the day, but the farmer still starts it and still stops
it. The app never begins, ends or resumes playback on its own, and it still
never tells the farmer when to come back.

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

Added in Phase 3. Playback no longer stops on its own after fifteen minutes,
which was never a decision so much as the shape of a single file.

- **Three run modes.** Fifteen minutes, continuous, and all day. Continuous is
  the default. Fifteen minutes is the Phase 1 behaviour, kept because it is the
  only mode that ends by itself.
- **Continuous plays the rotation, reshuffled.** When a track ends the next
  begins, in an order that uses each of the six once before any repeats, so
  ninety minutes pass before a flock hears the same scatter twice and there is
  no fixed period to learn. The last track of one cycle is never the first of
  the next.
- **All day thins out in the middle of the day.** Parakeets feed shortly after
  dawn and again in late afternoon and rest in shade between. Playing at full
  density into an empty field teaches the flock that the sound is harmless,
  which is the failure mode the whole design exists to avoid, so all day is
  dense in the two feeding windows and sparse everywhere else, night included.
  A farmer who leaves it running overnight is spending very little. The windows
  are **05:00 to 09:00 and 15:00 to 19:00** by the phone's local clock. They are
  wide on purpose: the cost of playing densely for an hour longer than the flock
  is there is small, and the cost of missing the first hour of feeding is the
  crop. They do not follow sunrise, because a fixed pair of windows can be
  tested to the minute and a farmer who wants something else stops the app.
- **Sparseness is made of rest tracks, not of pauses.** A rest track is fifteen
  minutes carrying a single event. In the sparse period each scare track is
  followed by two rest tracks, which cuts density to roughly a third. This is
  why it is not done by simply pausing between tracks: a phone with a locked
  screen suspends an app that is not actually playing, and the next event would
  never fire. Baked in silence is what keeps the audio session alive, and it is
  the same reason a track is mostly silence in the first place.
- **Stopping is still one tap** anywhere on the main screen, in every mode.
- **Density is the app's decision, not the generator's.** The generator labels
  what it built and says nothing about when to play it. See 4.1.

### 3.2 States

Six states on the main screen, plus the settings screen. There are no others.

| State | Shown | Notes |
| --- | --- | --- |
| Ready, automatic | Play mark, action word, run length line, advisory line, tick strip, day counter, outlined mode chip, outlined track chip, volume line | Default on open |
| Ready, manual track | As above, filled track chip, advisory line swaps to the return to automatic hint | Only differs by the chip and one line |
| Playing, fifteen minutes | Status dot, countdown, stop mark, live tick strip with playhead, events sounded count, day and track as plain text | Track is not tappable while playing |
| Playing, continuous or all day | As above, but the display counts elapsed rather than remaining, the count of events is the day's total, and the track reads as its place in the cycle | A countdown would be a lie in a mode that does not end |
| Finished | Tick, completion word, invitation to press again, spent tick strip, day counter, chips | Only reachable from fifteen minute mode |
| Ready after dark | Identical layout on the dark ground | Purely a palette swap |

The tick strip is the product explained in one graphic. Fifteen minutes, seven
scares, irregular gaps, silence everywhere else. Each track has its own scatter,
so the strip must be generated from the track's real event times, never faked.

In continuous and all day modes the strip still shows the current track, since
that is the only span it can honestly represent. In all day mode the ready state
shows the day instead, dense at both ends and thin in the middle, which is the
one graphic that explains what the mode does.

The settings screen holds four rows and nothing else: run length, midday
density, track, and language. It is reached from a control in the top corner of
the main screen, opposite the language toggle, and it is not reachable while
playing, for the same reason the track chip is not tappable then. Every control
on it is a chip, because the application has chips and has never had switches.
Three of the four rows also appear on the main screen and are duplicated
deliberately: the main screen is for the choice made in the field, the settings
screen for the choice made once. Section 6 carries the test for adding a fourth.

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
| mode continuous | लगातार | Continuous |
| mode all day | दिनभर | All day |
| runs until stopped | तपाईंले नरोकेसम्म बज्छ | Runs until you stop it |
| all day summary | दिनभर, दिउँसो कम | All day, quieter at midday |
| elapsed | चलेको | elapsed |
| sounded today | आज ३३ वटा आवाज बजिसके | 33 sounded today |
| dawn | बिहान | Dawn |
| midday | दिउँसो | Midday |
| dusk | साँझ | Dusk |
| all day reason | सुगा बिहान र साँझ आउँछ, त्यसैले त्यति बेला घना बज्छ | Parakeets come at dawn and dusk, so it plays densely then |
| settings | सेटिङ | Settings |
| run length | कति बेरसम्म बजाउने | How long to play |
| midday density | दिउँसो | Midday |
| fewer | कम बजाउने | Fewer |
| same | बराबर | Same |
| midday reason | सुगा दिउँसो खेतमा आउँदैन। त्यति बेला कम बजाए आवाजको असर लामो समय रहन्छ। | Parakeets are not in the field at midday. Playing less then keeps the sound working for longer |
| language | भाषा | Language |
| back | फर्कनुहोस् | Back |

Nepali numerals ० १ २ ३ ४ ५ ६ ७ ८ ९ are used throughout the Nepali interface,
including the countdown and all counters.

**Every Nepali string above is unverified.** It was authored without a native
speaker. Flag this in the README so it cannot be forgotten.

Phase 2 built the sheet the check runs from,
`docs/field-guide/nepali-verification.md`, generated from the locale files and
the field guide so it cannot drift from what ships. Phase 3 regenerates it to
pick up the strings added above. The check itself still needs a person, and
until it happens nothing here goes to a farm.

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
├── .gitignore                Secrets, caches and intermediate WAV output
├── .editorconfig             UTF-8, LF, 2 spaces, 4 for Python
├── app/
│   ├── index.html            Shell. No inline logic
│   ├── package.json          Marks app/src as ES modules for the test runner
│   ├── manifest.webmanifest
│   ├── service-worker.js     Precache shell, cache tracks on demand
│   ├── assets/
│   │   ├── styles/app.css
│   │   ├── locales/{ne,en}.json
│   │   └── tracks/           Scare tracks, rest tracks and manifest.json
│   └── src/
│       ├── main.js           Composition root. The only module that wires things
│       ├── core/             Pure. No DOM, no clock, no storage, no audio
│       │   ├── rotation.js   Day index to track index, and cycle to play order
│       │   ├── schedule.js   Time of day and mode to the next track to play
│       │   ├── settings.js   The settings model, its defaults and its cycles
│       │   ├── session.js    State machine and its transitions
│       │   └── numerals.js   Latin to Devanagari digit mapping
│       ├── platform/         Impure. Each wraps exactly one browser capability
│       │   ├── player.js     Audio element lifecycle, chaining and wake behaviour
│       │   ├── clock.js      Current time, day index and period of day
│       │   └── store.js      Persistence
│       └── ui/
│           ├── render.js     Main screen state to DOM
│           ├── settings.js   Settings screen state to DOM
│           └── strings.js    Locale lookup and numeral substitution
├── generator/
│   ├── dsp.py               Band limiting, envelopes, frequency tracks
│   ├── sources.py           Xeno-canto search, download, cache and licence ledger
│   ├── stimuli.py           The five stimulus voices
│   ├── tracks.py            Event assembly and track layout
│   ├── encode.py            WAV and MP3 output
│   ├── cli.py               Argument parsing and entry point
│   ├── recordings.json      The pinned source recordings and their attribution
│   └── README.md
├── docs/
│   ├── design/              Reference mockup and the earlier design directions
│   └── field-guide/         One page farmer note, Nepali and English
└── tests/
    ├── core/                Unit tests for the pure modules
    └── generator/           Spectral assertions on generated audio
```

Amended in Phase 2: the MP3 tracks are versioned after all. The original reason
not to was that 43 MB of reproducible audio is not worth carrying, and variable
bitrate took the set to 5.75 MB. At that size the argument inverts: serving the
app from GitHub Pages means the audio has to be in the repository or be rebuilt
on every deploy, and rebuilding needs an API key in a public repository's
Actions and a working connection to a third party archive. Carrying six small
files is the cheaper and more durable of the two. The intermediate WAV output is
still ignored, and so is the download cache.

**The one architectural rule: pure core, impure edges.** Rotation, the state
machine and numeral conversion are pure functions taking their inputs as
arguments. The clock, storage, audio and DOM live behind thin wrappers in
`platform/` and `ui/`. `main.js` is the only place they meet. This is what makes
the logic testable without a browser, and it is the whole of the architecture.

Amended in Phase 2: `sources.py` joins the generator because fetching and
pinning third party recordings is a responsibility none of the other five
modules owns, and mixing it into `stimuli.py` would put the network inside the
signal path. The downloaded audio is cached outside version control, the same
argument as generated audio. What is versioned is `recordings.json`, which pins
every Xeno-canto identifier, recordist and licence, so the set is both
reproducible and correctly attributed.

Scalable here means clean seams, not layers. This is a one screen application.
Adding a framework, a state container, a build step or a dependency injection
container to it would be worse engineering, not better. If a future phase needs a
second crop or a second target species, the seam it extends is `assets/tracks/`
and `locales/`, not the module graph.

### 4.1 The manifest contract

`app/assets/tracks/manifest.json` is the only thing the generator and the
application share. It is frozen here, before either side of Phase 3 is built,
because that is what lets the two halves be written independently and in either
order. Neither half may widen it without amending this section first.

The rule that keeps the seam narrow: **the generator describes what it built,
the application decides what to do with it.** Nothing about time of day,
density, rotation or run length belongs in the manifest. Everything in it is a
fact about a file that already exists.

Phase 2 shipped these keys and Phase 3 does not change any of them: `generated`,
`seed`, `sample_rate`, `minutes_per_track`, `recordings`, and per track `file`,
`events`, `size_mb` and a `log` of `at_seconds`, `duration` and `stimuli`.

Phase 3 adds exactly one key per track:

- `kind`, either `scare` or `rest`. A scare track is the fifteen minutes with
  roughly seven events that the product has always been. A rest track is the
  same fifteen minutes carrying a single event.

That is the whole change. It is one word per track because density is a
scheduling decision, and scheduling lives in `core/schedule.js` where it can be
tested without a browser or an audio file.

Two compatibility rules, both of which exist so that either half of Phase 3 can
ship first:

- A manifest with no `kind` anywhere is read as all scare tracks, which is
  exactly what Phase 2 produced.
- If all day mode is selected and no rest track exists, it plays as continuous
  and says nothing about it. A farmer must never meet an error because a file is
  missing, and section 5.1 already requires this of every missing track.

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

Amended in Phase 3. The JavaScript budget rises from 10 KB to 14 KB gzipped and
the CSS from 4 KB to 5 KB, to pay for a second screen, a scheduler and gapless
chaining. Raising a budget is a decision, not an accident, so the figure is
stated here rather than discovered at handover. Every other line in the table
is unchanged and three of them get harder in a mode that runs for hours:

- **One re-render per second while playing** still holds in continuous and all
  day. A track change is not a re-render of the screen, it is a new tick strip
  and two text nodes.
- **No allocations in the render path** matters more, not less. A fifteen minute
  run forgives a small leak. A twelve hour run does not.
- **Under 200 ms from tap to first sample** now also applies to the join between
  tracks, where the target is that there is no audible gap at all.

### 5.3 Audio payload

Six fifteen minute tracks at constant 64 kbps come to 43 MB, which is too much to
pull over a rural connection.

**Switch the encoder to variable bitrate.** Roughly 85 per cent of each track is
digital silence, which VBR encodes at almost no cost while constant bitrate pays
full price for it. Expect a four to eightfold reduction, bringing the set to
somewhere between 5 and 12 MB. Measure the real figure and record it.

Measured in Phase 2: 7.5 times, from 7.20 MB to 0.96 MB for the same track, at
LAME VBR quality 5. The six tracks come to 5.75 MB against 43.2 MB at 64 kbps
constant, so the set is a third of the lower end of the estimate. The silence
assumption was conservative: the tracks are 96.4 per cent digital silence, which
is why the saving beats the predicted range rather than landing inside it.

The quality setting saturates. Anything from 2 upwards produces an identical
file, because with no content above 5 kHz the encoder has nothing further to
discard. Only quality 0 differs, and it is five times larger for no audible
gain in a band that stops at 5 kHz.

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

Added in Phase 3. The new pure modules carry the interesting cases, which is the
point of keeping them pure:

- **Schedule.** Both window edges to the minute, since an off by one there is
  invisible in use and wrong all day. The sparse pattern. Every mode. The
  fallback when no rest track exists.
- **Rotation.** That a cycle uses each track once, that the order changes
  between cycles, and that the last track of one cycle is never the first of the
  next.
- **Settings.** The chip cycle returns to where it started, defaults apply when
  nothing is stored, and a stored value that is no longer valid falls back
  rather than throwing.
- **Session.** The transitions continuous mode adds, including stopping midway
  through a cycle, and that a track ending in continuous mode does not reach the
  finished state.

Two checks that are not unit tests and are worth more than more unit tests:

- **Assert the declared duration of every encoded track.** Phase 2 shipped
  tracks whose container claimed seventeen and a half minutes for fifteen
  minutes of audio, and all twenty nine tests passed, because the application
  reads length from the manifest and never asked the file. One assertion that
  decodes each track and compares its duration against `minutes_per_track`
  closes that whole class.
- **Run it for an hour before believing the allocation budget.** A leak in the
  render path cannot be seen in a fifteen minute run and is the defect a
  continuous mode invites.

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
  - Pull genuine rose-ringed parakeet alarm and flock calls, and genuine shikra
    calls, from Xeno-canto. Keep licence and attribution for each.
  - Rebuild the six tracks with real recordings as the payload, keeping the
    synthesised broadband bangs, which do not need to be species accurate.

    Amended in Phase 2: the distress scream stays synthesised as well, because
    Xeno-canto holds no distress recording for any parrot. The search returns
    zero for `type:"distress call"` across the whole of Psittaciformes, not
    merely for this species, which is what you would expect of an archive of
    field recordings: a distress call means a bird in the hand. Recordings with
    a NoDerivatives licence are also excluded throughout, since band limiting
    and cutting a clip are plainly derivative. Both constraints narrow the
    payload rather than the design, and the escalation in section 3.1 is
    unchanged: the opener and the mobbing chorus are now real, and the two
    stimuli that were always allowed to be approximations remain so.
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

### Phase 3: continuous playback and settings

Phase 3 is two sessions over disjoint directories, for the same reason Phases 1
and 2 were. Section 4.1 freezes the only thing they share, so they may run in
either order or at the same time, and neither waits on the other.

#### Phase 3a: the application

- **Entry:** `PLAN.md` read. Section 4.1 is the contract with the other half.
- **Scope:** `app/src/`, `app/assets/styles/`, `app/assets/locales/` and
  `tests/core/`.
  - The three run modes and the mode chip, cycling in the order fifteen
    minutes, continuous, all day, and wrapping.
  - Continuous playback: chaining with no audible gap, the reshuffled cycle,
    and the elapsed display that replaces the countdown.
  - **Chaining uses two audio elements, not one.** The next track is loaded into
    the idle element while the current one plays, and they swap at the join.
    Setting a new source on a single element leaves a gap while it loads, and a
    gap is where a locked phone suspends the audio session. This is decided
    here because it is the one implementation choice in Phase 3a that the
    acceptance criteria depend on.
  - All day: the density rule in `core/schedule.js`, reading `kind` from the
    manifest, and the day strip on the ready screen.
  - The settings screen and its four rows.
  - Every string added to section 3.3, in both languages.
- **Out of scope:** the generator, any audio file, the field guide, and any
  change to `manifest.json` beyond reading it.
- **Acceptance:**
  1. Continuous runs a full cycle of six tracks without stopping and with no
     audible gap at a join.
  2. Playback survives a screen lock across a track change. This is the one that
     matters and the one that cannot be unit tested.
  3. All day plays densely in the two windows and sparsely between, and falls
     back to continuous when there is no rest track, silently.
  4. The mode chip reaches all three modes and the choice survives a restart.
  5. Settings opens from ready, is unreachable while playing, every row changes
     what it claims to, and back returns to the main screen.
  6. Every rule in section 3.4 holds, checked deliberately.
  7. Every budget in section 5.2 met or the miss reported.
  8. Core unit tests pass.
  9. An hour of continuous playback shows no growth in the render path.

#### Phase 3b: the audio

- **Entry:** `PLAN.md` read, plus the Xeno-canto key already in `.env`.
- **Scope:** `generator/`, `app/assets/tracks/`, `tests/generator/`.
  - **Rest tracks.** Two of them, fifteen minutes, one event each. Two rather
    than one so that a sparse period is not perfectly predictable.
  - **`kind` in the manifest**, per section 4.1.
  - **Level variation.** Each event takes a peak between 0.55 and 1.0 of full
    scale. Every event currently arrives at the same loudness, so every alarm
    sounds like it is at the same distance, and real flocks are not. This is the
    cheapest naturalness gain available.
  - **No recording twice in a row.** A source recording may not be used by two
    consecutive events in the same track.
  - **Event shape.** Roughly one event in five is a single stimulus that comes
    to nothing, because real alarms often do. The rest escalate as they do now.
  - **More shikra.** The pool stands at five, the smallest of the three, and the
    band check is what thinned it. Widen the search rather than the check.
  - **The duration assertion** from section 5.6.
- **Out of scope:** anything inside `app/src/`.
- **Acceptance:**
  1. Spectral assertions pass for every stimulus, every scare track and every
     rest track.
  2. Rest tracks carry exactly one event and are labelled `rest`.
  3. The declared duration of every encoded track matches `minutes_per_track`.
  4. Total payload under 15 MB, with the real figure recorded.
  5. Every recording still carries its identifier, recordist and licence.
  6. The verification sheet is regenerated so it covers the new strings.

#### Before adding a fifth settings row

Settings exists because run length needed somewhere to live that was not the
field. It holds three rows that are also on the main screen and one that is not.
That ratio is the thing to watch. A new row earns its place only if it is a
choice made once and then left alone, and if it cannot sit on the main screen
without crowding the one action. Anything a farmer would change while standing
in a field belongs on the main screen or nowhere. If settings ever holds six
rows that are all duplicates, it has become a menu for its own sake and should
go.

### Why the phases are the size they are

Not by counting forks but by what fits. **The right number of phases is the
smallest number such that each still fits in one session without the context
being compacted mid build.** Both failures are real and they cost differently.

Too many phases and each boundary pays a reload tax: this document, the shape of
the repository, the state of the toolchain. That tax is now over ten thousand
tokens before any work starts, which is worth paying twice and not worth paying
six times.

Too few, and a build runs past the point where its own early decisions are still
in view. That is the more expensive failure, because the work then gets
re-derived rather than merely re-read, and re-derived decisions do not always
come out the same way. The whole reason this document exists is that the
original design cost was not verification but building at full fidelity while
decisions were still open.

Disjoint directories are what make a split cheap, and a frozen interface is what
makes directories disjoint. Phases 1 and 2 shared `manifest.json` and never had
to talk. Section 4.1 does the same job for Phase 3.

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

Added after Phase 2, which came out accurate and cost more than it should have.
These five are where the waste actually was, in rough order of size.

10. **Batch the unknowns into one spike.** Phase 2 learned that Xeno-canto drops
    an unrecognised `type:` term silently, holds no distress call for any
    parrot, serves some files as WAV under an `.mp3` name, and ships the odd
    corrupt frame. None of that was knowable in advance and all of it was cheap.
    It was discovered across six separate probes when one script printing one
    table would have done. Ask everything at once, before building.
11. **Write the acceptance predicate before tuning, then sweep once.** The
    single largest avoidable cost in Phase 2 was tightening the audio one
    criterion at a time: band energy, then a centroid ceiling, then centroid
    stability, then the filtering of a stimulus, each with a full rebuild and
    re-measure behind it. Deciding the whole test first and then sweeping the
    candidates in one pass reaches the same answer in a fraction of the passes.
    Hill climbing is the expensive way to do a search.
12. **Run the real application early, not as a final check.** Phase 2's worst
    defect was a missing Xing header, which every one of twenty nine passing
    tests was blind to and which was obvious within seconds of opening the app.
    Integrate in the first fifth of a phase. It is also the cheapest way to find
    out that a plan is wrong.
13. **Put the irreversible human judgement first.** Phase 2 built the whole
    recording selection apparatus before anybody had heard a single track. If
    the listening test in section 8 comes back badly, part of that work was
    spent before the question that governs it was answered. Section 7.2 already
    said this, and it is worth restating as an ordering rule rather than a
    fidelity one.
14. **Change files directly.** Every avoidable failure in Phase 2 that was not
    one of the above came from scripted find and replace across source files:
    line endings, escaping, and replacements that consumed one another. Edit the
    file.

Each phase is written to be completed at medium effort, and Phase 3 is written
that way deliberately. Every decision it needs is closed here: three modes and
their order, the density rule and its windows, the shape of a rest track, the
four settings rows, the exact manifest change, the strings in both languages,
and what each half is not allowed to touch. There is no exploration required and
none is wanted. If a phase feels like it needs open ended investigation, that is
a signal this document has a gap, and the gap should be filled here rather than
improvised there.

---

## 8. Open questions for a human

Neither blocked Phase 1. The listening test should now come before Phase 3b, per
rule 13 in section 7.

1. **Nepali verification.** Every Nepali string is unverified. Needs a native
   speaker before any field use. Phase 2 added
   `docs/field-guide/nepali-verification.md`, which puts all 29 strings, the
   interface and the field guide alike, in one sheet beside their intended
   meaning. The check itself still needs a person.
2. **Listening test.** The audio has been checked spectrally but never heard.
   Phase 2 replaced the parakeet alarm, the flock chatter and the shikra with
   real recordings, so the original form of this question is settled: those
   three are birds because they are recordings of birds. What remains is whether
   an assembled event reads as something happening, and whether the synthesised
   distress scream sits convincingly beside the real calls.

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

Added in Phase 3, and the reason all day thins out rather than simply running
flat out.

- Daily pattern: parakeets feed shortly after dawn and again in late afternoon,
  and rest in shade through the middle of the day.
- Intermittent beats continuous, and by a wide margin. Continuous or fixed
  interval broadcast accelerates habituation, because the animal learns that
  nothing ever follows the signal. Pseudorandom pulse intervals have held a 97
  per cent reduction in grey seal presence across nineteen months with no sign
  of the response declining.
- Habituation is driven by unreinforced repetition, so every event that sounds
  into an empty field is spending the deterrent for nothing. This is why more
  playing time does not mean more protection, and it is the single finding that
  shaped the whole of Phase 3.
