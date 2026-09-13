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
