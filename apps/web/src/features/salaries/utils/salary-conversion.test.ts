import { describe, expect, it } from 'vitest';

import { majorUnitsToMinor, minorUnitsToMajor } from './salary-conversion';

describe('salary unit conversion', () => {
  it.each([
    ['300000', 30_000_000],
    ['300000.50', 30_000_050],
    ['0.01', 1],
  ])('converts %s major units to %s minor units', (major, minor) => {
    expect(majorUnitsToMinor(major)).toBe(minor);
  });

  it('rejects values with more than two decimal places', () => {
    expect(majorUnitsToMinor('300000.501')).toBeNull();
  });

  it.each([
    [30_000_000, '300000.00'],
    [30_000_050, '300000.50'],
    [1, '0.01'],
  ])('converts %s minor units to %s major units', (minor, major) => {
    expect(minorUnitsToMajor(minor)).toBe(major);
  });
});
