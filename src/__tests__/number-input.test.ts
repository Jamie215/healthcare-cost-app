import { formatHundredths, parseHundredths, sanitizeDecimalInput } from '@/domain/number-input';

describe('sanitizeDecimalInput (while typing)', () => {
  it('turns a typed comma into a point', () => {
    expect(sanitizeDecimalInput('12,')).toBe('12.');
    expect(sanitizeDecimalInput('12,5')).toBe('12.5');
  });

  it('keeps at most two decimals and one point', () => {
    expect(sanitizeDecimalInput('12.505')).toBe('12.50');
    expect(sanitizeDecimalInput('12.5.')).toBe('12.5');
    expect(sanitizeDecimalInput('1.5', 0)).toBe('1.');
  });

  it('drops anything that is not a digit or point', () => {
    expect(sanitizeDecimalInput('$12 CAD')).toBe('12');
    expect(sanitizeDecimalInput('-5')).toBe('5');
    expect(sanitizeDecimalInput('abc')).toBe('');
  });

  it('reads pasted thousands separators as grouping, not decimals', () => {
    expect(sanitizeDecimalInput('$1,234.56')).toBe('1234.56');
    expect(sanitizeDecimalInput('1,234,567')).toBe('1234567');
  });

  it('leaves empty text empty, never zero', () => {
    expect(sanitizeDecimalInput('')).toBe('');
  });
});

describe('parseHundredths', () => {
  it('reads amounts as whole hundredths', () => {
    expect(parseHundredths('12.50')).toBe(1250);
    expect(parseHundredths('12,5')).toBe(1250);
    expect(parseHundredths('12.')).toBe(1200);
    expect(parseHundredths('.5')).toBe(50);
    expect(parseHundredths('0')).toBe(0);
    expect(parseHundredths(' 3 ')).toBe(300);
  });

  it('is exact where multiplying by 100 is not', () => {
    // In plain JavaScript, 1.15 * 100 is 114.99999999999999.
    expect(parseHundredths('1.15')).toBe(115);
    expect(parseHundredths('4.35')).toBe(435);
  });

  it('returns null for empty or invalid text', () => {
    for (const text of ['', ' ', '.', '12.505', '1,000', '-1', '$12', '1.2.3']) {
      expect(parseHundredths(text)).toBeNull();
    }
  });
});

describe('formatHundredths', () => {
  it('shows exactly two decimals', () => {
    expect(formatHundredths(1250)).toBe('12.50');
    expect(formatHundredths(5)).toBe('0.05');
    expect(formatHundredths(0)).toBe('0.00');
  });
});
