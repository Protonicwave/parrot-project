// Numeral conversion, both directions.

import test from 'node:test';
import assert from 'node:assert/strict';
import { toDevanagari, toLatin } from '../../app/src/core/numerals.js';

test('every digit has a Devanagari shape', () => {
  assert.equal(toDevanagari('0123456789'), '०१२३४५६७८९');
  assert.equal(toLatin('०१२३४५६७८९'), '0123456789');
});

test('separators and words are left alone', () => {
  assert.equal(toDevanagari('10:48'), '१०:४८');
  assert.equal(toDevanagari('Day 9 / 30'), 'Day ९ / ३०');
  assert.equal(toLatin('दिन ९ / ३०'), 'दिन 9 / 30');
});

test('conversion round trips', () => {
  for (let value = 0; value <= 900; value += 1) {
    assert.equal(toLatin(toDevanagari(String(value))), String(value));
  }
});

test('numbers are accepted as well as text', () => {
  assert.equal(toDevanagari(7), '७');
});
