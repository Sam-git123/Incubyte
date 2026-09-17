import { describe, expect, it } from 'vitest';

import {
  createSalary,
  type SalaryInput,
  SalaryValidationError,
} from './salary.js';

function expectSalaryValidationError(input: SalaryInput, message: string) {
  let thrownError: unknown;

  try {
    createSalary(input);
  } catch (error) {
    thrownError = error;
  }

  expect(thrownError).toBeInstanceOf(SalaryValidationError);
  expect(thrownError).toMatchObject({
    name: 'SalaryValidationError',
    message,
  });
}

describe('createSalary', () => {
  it('accepts a valid salary', () => {
    const salary = createSalary({ amountMinor: 12_500_000, currency: 'USD' });

    expect(salary).toEqual({ amountMinor: 12_500_000, currency: 'USD' });
    expect(Object.isFrozen(salary)).toBe(true);
  });

  it('rejects a zero amount', () => {
    expectSalaryValidationError(
      { amountMinor: 0, currency: 'USD' },
      'Salary amount must be greater than zero.',
    );
  });

  it('rejects a negative amount', () => {
    expectSalaryValidationError(
      { amountMinor: -1, currency: 'USD' },
      'Salary amount must be greater than zero.',
    );
  });

  it('rejects a fractional minor-unit amount', () => {
    expectSalaryValidationError(
      { amountMinor: 12_500_000.5, currency: 'USD' },
      'Salary amount must be an integer.',
    );
  });

  it('rejects an unsupported currency', () => {
    expectSalaryValidationError(
      { amountMinor: 12_500_000, currency: 'XYZ' },
      'Unsupported currency: XYZ.',
    );
  });

  it.each(['usd', 'US', 'US Dollar'])(
    'rejects invalid currency input: %s',
    (currency) => {
      expectSalaryValidationError(
        { amountMinor: 12_500_000, currency },
        `Unsupported currency: ${currency}.`,
      );
    },
  );
});
