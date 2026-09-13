// Owns everything the screen says. Renders by mutating the nodes that changed,
// never by rebuilding, so playing costs one text update a second.

import { eventsSounded, remainingSeconds } from '../core/session.js';

function byId(id) {
  return document.getElementById(id);
}

export function createRender(strings) {
  const root = document.documentElement;
  const nodes = {
    surface: byId('surface'),
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
    soundedLine: byId('soundedLine'),
    dayLine: byId('dayLine'),
    trackChip: byId('trackChip'),
    volumeLine: byId('volumeLine'),
  };

  let drawnTrack = -1;
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

  function progress(view) {
    const elapsed = Math.min(view.elapsed, view.totalSeconds);
    const second = Math.floor(remainingSeconds(elapsed, view.totalSeconds));
    if (second !== drawnSecond) {
      drawnSecond = second;
      nodes.countdownValue.textContent = strings.clock(second);
    }
    const sounded = eventsSounded(view.eventTimes, elapsed);
    if (sounded !== drawnSounded) {
      drawnSounded = sounded;
      nodes.soundedLine.textContent = strings.text('eventsSounded', {
        done: sounded,
        total: view.eventTimes.length,
      });
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
    document.title = strings.text('appName');

    nodes.nepali.setAttribute('aria-pressed', String(view.locale === 'ne'));
    nodes.english.setAttribute('aria-pressed', String(view.locale === 'en'));

    nodes.readyBlock.hidden = view.state !== 'ready';
    nodes.playingBlock.hidden = view.state !== 'playing';
    nodes.finishedBlock.hidden = view.state !== 'finished';

    nodes.actionWord.textContent = strings.text('play');
    nodes.durationLine.textContent = strings.text('duration');
    nodes.statusWord.textContent = strings.text('playing');
    nodes.remainingWord.textContent = strings.text('remaining');
    nodes.stopWord.textContent = strings.text('stop');
    nodes.finishedWord.textContent = strings.text('finished');
    nodes.pressAgainLine.textContent = strings.text('pressAgain');
    nodes.volumeLine.textContent = strings.text('volume');
    nodes.surface.setAttribute(
      'aria-label',
      strings.text(view.state === 'playing' ? 'stop' : 'play'),
    );

    nodes.hintLine.textContent = strings.text(view.manual ? 'backToAuto' : 'advisory');

    // The counter is cosmetic, so it stops claiming a season position once the
    // season it was counting towards has passed.
    const day = strings.number(view.dayNumber);
    nodes.dayLine.textContent =
      view.dayNumber > view.seasonDays
        ? `${strings.text('day')} ${day}`
        : `${strings.text('day')} ${day} / ${strings.number(view.seasonDays)}`;

    nodes.trackChip.textContent = `${strings.text('track')} ${strings.number(view.trackNumber)}`;
    nodes.trackChip.classList.toggle('chosen', view.manual);
    nodes.trackChip.disabled = view.state === 'playing';

    if (view.trackNumber !== drawnTrack) {
      drawnTrack = view.trackNumber;
      drawTicks(view.eventTimes, view.totalSeconds);
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
