// Composition root. The only module where the pure core, the browser wrappers
// and the DOM meet.

import { currentTrack, nextChoice } from './core/rotation.js';
import { fromStored, nextIn, runModes } from './core/settings.js';
import { beginRun, dayShape, fifteen, nextInRun, partition } from './core/schedule.js';
import { ready, playing, finished, trackEnded, transition } from './core/session.js';
import * as clock from './platform/clock.js';
import * as store from './platform/store.js';
import { createPlayer } from './platform/player.js';
import { createStrings } from './ui/strings.js';
import { createRender } from './ui/render.js';
import { createSettings } from './ui/settings.js';

// Milk stage to harvest is three to five weeks, so the counter is shown against
// a thirty day season.
const seasonDays = 30;

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
  const settingsScreen = createSettings(strings);
  const player = createPlayer(
    [document.getElementById('audioOne'), document.getElementById('audioTwo')],
    { onEnded: trackFinished },
  );

  const kinds = partition(manifest.tracks);
  const trackCount = Math.max(1, kinds.scare.length);
  const totalSeconds = manifest.minutes_per_track * 60;
  // Both shapes are built once. There are only two of them, and the strip is
  // static for as long as the setting is.
  const dayMarks = {
    fewer: dayShape(manifest.minutes_per_track, 'fewer'),
    same: dayShape(manifest.minutes_per_track, 'same'),
  };

  const chosen = fromStored({
    runMode: store.read('runMode'),
    middayDensity: store.read('middayDensity'),
    locale: store.read('locale'),
    track: store.read('track'),
  }, trackCount);

  let state = ready;
  let screen = 'main';
  let run = null;
  let pending = null;
  let runStartedAt = 0;
  let soundedDay = 0;
  let soundedBefore = 0;
  let ticker = 0;

  strings.use(chosen.locale);

  // The count on the playing screen says today, so it is kept against the day
  // rather than against the run. A farmer who stops for lunch and starts again
  // has not undone the morning.
  function totalSoundedOn(dayIndex) {
    if (Number(store.read('soundedOn')) !== dayIndex) return 0;
    return Number(store.read('soundedCount')) || 0;
  }

  function addToDayTotal(count) {
    soundedBefore += count;
    store.write('soundedOn', String(soundedDay));
    store.write('soundedCount', String(soundedBefore));
  }

  function fileFor(trackIndex) {
    const track = manifest.tracks[trackIndex];
    return track ? `assets/tracks/${track.file}` : '';
  }

  function view() {
    const today = clock.now();
    const dayIndex = clock.dayIndex(store.firstRun(today), today);
    const live = state === playing && run !== null;
    const position = currentTrack(dayIndex, trackCount, chosen.track);
    const trackIndex = live ? run.track : kinds.scare[position];
    const track = manifest.tracks[trackIndex];
    return {
      state,
      locale: strings.locale,
      ground: clock.isAfterDark(today) ? 'dusk' : 'dawn',
      dayNumber: dayIndex + 1,
      seasonDays,
      mode: chosen.runMode,
      trackNumber: live ? run.number : position + 1,
      trackCount,
      manual: chosen.track !== null,
      eventTimes: track ? track.log.map((event) => event.at_seconds) : [],
      totalSeconds,
      elapsed: player.elapsed(),
      runElapsed: live ? (Date.now() - runStartedAt) / 1000 : 0,
      soundedBefore,
      dayMarks: dayMarks[chosen.middayDensity],
      dayIndex,
    };
  }

  function paint() {
    const current = view();
    render.paint(current);
    settingsScreen.paint({
      locale: strings.locale,
      runMode: chosen.runMode,
      middayDensity: chosen.middayDensity,
      trackNumber: current.trackNumber,
      manual: chosen.track !== null,
    });
    document.documentElement.dataset.screen = screen;
    render.nodes.main.hidden = screen !== 'main';
    settingsScreen.nodes.screen.hidden = screen !== 'settings';
    render.nodes.surface.hidden = screen !== 'main';
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

  // Chooses and fetches the next track a quarter of an hour before it is
  // wanted. The density decision is therefore made one track early, which at a
  // window edge costs at most fifteen minutes of the wrong density and buys a
  // join with no gap in it.
  function queueNext() {
    pending = null;
    if (chosen.runMode === fifteen) return;
    pending = nextInRun(run, kinds, clock.minutesOfDay(clock.now()));
    const file = fileFor(pending.track);
    if (file) player.preload(file);
  }

  function complete() {
    stopTicking();
    state = trackEnded(state, true);
    run = null;
    pending = null;
    paint();
  }

  // Ending a run that was meant to keep going is not the same as finishing one.
  // Finished is a fifteen minute word, so a join that fails goes back to ready.
  function abort() {
    stopTicking();
    player.stop();
    run = null;
    pending = null;
    state = ready;
    paint();
  }

  async function trackFinished() {
    addToDayTotal(view().eventTimes.length);
    if (trackEnded(state, chosen.runMode === fifteen) === finished) {
      complete();
      return;
    }
    if (pending === null) {
      abort();
      return;
    }
    run = pending;
    try {
      if (!await player.advance()) throw new Error('nothing queued');
    } catch (error) {
      // The next track is not cached and there is no network. Ending the run
      // quietly beats an error a farmer cannot act on.
      console.error('join failed', error);
      abort();
      return;
    }
    paint();
    queueNext();
  }

  async function press() {
    if (screen !== 'main') return;
    const next = transition(state, 'press');
    if (next === state) return;
    if (next === playing) {
      const started = view();
      run = beginRun({
        mode: chosen.runMode,
        middayDensity: chosen.middayDensity,
        tracks: kinds,
        dayIndex: started.dayIndex,
        manualChoice: chosen.track,
      });
      const file = fileFor(run.track);
      if (!file) return;
      player.load(file);
      try {
        await player.play(strings.text('appName'));
      } catch (error) {
        // Nothing to play yet: no track cached and no network on the first run.
        console.error('playback refused', error);
        run = null;
        return;
      }
      state = next;
      runStartedAt = Date.now();
      soundedDay = started.dayIndex;
      soundedBefore = totalSoundedOn(soundedDay);
      paint();
      queueNext();
      startTicking(started.ground);
      return;
    }
    stopTicking();
    player.stop();
    run = null;
    pending = null;
    state = next;
    paint();
  }

  function keep(key, value) {
    store.write(key, value === null ? 'auto' : String(value));
  }

  function chooseLocale(locale) {
    strings.use(locale);
    chosen.locale = locale;
    keep('locale', locale);
    paint();
  }

  function chooseMode(mode) {
    if (state === playing) return;
    chosen.runMode = mode;
    keep('runMode', mode);
    if (state === finished) state = ready;
    paint();
  }

  function chooseDensity(density) {
    chosen.middayDensity = density;
    keep('middayDensity', density);
    paint();
  }

  function cycleTrack() {
    if (state === playing) return;
    chosen.track = nextChoice(chosen.track, trackCount);
    keep('track', chosen.track);
    if (state === finished) state = ready;
    paint();
  }

  function showScreen(next) {
    if (next === 'settings' && state === playing) return;
    screen = next;
    paint();
  }

  // Timers are throttled while the screen is locked, so the display is brought
  // back up to date the moment the farmer looks at it again.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state === playing) render.progress(view());
  });

  render.nodes.surface.addEventListener('click', press);
  render.nodes.openSettings.addEventListener('click', () => showScreen('settings'));
  render.nodes.modeChip.addEventListener('click', () => chooseMode(nextIn(runModes, chosen.runMode)));
  render.nodes.trackChip.addEventListener('click', cycleTrack);
  render.nodes.nepali.addEventListener('click', () => chooseLocale('ne'));
  render.nodes.english.addEventListener('click', () => chooseLocale('en'));

  settingsScreen.nodes.close.addEventListener('click', () => showScreen('main'));
  settingsScreen.nodes.modeFifteen.addEventListener('click', () => chooseMode('fifteen'));
  settingsScreen.nodes.modeContinuous.addEventListener('click', () => chooseMode('continuous'));
  settingsScreen.nodes.modeAllDay.addEventListener('click', () => chooseMode('allDay'));
  settingsScreen.nodes.densityFewer.addEventListener('click', () => chooseDensity('fewer'));
  settingsScreen.nodes.densitySame.addEventListener('click', () => chooseDensity('same'));
  settingsScreen.nodes.trackChip.addEventListener('click', cycleTrack);
  settingsScreen.nodes.nepali.addEventListener('click', () => chooseLocale('ne'));
  settingsScreen.nodes.english.addEventListener('click', () => chooseLocale('en'));

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
