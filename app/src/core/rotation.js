// Owns which track a given day gets. Rotation is the habituation defence: a
// flock that hears the same calls on the same schedule stops reacting to them.

// Day index counts from zero at first run. Negative indices can only come from
// a clock moved backwards, so they wrap rather than fail.
export function trackForDay(dayIndex, trackCount) {
  const whole = Math.floor(dayIndex);
  return ((whole % trackCount) + trackCount) % trackCount;
}

// Automatic unless the farmer has cycled the chip. Manual choice is one based
// because that is how it is shown, so it is converted here rather than at the
// call site.
export function currentTrack(dayIndex, trackCount, manualChoice) {
  if (manualChoice === null || manualChoice === undefined) {
    return trackForDay(dayIndex, trackCount);
  }
  return trackForDay(manualChoice - 1, trackCount);
}

// The chip steps through every track, then hands control back to automatic.
export function nextChoice(manualChoice, trackCount) {
  if (manualChoice === null || manualChoice === undefined) return 1;
  return manualChoice >= trackCount ? null : manualChoice + 1;
}

// A small integer hash, so a cycle's order is reproducible from its number and
// can be tested without a source of randomness.
function mix(value) {
  let state = (value + 0x9e3779b9) | 0;
  state = Math.imul(state ^ (state >>> 16), 0x21f0aaad);
  state = Math.imul(state ^ (state >>> 15), 0x735a2d97);
  return (state ^ (state >>> 15)) >>> 0;
}

// The order a continuous cycle plays its tracks in. Each track is used once
// before any repeats, so ninety minutes pass before a flock hears the same
// scatter twice, and the order changes every cycle so there is no period to
// learn. The last track of one cycle is never the first of the next, which is
// the one repeat the shuffle cannot rule out on its own.
export function playOrder(trackCount, cycleNumber, previousLast) {
  const order = [];
  for (let index = 0; index < trackCount; index += 1) order.push(index);

  let state = mix(cycleNumber);
  for (let at = trackCount - 1; at > 0; at -= 1) {
    state = mix(state);
    const swap = state % (at + 1);
    const held = order[at];
    order[at] = order[swap];
    order[swap] = held;
  }

  if (trackCount > 1 && order[0] === previousLast) {
    const last = trackCount - 1;
    const held = order[0];
    order[0] = order[last];
    order[last] = held;
  }
  return order;
}
