import { describe, expect, it } from 'vitest';

import { calculateMedian } from './statistics.js';

describe('calculateMedian', () => {
  it('returns the middle value for an odd number of salaries', () => {
    expect(calculateMedian([300, 100, 200])).toBe(200);
  });

  it('returns the rounded midpoint for an even number of salaries', () => {
    expect(calculateMedian([400, 100, 300, 200])).toBe(250);
    expect(calculateMedian([100, 201])).toBe(151);
  });

  it('returns the value for a single salary', () => {
    expect(calculateMedian([12_500_000])).toBe(12_500_000);
  });

  it('returns null for no salary values', () => {
    expect(calculateMedian([])).toBeNull();
  });

  it('does not mutate an already sorted or unsorted input', () => {
    const values = [300, 100, 200];

    calculateMedian(values);

    expect(values).toEqual([300, 100, 200]);
  });

  it('handles large integer minor-unit values', () => {
    expect(calculateMedian([2_000_000_000, 2_000_000_001])).toBe(2_000_000_001);
  });
});
