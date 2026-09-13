// Owns persistence. Storage can be unavailable in a locked down browser, so
// every access degrades to in memory rather than breaking playback.

const prefix = 'sunflowerGuard.';
const memory = new Map();

function backing() {
  try {
    const probe = prefix + 'probe';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

const storage = backing();

export function read(key) {
  if (!storage) return memory.has(key) ? memory.get(key) : null;
  try {
    return storage.getItem(prefix + key);
  } catch {
    return null;
  }
}

export function write(key, value) {
  memory.set(key, value);
  if (!storage) return;
  try {
    storage.setItem(prefix + key, value);
  } catch {
    // Quota or private mode. The in memory copy carries the session.
  }
}

// The first run date seeds both the day counter and the rotation, so it is
// recorded the first time the app is opened and never rewritten.
export function firstRun(today) {
  const stored = read('firstRun');
  if (stored) {
    const parsed = new Date(stored);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  write('firstRun', today.toISOString());
  return today;
}
