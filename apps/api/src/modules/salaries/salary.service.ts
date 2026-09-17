import type {
  CreateSalaryRequest,
  CreateSalaryResponse,
} from '@acme/contracts';

import { createSalary, getCurrencyForCountry } from './salary.js';
import {
  hasPrismaErrorCode,
  type SalaryRepository,
} from './salary.repository.js';

export class EmployeeNotFoundError extends Error {
  override readonly name = 'EmployeeNotFoundError';
}

export class SalaryCurrencyMismatchError extends Error {
  override readonly name = 'SalaryCurrencyMismatchError';
}

export class SalaryEffectiveDateConflictError extends Error {
  override readonly name = 'SalaryEffectiveDateConflictError';
}

export class SalaryService {
  constructor(private readonly salaryRepository: SalaryRepository) {}

  async create(
    employeeId: string,
    input: CreateSalaryRequest,
  ): Promise<CreateSalaryResponse> {
    const employee =
      await this.salaryRepository.findEmployeeContext(employeeId);

    if (!employee) {
      throw new EmployeeNotFoundError('Employee not found.');
    }

    const salary = createSalary(input);
    const expectedCurrency =
      employee.establishedCurrency ??
      getCurrencyForCountry(employee.countryCode);

    if (!expectedCurrency) {
      throw new Error(
        `No salary currency is configured for country ${employee.countryCode}.`,
      );
    }

    if (salary.currency !== expectedCurrency) {
      throw new SalaryCurrencyMismatchError(
        `Salary currency must be ${expectedCurrency}.`,
      );
    }

    const effectiveFrom = new Date(`${input.effectiveFrom}T00:00:00.000Z`);

    if (
      await this.salaryRepository.hasEffectiveDate(employeeId, effectiveFrom)
    ) {
      throw duplicateEffectiveDateError();
    }

    try {
      const created = await this.salaryRepository.create(
        employeeId,
        salary,
        effectiveFrom,
      );

      return {
        salary: {
          ...created,
          effectiveFrom: created.effectiveFrom.toISOString(),
          createdAt: created.createdAt.toISOString(),
        },
      };
    } catch (error) {
      if (hasPrismaErrorCode(error, 'P2002')) {
        throw duplicateEffectiveDateError();
      }

      if (hasPrismaErrorCode(error, 'P2003')) {
        throw new EmployeeNotFoundError('Employee not found.');
      }

      throw error;
    }
  }
}

function duplicateEffectiveDateError() {
  return new SalaryEffectiveDateConflictError(
    'A salary record already exists for this effective date.',
  );
}
