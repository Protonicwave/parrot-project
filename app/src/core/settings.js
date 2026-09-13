// Owns the settings model: what the choices are, what they default to, and what
// a stored value means when it is no longer one of them.

export const runModes = ['fifteen', 'continuous', 'allDay'];
export const middayDensities = ['fewer', 'same'];
export const locales = ['ne', 'en'];

// Continuous is the default because a run that ends by itself leaves the field
// unguarded without telling anybody.
export const defaults = {
  runMode: 'continuous',
  middayDensity: 'fewer',
  locale: 'ne',
  track: null,
};

// Every control in the application is a chip, so every choice is a cycle that
// comes back to where it started rather than a list with an end.
export function nextIn(values, value) {
  const at = values.indexOf(value);
  return values[(at + 1) % values.length];
}

function oneOf(values, stored, fallback) {
  return values.includes(stored) ? stored : fallback;
}

// A stored track that is no longer in range falls back to automatic rather than
// throwing: the set of tracks can change under a phone that has been closed.
function storedTrack(stored, trackCount) {
  const number = Number(stored);
  return Number.isInteger(number) && number >= 1 && number <= trackCount ? number : null;
}

// Reads the whole model out of whatever the store gives back, which is strings
// or nulls and never anything the application chose.
export function fromStored(stored, trackCount) {
  return {
    runMode: oneOf(runModes, stored.runMode, defaults.runMode),
    middayDensity: oneOf(middayDensities, stored.middayDensity, defaults.middayDensity),
    locale: oneOf(locales, stored.locale, defaults.locale),
    track: storedTrack(stored.track, trackCount),
  };
}
