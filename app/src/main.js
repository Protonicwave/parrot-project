// Composition root. The only module where the pure core, the browser wrappers
// and the DOM meet.

import { currentTrack, nextChoice } from './core/rotation.js';
import { ready, playing, finished, transition } from './core/session.js';
import * as clock from './platform/clock.js';
import * as store from './platform/store.js';
import { createPlayer } from './platform/player.js';
import { createStrings } from './ui/strings.js';
import { createRender } from './ui/render.js';

// Milk stage to harvest is three to five weeks, so the counter is shown against
// a thirty day season.
const seasonDays = 30;
const trackCount = 6;

async function loadJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.json();
}

async function start() {
  let manifest;
  const [nepali, english] = await Promise.all([
    loadJson('assets/locales/ne.json'),
    loadJson('assets/locales/en.json'),
  ]);

  try {
    manifest = await loadJson('assets/tracks/manifest.json');
  } catch (error) {
    // A missing manifest must not leave a blank screen. The interface still
    // works, it just has no scatter to draw until the file is back.
    console.error('track manifest unavailable', error);
    manifest = { minutes_per_track: 15, tracks: [] };
  }

  const strings = createStrings({ ne: nepali, en: english });
  const render = createRender(strings);
  const player = createPlayer(document.getElementById('audio'), { onEnded: complete });
  const totalSeconds = manifest.minutes_per_track * 60;

  let state = ready;
  let manualChoice = readChoice();
  let ticker = 0;

  strings.use(store.read('locale') === 'en' ? 'en' : 'ne');

  function readChoice() {
    const stored = Number(store.read('track'));
    return Number.isInteger(stored) && stored >= 1 && stored <= trackCount ? stored : null;
  }

  function view() {
    const today = clock.now();
    const dayIndex = clock.dayIndex(store.firstRun(today), today);
    const trackIndex = currentTrack(dayIndex, trackCount, manualChoice);
    const track = manifest.tracks[trackIndex];
    return {
      state,
      locale: strings.locale,
      ground: clock.isAfterDark(today) ? 'dusk' : 'dawn',
      dayNumber: dayIndex + 1,
      seasonDays,
      trackNumber: trackIndex + 1,
      manual: manualChoice !== null,
      eventTimes: track ? track.log.map((event) => event.at_seconds) : [],
      totalSeconds,
      elapsed: player.elapsed(),
      file: track ? track.file : '',
    };
  }

  function paint() {
    render.paint(view());
  }

  function startTicking(ground) {
    stopTicking();
    ticker = window.setInterval(() => {
      const next = view();
      // The ground follows the clock, so a track started before sundown
      // repaints when it crosses.
      if (next.ground !== ground) {
        paint();
        startTicking(next.ground);
        return;
      }
      render.progress(next);
    }, 1000);
  }

  function stopTicking() {
    window.clearInterval(ticker);
    ticker = 0;
  }

  function complete() {
    stopTicking();
    state = transition(state, 'complete');
    paint();
  }

  async function press() {
    const next = transition(state, 'press');
    if (next === state) return;
    if (next === playing) {
      const current = view();
      if (!current.file) return;
      player.load(`assets/tracks/${current.file}`);
      try {
        await player.play(strings.text('appName'));
      } catch (error) {
        // Nothing to play yet: no track cached and no network on the first run.
        console.error('playback refused', error);
        return;
      }
      state = next;
      paint();
      startTicking(current.ground);
      return;
    }
    stopTicking();
    player.stop();
    state = next;
    paint();
  }

  function chooseLocale(locale) {
    strings.use(locale);
    store.write('locale', locale);
    paint();
  }

  function cycleTrack() {
    if (state === playing) return;
    manualChoice = nextChoice(manualChoice, trackCount);
    store.write('track', manualChoice === null ? 'auto' : String(manualChoice));
    if (state === finished) state = ready;
    paint();
  }

  // Timers are throttled while the screen is locked, so the countdown is
  // brought back up to date the moment the farmer looks at it again.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state === playing) render.progress(view());
  });

  render.nodes.surface.addEventListener('click', press);
  render.nodes.trackChip.addEventListener('click', cycleTrack);
  render.nodes.nepali.addEventListener('click', () => chooseLocale('ne'));
  render.nodes.english.addEventListener('click', () => chooseLocale('en'));
  player.onRemote(press);

  paint();
}

start();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch((error) => {
      // Offline use is the upgrade, not the requirement. The app still runs.
      console.error('service worker registration failed', error);
    });
  });
}
