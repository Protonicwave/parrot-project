// Owns locale lookup and the numeral shape that goes with it.

import { toDevanagari } from '../core/numerals.js';

export function createStrings(bundles) {
  let locale = 'ne';

  // Nepali counters and the countdown are set in Devanagari digits, so numbers
  // are formatted through here rather than interpolated raw.
  function number(value) {
    const latin = String(value);
    return locale === 'ne' ? toDevanagari(latin) : latin;
  }

  function clock(seconds) {
    const whole = Math.max(0, Math.round(seconds));
    const minutes = Math.floor(whole / 60);
    const rest = whole % 60;
    return number(`${minutes}:${String(rest).padStart(2, '0')}`);
  }

  return {
    use(next) {
      locale = next;
    },

    get locale() {
      return locale;
    },

    text(key, values) {
      let out = bundles[locale][key];
      if (!values) return out;
      for (const name of Object.keys(values)) {
        out = out.replace(`{${name}}`, number(values[name]));
      }
      return out;
    },

    number,

    clock,

    // A run that can last all day turns into hours rather than counting minutes
    // past sixty, so the display never reads 431:07.
    elapsedClock(seconds) {
      const whole = Math.max(0, Math.floor(seconds));
      if (whole < 3600) return clock(whole);
      const hours = Math.floor(whole / 3600);
      const minutes = Math.floor((whole % 3600) / 60);
      return number(`${hours}:${String(minutes).padStart(2, '0')}`);
    },
  };
}
