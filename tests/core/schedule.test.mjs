// The density rule, both window edges to the minute, and the run through a
// continuous cycle. An off by one at a window edge is invisible in use and
// wrong all day, which is the whole reason this is a pure module.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  allDay, beginRun, continuous, dayShape, fifteen, isFeeding, nextInRun, partition,
} from '../../app/src/core/schedule.js';

const sixScare = Array.from({ length: 6 }, (_, index) => ({ file: `track_0${index + 1}.mp3` }));
const withRests = sixScare.concat([
  { file: 'rest_01.mp3', kind: 'rest' },
  { file: 'rest_02.mp3', kind: 'rest' },
]);

const midday = 12 * 60;
const dawn = 6 * 60;

function run(tracks, options, steps, minutesOfDay) {
  const started = beginRun({ tracks, dayIndex: 0, manualChoice: null, ...options });
  const out = [started];
  let at = started;
  for (let step = 0; step < steps; step += 1) {
    at = nextInRun(at, tracks, minutesOfDay);
    out.push(at);
  }
  return out;
}

test('the feeding windows begin and end on the minute they claim', () => {
  assert.equal(isFeeding(4 * 60 + 59), false);
  assert.equal(isFeeding(5 * 60), true);
  assert.equal(isFeeding(8 * 60 + 59), true);
  assert.equal(isFeeding(9 * 60), false);
  assert.equal(isFeeding(14 * 60 + 59), false);
  assert.equal(isFeeding(15 * 60), true);
  assert.equal(isFeeding(18 * 60 + 59), true);
  assert.equal(isFeeding(19 * 60), false);
});

test('midnight and the middle of the day are both outside the windows', () => {
  assert.equal(isFeeding(0), false);
  assert.equal(isFeeding(midday), false);
});

test('a manifest with no kind anywhere is all scare tracks', () => {
  const kinds = partition(sixScare);
  assert.equal(kinds.scare.length, 6);
  assert.equal(kinds.rest.length, 0);
});

test('rest tracks are separated from scare tracks by their kind alone', () => {
  const kinds = partition(withRests);
  assert.deepEqual(kinds.scare, [0, 1, 2, 3, 4, 5]);
  assert.deepEqual(kinds.rest, [6, 7]);
});

test('a continuous cycle uses each of the six once before any repeats', () => {
  const kinds = partition(sixScare);
  const steps = run(kinds, { mode: continuous, middayDensity: 'fewer' }, 5, midday);
  const played = steps.map((step) => step.number);
  assert.equal(new Set(played).size, 6);
  assert.deepEqual([...played].sort(), [1, 2, 3, 4, 5, 6]);
});

test('the order changes between cycles and never repeats across the join', () => {
  const kinds = partition(sixScare);
  const steps = run(kinds, { mode: continuous, middayDensity: 'fewer' }, 11, midday);
  const first = steps.slice(0, 6).map((step) => step.number);
  const second = steps.slice(6).map((step) => step.number);
  assert.notDeepEqual(first, second);
  assert.notEqual(second[0], first[5]);
  assert.equal(new Set(second).size, 6);
});

test('all day plays every track densely inside a feeding window', () => {
  const kinds = partition(withRests);
  const steps = run(kinds, { mode: allDay, middayDensity: 'fewer' }, 6, dawn);
  assert.deepEqual(steps.map((step) => step.kind), Array(7).fill('scare'));
});

test('all day puts two rest tracks after every scare track at midday', () => {
  const kinds = partition(withRests);
  const steps = run(kinds, { mode: allDay, middayDensity: 'fewer' }, 6, midday);
  assert.deepEqual(steps.map((step) => step.kind),
    ['scare', 'rest', 'rest', 'scare', 'rest', 'rest', 'scare']);
});

test('the scare tracks either side of a sparse stretch still take turns', () => {
  const kinds = partition(withRests);
  const steps = run(kinds, { mode: allDay, middayDensity: 'fewer' }, 6, midday);
  const scares = steps.filter((step) => step.kind === 'scare').map((step) => step.number);
  assert.equal(new Set(scares).size, scares.length);
});

test('a farmer who asks for the same density at midday gets it', () => {
  const kinds = partition(withRests);
  const steps = run(kinds, { mode: allDay, middayDensity: 'same' }, 6, midday);
  assert.deepEqual(steps.map((step) => step.kind), Array(7).fill('scare'));
});

test('all day falls back to continuous when there is no rest track', () => {
  const kinds = partition(sixScare);
  const steps = run(kinds, { mode: allDay, middayDensity: 'fewer' }, 6, midday);
  assert.deepEqual(steps.map((step) => step.kind), Array(7).fill('scare'));
  assert.equal(new Set(steps.slice(0, 6).map((step) => step.number)).size, 6);
});

test('fifteen minute mode ends after one track', () => {
  const kinds = partition(sixScare);
  const steps = run(kinds, { mode: fifteen, middayDensity: 'fewer' }, 1, dawn);
  assert.equal(steps[0].done, false);
  assert.equal(steps[1].done, true);
});

test('a manual choice starts the cycle rather than repeating one track', () => {
  const kinds = partition(sixScare);
  const started = beginRun({
    mode: continuous, middayDensity: 'fewer', tracks: kinds, dayIndex: 3, manualChoice: 4,
  });
  assert.equal(started.number, 4);
  let at = started;
  const played = [started.number];
  for (let step = 0; step < 5; step += 1) {
    at = nextInRun(at, kinds, midday);
    played.push(at.number);
  }
  assert.equal(new Set(played).size, 6);
});

test('the day is dense in both windows and thin between them', () => {
  const marks = dayShape(15, 'fewer');
  const inWindow = marks.filter((at) => isFeeding(at * 1440));
  const outside = marks.filter((at) => !isFeeding(at * 1440));
  // Eight hours of windows at four tracks an hour, against sixteen hours at
  // one in three.
  assert.equal(inWindow.length, 32);
  assert.ok(outside.length < inWindow.length, `${outside.length} marks outside`);
  assert.ok(marks[0] < 0.05 && marks[marks.length - 1] > 0.95);
});

test('the same density at midday fills the whole day evenly', () => {
  assert.equal(dayShape(15, 'same').length, 96);
});

test('the same rest track never plays twice running', () => {
  const kinds = partition(withRests);
  const steps = run(kinds, { mode: allDay, middayDensity: 'fewer' }, 20, midday);
  const rests = steps.filter((step) => step.kind === 'rest');
  assert.ok(rests.length > 6, 'not enough rest tracks to judge');
  for (let at = 1; at < steps.length; at += 1) {
    if (steps[at].kind !== 'rest' || steps[at - 1].kind !== 'rest') continue;
    assert.notEqual(steps[at].track, steps[at - 1].track,
      `the same rest track twice running at step ${at}`);
  }
  assert.equal(new Set(rests.map((step) => step.track)).size, 2, 'one rest track is never used');
});

test('a whole sparse afternoon does not settle into one pattern', () => {
  const kinds = partition(withRests);
  const steps = run(kinds, { mode: allDay, middayDensity: 'fewer' }, 23, midday);
  const pairs = [];
  for (let at = 0; at + 1 < steps.length; at += 1) {
    if (steps[at].kind === 'rest' && steps[at + 1].kind === 'rest') {
      pairs.push(`${steps[at].track}${steps[at + 1].track}`);
    }
  }
  assert.ok(new Set(pairs).size > 1, `every pair of rests is ${pairs[0]}`);
});
