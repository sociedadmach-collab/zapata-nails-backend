const {
  normalizeSpanishPhone,
  isValidSpanishMobilePhone
} = require('../src/utils/phone');

describe('phone utils', () => {
  test('normalizes local spanish mobile format', () => {
    expect(normalizeSpanishPhone('612 34 56 78')).toBe('+34612345678');
  });

  test('normalizes number with country code', () => {
    expect(normalizeSpanishPhone('34612345678')).toBe('+34612345678');
  });

  test('normalizes number with 00 prefix', () => {
    expect(normalizeSpanishPhone('0034 612345678')).toBe('+34612345678');
  });

  test('rejects invalid spanish numbers', () => {
    expect(isValidSpanishMobilePhone('+34123456789')).toBe(false);
    expect(isValidSpanishMobilePhone('+34612345678')).toBe(true);
  });
});
