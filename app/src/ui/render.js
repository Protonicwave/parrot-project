// Owns everything the main screen says. Renders by mutating the nodes that
// changed, never by rebuilding, so playing costs one text update a second.

import { eventsSounded, remainingSeconds } from '../core/session.js';
import { allDay, continuous, dayLabelPositions, fifteen } from '../core/schedule.js';

function byId(id) {
  return document.getElementById(id);
}

const modeKeys = {
  fifteen: 'duration',
  continuous: 'modeContinuous',
  allDay: 'modeAllDay',
};

const readyLineKeys = {
  fifteen: 'duration',
  continuous: 'runsUntilStopped',
  allDay: 'allDaySummary',
};

export function createRender(strings) {
  const root = document.documentElement;
  const nodes = {
    surface: byId('surface'),
    main: byId('mainScreen'),
    openSettings: byId('openSettings'),
    nepali: byId('chooseNepali'),
    english: byId('chooseEnglish'),
    readyBlock: byId('readyBlock'),
    playingBlock: byId('playingBlock'),
    finishedBlock: byId('finishedBlock'),
    actionWord: byId('actionWord'),
    durationLine: byId('durationLine'),
    statusWord: byId('statusWord'),
    countdownValue: byId('countdownValue'),
    remainingWord: byId('remainingWord'),
    stopWord: byId('stopWord'),
    finishedWord: byId('finishedWord'),
    pressAgainLine: byId('pressAgainLine'),
    hintLine: byId('hintLine'),
    ticks: byId('ticks'),
    railSpent: byId('railSpent'),
    playhead: byId('playhead'),
    dayStrip: byId('dayStrip'),
    dayMarks: byId('dayMarks'),
    dawnLabel: byId('dawnLabel'),
    middayStripLabel: byId('middayStripLabel'),
    duskLabel: byId('duskLabel'),
    soundedLine: byId('soundedLine'),
    dayLine: byId('dayLine'),
    modeChip: byId('modeChip'),
    trackChip: byId('trackChip'),
    volumeLine: byId('volumeLine'),
  };

  const dayLabels = [nodes.dawnLabel, nodes.middayStripLabel, nodes.duskLabel];
  dayLabels.forEach((label, at) => {
    label.style.left = `${dayLabelPositions[at] * 100}%`;
  });

  let drawnScatter = '';
  let drawnDay = '';
  let drawnSecond = -1;
  let drawnSounded = -1;

  // The strip is the product in one graphic, so it is built from the track's
  // real event times and never from a plausible looking scatter.
  function drawTicks(eventTimes, totalSeconds) {
    for (const mark of nodes.ticks.querySelectorAll('.tickMark')) mark.remove();
    for (const at of eventTimes) {
      const mark = document.createElement('div');
      mark.className = 'tickMark';
      mark.style.left = `${(at / totalSeconds) * 100}%`;
      nodes.ticks.append(mark);
    }
  }

  // A whole day carries fifty or so marks, which is half the node budget for
  // one graphic, so the day is painted as a single background rather than as a
  // mark per track.
  function drawDay(marks) {
    const width = 0.55;
    const stops = [];
    for (const at of marks) {
      const from = (at * 100).toFixed(2);
      const to = (at * 100 + width).toFixed(2);
      stops.push(`transparent ${from}%`, `var(--inkFaint) ${from}%`,
        `var(--inkFaint) ${to}%`, `transparent ${to}%`);
    }
    nodes.dayMarks.style.backgroundImage = `linear-gradient(90deg, ${stops.join(', ')})`;
  }

  function trackText(view) {
    if (view.trackNumber === null) return strings.text('midday');
    const number = `${strings.text('track')} ${strings.number(view.trackNumber)}`;
    if (view.state !== 'playing' || view.mode === fifteen) return number;
    return `${number} / ${strings.number(view.trackCount)}`;
  }

  function progress(view) {
    const elapsed = Math.min(view.elapsed, view.totalSeconds);
    const counting = view.mode === fifteen
      ? Math.floor(remainingSeconds(elapsed, view.totalSeconds))
      : Math.floor(view.runElapsed);
    if (counting !== drawnSecond) {
      drawnSecond = counting;
      nodes.countdownValue.textContent = view.mode === fifteen
        ? strings.clock(counting)
        : strings.elapsedClock(counting);
    }
    // Fifteen minutes counts the track, because the track is the whole run.
    // The other two count the day.
    const inTrack = eventsSounded(view.eventTimes, elapsed);
    const sounded = view.mode === fifteen ? inTrack : view.soundedBefore + inTrack;
    if (sounded !== drawnSounded) {
      drawnSounded = sounded;
      nodes.soundedLine.textContent = view.mode === fifteen
        ? strings.text('eventsSounded', { done: sounded, total: view.eventTimes.length })
        : strings.text('soundedToday', { done: sounded });
    }
    const percent = (elapsed / view.totalSeconds) * 100;
    nodes.railSpent.style.width = `${percent}%`;
    nodes.playhead.style.left = `${percent}%`;
  }

  function paint(view) {
    root.lang = view.locale;
    root.dataset.locale = view.locale;
    root.dataset.ground = view.ground;
    root.dataset.state = view.state;
    root.dataset.mode = view.mode;
    document.title = strings.text('appName');

    nodes.nepali.setAttribute('aria-pressed', String(view.locale === 'ne'));
    nodes.english.setAttribute('aria-pressed', String(view.locale === 'en'));

    nodes.readyBlock.hidden = view.state !== 'ready';
    nodes.playingBlock.hidden = view.state !== 'playing';
    nodes.finishedBlock.hidden = view.state !== 'finished';

    nodes.actionWord.textContent = strings.text('play');
    nodes.durationLine.textContent = strings.text(readyLineKeys[view.mode]);
    nodes.statusWord.textContent = strings.text('playing');
    nodes.remainingWord.textContent = strings.text(view.mode === fifteen ? 'remaining' : 'elapsed');
    nodes.stopWord.textContent = strings.text('stop');
    nodes.finishedWord.textContent = strings.text('finished');
    nodes.pressAgainLine.textContent = strings.text('pressAgain');
    nodes.volumeLine.textContent = strings.text('volume');
    nodes.openSettings.setAttribute('aria-label', strings.text('settings'));
    nodes.surface.setAttribute(
      'aria-label',
      strings.text(view.state === 'playing' ? 'stop' : 'play'),
    );

    // The hint carries whichever of the three things most needs saying: how to
    // get back to automatic, why all day thins out, or when it works best.
    let hintKey = 'advisory';
    if (view.manual) hintKey = 'backToAuto';
    else if (view.mode === allDay) hintKey = 'allDayReason';
    nodes.hintLine.textContent = strings.text(hintKey);

    // The counter is cosmetic, so it stops claiming a season position once the
    // season it was counting towards has passed.
    const day = strings.number(view.dayNumber);
    nodes.dayLine.textContent =
      view.dayNumber > view.seasonDays
        ? `${strings.text('day')} ${day}`
        : `${strings.text('day')} ${day} / ${strings.number(view.seasonDays)}`;

    nodes.modeChip.textContent = strings.text(modeKeys[view.mode]);
    nodes.modeChip.classList.toggle('chosen', view.mode !== continuous);
    nodes.modeChip.disabled = view.state === 'playing';

    nodes.trackChip.textContent = trackText(view);
    nodes.trackChip.classList.toggle('chosen', view.manual);
    nodes.trackChip.disabled = view.state === 'playing';

    // Settings is unreachable while playing, for the same reason the track chip
    // is not tappable then: the run is under way and nothing in it may change.
    // It keeps its space rather than being removed, so the language toggle does
    // not walk across the top of the screen when a run starts.
    nodes.openSettings.classList.toggle('gone', view.state === 'playing');

    const scatter = view.eventTimes.join(',');
    if (scatter !== drawnScatter) {
      drawnScatter = scatter;
      drawTicks(view.eventTimes, view.totalSeconds);
    }

    // The day strip only ever stands in for the track strip on the ready
    // screen: a run under way can honestly show only the track it is playing.
    const showDay = view.mode === allDay && view.state !== 'playing';
    nodes.dayStrip.hidden = !showDay;
    nodes.ticks.hidden = showDay;
    if (showDay) {
      const shape = view.dayMarks.join(',');
      if (shape !== drawnDay) {
        drawnDay = shape;
        drawDay(view.dayMarks);
      }
      const words = ['dawn', 'midday', 'dusk'];
      dayLabels.forEach((label, at) => {
        label.textContent = strings.text(words[at]);
      });
    }

    nodes.soundedLine.hidden = view.state === 'ready';
    nodes.playhead.hidden = view.state !== 'playing';

    drawnSecond = -1;
    drawnSounded = -1;
    if (view.state === 'playing') {
      progress(view);
      return;
    }
    const spent = view.state === 'finished';
    nodes.railSpent.style.width = spent ? '100%' : '0';
    if (spent) {
      nodes.soundedLine.textContent = strings.text('eventsSounded', {
        done: view.eventTimes.length,
        total: view.eventTimes.length,
      });
    }
  }

  return { paint, progress, nodes };
}
