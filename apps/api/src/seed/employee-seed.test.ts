import { describe, expect, it } from 'vitest';

import {
  createSalary,
  type SupportedCurrency,
} from '../modules/salaries/salary.js';
import {
  COUNTRIES,
  DATA_SEED,
  DEPARTMENTS,
  generateEmployees,
} from './employee-seed.js';

describe('deterministic employee seed generation', () => {
  it('produces the same logical employees for the same seed', () => {
    const firstRun = generateEmployees({ count: 25, seed: DATA_SEED });
    const secondRun = generateEmployees({ count: 25, seed: DATA_SEED });

    expect(secondRun).toEqual(firstRun);
  });

  it('creates predictable employee codes and unique fictional emails', () => {
    const generated = generateEmployees({ count: 50, seed: DATA_SEED });
    const emails = generated.map(({ employee }) => employee.email);

    expect(generated[0]?.employee.employeeCode).toBe('EMP000001');
    expect(generated[49]?.employee.employeeCode).toBe('EMP000050');
    expect(new Set(emails).size).toBe(50);
    expect(emails.every((email) => email.endsWith('@acme.example'))).toBe(true);
  });

  it('uses the configured currency for each employee country', () => {
    const generated = generateEmployees({ count: 250, seed: DATA_SEED });
    const currencyByCountry = new Map<string, SupportedCurrency>(
      COUNTRIES.map(({ code, currency }) => [code, currency]),
    );

    for (const { employee, salaries } of generated) {
      expect(salaries.length).toBeGreaterThanOrEqual(1);
      expect(
        salaries.every(
          ({ currency }) =>
            currency === currencyByCountry.get(employee.countryCode),
        ),
      ).toBe(true);
    }
  });

  it('assigns only job titles configured for the employee department', () => {
    const generated = generateEmployees({ count: 250, seed: DATA_SEED });
    const titlesByDepartment = new Map<string, ReadonlySet<string>>(
      DEPARTMENTS.map(({ name, jobs }) => [
        name,
        new Set<string>(jobs.map(({ title }) => title)),
      ]),
    );

    for (const { employee } of generated) {
      expect(
        titlesByDepartment.get(employee.department)?.has(employee.jobTitle),
      ).toBe(true);
    }
  });

  it('generates valid integer minor-unit salaries', () => {
    const generated = generateEmployees({ count: 250, seed: DATA_SEED });

    for (const { salaries } of generated) {
      for (const salary of salaries) {
        expect(Number.isInteger(salary.amountMinor)).toBe(true);
        expect(() =>
          createSalary({
            amountMinor: salary.amountMinor,
            currency: salary.currency,
          }),
        ).not.toThrow();
      }
    }
  });

  it('creates chronological, nondecreasing salary history with fixed dates', () => {
    const generated = generateEmployees({ count: 250, seed: DATA_SEED });
    const latestAllowedDate = new Date('2026-01-01T00:00:00.000Z');

    expect(generated.some(({ salaries }) => salaries.length > 1)).toBe(true);

    for (const { salaries } of generated) {
      for (let index = 0; index < salaries.length; index += 1) {
        const salary = salaries[index];
        const previousSalary = salaries[index - 1];

        expect(salary?.effectiveFrom.getTime()).toBeLessThanOrEqual(
          latestAllowedDate.getTime(),
        );

        if (salary && previousSalary) {
          expect(salary.effectiveFrom.getTime()).toBeGreaterThan(
            previousSalary.effectiveFrom.getTime(),
          );
          expect(salary.amountMinor).toBeGreaterThanOrEqual(
            previousSalary.amountMinor,
          );
        }
      }
    }
  });
});
