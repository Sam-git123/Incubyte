import { describe, expect, it } from 'vitest';

import { formatMoney, formatSalary } from './salary-format';

describe('salary formatting', () => {
  it.each([
    [12_500_000, 'USD', '$125,000.00'],
    [30_000_000, 'AED', 'AED 300,000.00'],
    [45_000_000, 'INR', '₹450,000.00'],
  ])('formats %i minor units in %s', (amountMinor, currency, expected) => {
    expect(normalizeSpaces(formatMoney(amountMinor, currency))).toBe(expected);
  });

  it('uses the established label when salary is absent', () => {
    expect(formatSalary(null)).toBe('Not set');
  });
});

function normalizeSpaces(value: string): string {
  return value.replace(/\u00a0/g, ' ');
}
