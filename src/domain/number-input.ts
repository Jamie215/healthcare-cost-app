/**
 * Helpers for typed amounts (dollars and cents) and hours, kept exact by working in whole
 * hundredths: 12.50 dollars is 1250 cents, 1.5 hours is 150 hundredths of an hour.
 *
 * Phones choose the decimal key on the number keypad from the phone's language settings:
 * a point in English, a comma in French and many other languages. The app cannot force a
 * point, so we accept either and turn a comma into a point as it is typed.
 */

/**
 * Cleans text while it is being typed, so only a valid number can appear in the field:
 * digits, one decimal point, and at most `maxDecimals` digits after it. A typed comma
 * becomes a point. Letters, "$", spaces and minus signs are dropped.
 *
 * Pasted text such as "$1,234.56" or "1,234,567" uses commas to group thousands; when the
 * text has a point or more than one comma, its commas are removed instead.
 */
export function sanitizeDecimalInput(text: string, maxDecimals = 2): string {
  const commas = (text.match(/,/g) ?? []).length;
  const commasGroupThousands = text.includes('.') || commas > 1;
  const s = (commasGroupThousands ? text.replace(/,/g, '') : text.replace(/,/g, '.')).replace(
    /[^\d.]/g,
    '',
  );
  const point = s.indexOf('.');
  if (point === -1) return s;
  const fraction = s
    .slice(point + 1)
    .replace(/\./g, '')
    .slice(0, maxDecimals);
  return `${s.slice(0, point)}.${fraction}`;
}

/**
 * Reads "12.50", "12,5", "12." or ".5" as a whole number of hundredths (1250, 1250, 1200,
 * 50). Returns null for empty or invalid text, so an empty answer never becomes zero.
 * Reads the digits directly instead of multiplying by 100, which could round wrongly.
 */
export function parseHundredths(text: string): number | null {
  const match = /^(\d*)(?:[.,](\d{0,2}))?$/.exec(text.trim());
  if (!match) return null;
  const [, whole = '', fraction = ''] = match;
  if (whole === '' && fraction === '') return null;
  const value = Number(whole || '0') * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(value) ? value : null;
}

/**
 * Above this amount, the cost field asks the participant to double-check. It never blocks
 * saving. PLACEHOLDER: $10,000 until the study team sets the threshold.
 */
export const LARGE_AMOUNT_CENTS = 10_000_00;

/** Formats hundredths for a text field with exactly two decimals: 1250 → "12.50". */
export function formatHundredths(value: number): string {
  return `${Math.floor(value / 100)}.${String(value % 100).padStart(2, '0')}`;
}
