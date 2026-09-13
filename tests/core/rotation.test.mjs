// Rotation across a full season, including the wrap and the chip cycle.

import test from 'node:test';
import assert from 'node:assert/strict';
import { currentTrack, nextChoice, playOrder, trackForDay } from '../../app/src/core/rotation.js';

test('every day of a thirty day season lands on a track', () => {
  for (let day = 0; day < 30; day += 1) {
    const index = trackForDay(day, 6);
    assert.ok(index >= 0 && index < 6, `day ${day} gave ${index}`);
  }
});

test('the six tracks take turns and wrap', () => {
  const season = [];
  for (let day = 0; day < 13; day += 1) season.push(trackForDay(day, 6));
  assert.deepEqual(season, [0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 0]);
});

test('a clock moved backwards still gives a real track', () => {
  assert.equal(trackForDay(-1, 6), 5);
  assert.equal(trackForDay(-7, 6), 5);
});

test('no track repeats within one turn of the cycle', () => {
  const turn = new Set();
  for (let day = 10; day < 16; day += 1) turn.add(trackForDay(day, 6));
  assert.equal(turn.size, 6);
});

test('a manual choice overrides the day', () => {
  assert.equal(currentTrack(0, 6, 4), 3);
  assert.equal(currentTrack(99, 6, 1), 0);
});

test('automatic follows the day', () => {
  assert.equal(currentTrack(2, 6, null), 2);
  assert.equal(currentTrack(8, 6, undefined), 2);
});

test('the chip cycles through all six and returns to automatic', () => {
  const seen = [];
  let choice = null;
  for (let tap = 0; tap < 7; tap += 1) {
    choice = nextChoice(choice, 6);
    seen.push(choice);
  }
  assert.deepEqual(seen, [1, 2, 3, 4, 5, 6, null]);
});

test('a cycle plays every track once', () => {
  const order = playOrder(6, 3, null);
  assert.equal(new Set(order).size, 6);
  assert.deepEqual([...order].sort(), [0, 1, 2, 3, 4, 5]);
});

test('consecutive cycles are not in the same order', () => {
  const orders = new Set();
  for (let cycle = 0; cycle < 20; cycle += 1) orders.add(playOrder(6, cycle, null).join(''));
  assert.ok(orders.size > 15, `only ${orders.size} distinct orders in twenty cycles`);
});

test('the last track of one cycle is never the first of the next', () => {
  let previousLast = null;
  for (let cycle = 0; cycle < 200; cycle += 1) {
    const order = playOrder(6, cycle, previousLast);
    assert.notEqual(order[0], previousLast, `cycle ${cycle} repeated across the join`);
    previousLast = order[5];
  }
});

test('a single track cycle still returns that track', () => {
  assert.deepEqual(playOrder(1, 4, 0), [0]);
});
