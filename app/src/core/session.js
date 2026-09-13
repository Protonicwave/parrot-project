// Owns the playback state machine and everything derived from elapsed time.

export const ready = 'ready';
export const playing = 'playing';
export const finished = 'finished';

const transitions = {
  [ready]: { press: playing },
  [playing]: { press: ready, complete: finished },
  [finished]: { press: playing },
};

// Returns the state an event leads to, or the state unchanged when the event
// does not apply there. Unknown states throw because that is a wiring bug, not
// a field condition.
export function transition(state, event) {
  const fromState = transitions[state];
  if (!fromState) throw new Error(`unknown state: ${state}`);
  return fromState[event] ?? state;
}

export function isValid(state, event) {
  const fromState = transitions[state];
  return Boolean(fromState && fromState[event]);
}

export function remainingSeconds(elapsedSeconds, totalSeconds) {
  return Math.max(0, Math.ceil(totalSeconds - elapsedSeconds));
}

// An event counts as sounded the moment it starts, which is what the farmer
// hears, not when it finishes.
export function eventsSounded(eventTimes, elapsedSeconds) {
  let count = 0;
  for (const at of eventTimes) {
    if (at <= elapsedSeconds) count += 1;
  }
  return count;
}

// A track ending only finishes the run in fifteen minute mode. In continuous
// and all day the same event starts the next track instead, so whether the run
// is over is decided by the schedule and passed in here.
export function trackEnded(state, endsTheRun) {
  return endsTheRun ? transition(state, 'complete') : state;
}
