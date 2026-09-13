// Owns digit shape. The Nepali interface uses Devanagari numerals everywhere,
// including the countdown and every counter.

const devanagariDigits = '०१२३४५६७८९';

// Converts every Latin digit in the text, leaving colons and separators alone.
export function toDevanagari(text) {
  let out = '';
  for (const character of String(text)) {
    const digit = character.charCodeAt(0) - 48;
    out += digit >= 0 && digit <= 9 ? devanagariDigits[digit] : character;
  }
  return out;
}

// The inverse, used by tests and by anything that has to parse back.
export function toLatin(text) {
  let out = '';
  for (const character of String(text)) {
    const digit = devanagariDigits.indexOf(character);
    out += digit === -1 ? character : String(digit);
  }
  return out;
}
