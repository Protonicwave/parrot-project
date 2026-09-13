// Owns what plays next: the order a cycle runs in, and how densely all day mode
// plays at a given time of day. Density is the application's decision, never the
// generator's: the manifest only says what each file is.

import { currentTrack, playOrder } from './rotation.js';

export const fifteen = 'fifteen';
export const continuous = 'continuous';
export const allDay = 'allDay';

// Feeding windows by the phone's local clock, in minutes from midnight. Wide on
// purpose: an hour of playing into an empty field costs very little, an hour of
// missed feeding costs the crop. Fixed rather than tied to sunrise, because a
// fixed pair of windows can be tested to the minute.
const feedingWindows = [[5 * 60, 9 * 60], [15 * 60, 19 * 60]];

// Two rest tracks after every scare track, which cuts density to roughly a
// third. Sparseness is made of rest tracks rather than pauses because a phone
// suspends an app that is not actually playing.
export const restsPerScare = 2;

const minutesPerDay = 1440;

// Where the day's three parts sit, as fractions across the day. The strip's
// labels are placed from these, so a label always lands under the marks it
// names rather than at the end of the rail.
export const dayLabelPositions = [
  (feedingWindows[0][0] + feedingWindows[0][1]) / 2 / minutesPerDay,
  (feedingWindows[0][1] + feedingWindows[1][0]) / 2 / minutesPerDay,
  (feedingWindows[1][0] + feedingWindows[1][1]) / 2 / minutesPerDay,
];

export function isFeeding(minutesOfDay) {
  return feedingWindows.some(([from, to]) => minutesOfDay >= from && minutesOfDay < to);
}

// Splits the manifest into the two kinds. A manifest with no kind anywhere is
// what Phase 2 produced, and it reads as all scare tracks.
export function partition(tracks) {
  const scare = [];
  const rest = [];
  tracks.forEach((track, index) => {
    if (track.kind === 'rest') rest.push(index);
    else scare.push(index);
  });
  return { scare, rest };
}

function seedOf(run) {
  return run.dayIndex * 97 + run.cycleNumber;
}

// A manual choice sets where the cycle starts, not what it repeats. Holding one
// track for hours is exactly the habituation the rotation exists to prevent.
function cycleFrom(count, seed, previousLast, first) {
  const order = playOrder(count, seed, previousLast);
  if (first === null || first === undefined) return order;
  const at = order.indexOf(first);
  return order.slice(at).concat(order.slice(0, at));
}

function settle(run, tracks) {
  const next = { ...run };
  if (next.kind === 'rest') {
    next.track = tracks.rest[next.restChoice % tracks.rest.length];
    next.number = null;
  } else {
    next.number = next.order[next.at] + 1;
    next.track = tracks.scare[next.order[next.at]];
  }
  return next;
}

export function beginRun({ mode, middayDensity, tracks, dayIndex, manualChoice }) {
  const count = tracks.scare.length;
  const first = currentTrack(dayIndex, count, manualChoice);
  const run = {
    mode,
    middayDensity,
    dayIndex,
    count,
    cycleNumber: 0,
    at: 0,
    restsSince: 0,
    restChoice: 0,
    kind: 'scare',
    order: [first],
    done: false,
  };
  if (mode === fifteen) return settle(run, tracks);
  run.order = cycleFrom(count, seedOf(run), null, first);
  return settle(run, tracks);
}

// True when the next track should be a rest rather than a scare. Only all day
// thins out, and only outside the two feeding windows.
function wantsRest(run, minutesOfDay) {
  if (run.mode !== allDay) return false;
  if (run.middayDensity !== 'fewer') return false;
  if (isFeeding(minutesOfDay)) return false;
  return run.restsSince < restsPerScare;
}

function nextScare(run) {
  const next = { ...run, kind: 'scare', restsSince: 0 };
  if (run.at + 1 < run.order.length) {
    next.at = run.at + 1;
    return next;
  }
  next.cycleNumber = run.cycleNumber + 1;
  next.at = 0;
  next.order = cycleFrom(run.count, seedOf(next), run.order[run.order.length - 1], null);
  return next;
}

// Which of the two rest tracks comes next is chosen rather than alternated:
// there are two of them so that a sparse period is not perfectly predictable,
// and taking turns would hand that back.
function nextRest(run) {
  return {
    ...run,
    kind: 'rest',
    restsSince: run.restsSince + 1,
    restChoice: run.restChoice + 1 + ((run.at + run.restsSince) % 2),
  };
}

// The run one track on. Fifteen minute mode ends here; the other two never do.
// The choice is made when the previous track starts, a quarter of an hour
// early, because the next file has to be loaded before it is needed.
export function nextInRun(run, tracks, minutesOfDay) {
  if (run.mode === fifteen) return { ...run, done: true };
  if (tracks.rest.length > 0 && wantsRest(run, minutesOfDay)) {
    return settle(nextRest(run), tracks);
  }
  return settle(nextScare(run), tracks);
}

// The shape of a whole day, as the fraction across the day at which each scare
// track starts. Dense at both ends and thin in the middle, which is the one
// graphic that explains what all day mode does.
export function dayShape(minutesPerTrack, middayDensity) {
  const marks = [];
  let restsSince = restsPerScare;
  for (let minute = 0; minute < minutesPerDay; minute += minutesPerTrack) {
    const sparse = middayDensity === 'fewer' && !isFeeding(minute);
    if (sparse && restsSince < restsPerScare) {
      restsSince += 1;
      continue;
    }
    restsSince = 0;
    marks.push(minute / minutesPerDay);
  }
  return marks;
}

