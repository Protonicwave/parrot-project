// Every transition of the state machine, the invalid ones included.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  eventsSounded,
  finished,
  isValid,
  playing,
  ready,
  remainingSeconds,
  trackEnded,
  transition,
} from '../../app/src/core/session.js';

test('pressing moves between ready and playing', () => {
  assert.equal(transition(ready, 'press'), playing);
  assert.equal(transition(playing, 'press'), ready);
});

test('a track running out finishes it', () => {
  assert.equal(transition(playing, 'complete'), finished);
});

test('pressing again after a run starts another', () => {
  assert.equal(transition(finished, 'press'), playing);
});

test('events that do not apply leave the state alone', () => {
  assert.equal(transition(ready, 'complete'), ready);
  assert.equal(transition(finished, 'complete'), finished);
  assert.equal(transition(ready, 'nonsense'), ready);
  assert.equal(isValid(ready, 'complete'), false);
  assert.equal(isValid(playing, 'complete'), true);
});

test('an unknown state is a wiring bug and throws', () => {
  assert.throws(() => transition('paused', 'press'), /unknown state/);
});

test('remaining time counts down and stops at zero', () => {
  assert.equal(remainingSeconds(0, 900), 900);
  assert.equal(remainingSeconds(12.4, 900), 888);
  assert.equal(remainingSeconds(900, 900), 0);
  assert.equal(remainingSeconds(902, 900), 0);
});

test('an event counts as sounded the moment it starts', () => {
  const times = [27.32, 151.63, 294.4];
  assert.equal(eventsSounded(times, 0), 0);
  assert.equal(eventsSounded(times, 27.32), 1);
  assert.equal(eventsSounded(times, 160), 2);
  assert.equal(eventsSounded(times, 900), 3);
});

test('a track ending in continuous mode does not reach finished', () => {
  assert.equal(trackEnded(playing, false), playing);
});

test('a track ending in fifteen minute mode finishes the run', () => {
  assert.equal(trackEnded(playing, true), finished);
});

test('a run stopped midway through a cycle goes straight back to ready', () => {
  assert.equal(transition(playing, 'press'), ready);
  assert.equal(trackEnded(ready, false), ready);
});
