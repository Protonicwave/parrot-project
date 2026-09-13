// Owns the current time and the day index derived from it.

const millisecondsPerDay = 86400000;

export function now() {
  return new Date();
}

// Counts whole days from local midnight to local midnight, so a run at 23:50
// and one at 00:10 are different days regardless of elapsed hours.
export function dayIndex(firstRun, today) {
  const from = Date.UTC(firstRun.getFullYear(), firstRun.getMonth(), firstRun.getDate());
  const to = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.floor((to - from) / millisecondsPerDay);
}

// Readability only. The ground carries no scheduling meaning: the farmer
// decides when to play, never the app.
export function isAfterDark(time) {
  const hour = time.getHours();
  return hour < 6 || hour >= 18;
}

// Minutes from local midnight. The feeding windows are fixed clock times, so
// this is the only shape the schedule needs the time in.
export function minutesOfDay(time) {
  return time.getHours() * 60 + time.getMinutes();
}
