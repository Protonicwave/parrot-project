// The settings model: the chip cycles, the defaults, and what a stored value
// that is no longer valid falls back to.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  defaults, fromStored, locales, middayDensities, nextIn, runModes,
} from '../../app/src/core/settings.js';

test('the run length chip reaches all three modes and comes back', () => {
  let mode = 'fifteen';
  const seen = [mode];
  for (let tap = 0; tap < 3; tap += 1) {
    mode = nextIn(runModes, mode);
    seen.push(mode);
  }
  assert.deepEqual(seen, ['fifteen', 'continuous', 'allDay', 'fifteen']);
});

test('every cycle returns to where it started', () => {
  for (const values of [runModes, middayDensities, locales]) {
    let at = values[0];
    for (let tap = 0; tap < values.length; tap += 1) at = nextIn(values, at);
    assert.equal(at, values[0]);
  }
});

test('nothing stored gives the defaults', () => {
  assert.deepEqual(fromStored({}, 6), defaults);
});

test('continuous is the default, because a run that ends by itself says nothing', () => {
  assert.equal(defaults.runMode, 'continuous');
  assert.equal(defaults.middayDensity, 'fewer');
  assert.equal(defaults.locale, 'ne');
});

test('a stored value that is no longer one of the choices falls back', () => {
  const read = fromStored({ runMode: 'hourly', middayDensity: 'none', locale: 'fr' }, 6);
  assert.deepEqual(read, defaults);
});

test('a stored choice survives', () => {
  const read = fromStored(
    { runMode: 'allDay', middayDensity: 'same', locale: 'en', track: '4' }, 6);
  assert.deepEqual(read, {
    runMode: 'allDay', middayDensity: 'same', locale: 'en', track: 4,
  });
});

test('a track number out of range goes back to automatic rather than throwing', () => {
  assert.equal(fromStored({ track: '9' }, 6).track, null);
  assert.equal(fromStored({ track: 'auto' }, 6).track, null);
  assert.equal(fromStored({ track: '0' }, 6).track, null);
  assert.equal(fromStored({ track: null }, 6).track, null);
});
