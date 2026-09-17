import type { PrismaClient } from '../../generated/prisma/client.js';
import type { Salary } from './salary.js';

export type EmployeeSalaryContext = {
  countryCode: string;
  establishedCurrency: string | null;
};

export class SalaryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findEmployeeContext(
    employeeId: string,
  ): Promise<EmployeeSalaryContext | null> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        countryCode: true,
        salaryRecords: {
          orderBy: [
            { effectiveFrom: 'desc' },
            { createdAt: 'desc' },
            { id: 'desc' },
          ],
          take: 1,
          select: { currency: true },
        },
      },
    });

    if (!employee) {
      return null;
    }

    return {
      countryCode: employee.countryCode,
      establishedCurrency: employee.salaryRecords[0]?.currency ?? null,
    };
  }

  async hasEffectiveDate(employeeId: string, effectiveFrom: Date) {
    const record = await this.prisma.salaryRecord.findUnique({
      where: {
        employeeId_effectiveFrom: { employeeId, effectiveFrom },
      },
      select: { id: true },
    });

    return Boolean(record);
  }

  create(employeeId: string, salary: Salary, effectiveFrom: Date) {
    return this.prisma.salaryRecord.create({
      data: {
        employeeId,
        amountMinor: salary.amountMinor,
        currency: salary.currency,
        effectiveFrom,
      },
      select: {
        id: true,
        amountMinor: true,
        currency: true,
        effectiveFrom: true,
        createdAt: true,
      },
    });
  }
}

export function hasPrismaErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}
