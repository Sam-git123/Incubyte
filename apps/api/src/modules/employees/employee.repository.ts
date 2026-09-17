import type { PrismaClient } from '../../generated/prisma/client.js';
import type { Salary } from '../salaries/salary.js';

export type CreateEmployeeInput = {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  department: string;
  jobTitle: string;
};

export class EmployeeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(input: CreateEmployeeInput) {
    return this.prisma.employee.create({ data: input });
  }

  findById(id: string) {
    return this.prisma.employee.findUnique({ where: { id } });
  }

  createSalaryRecord(employeeId: string, salary: Salary, effectiveFrom: Date) {
    return this.prisma.salaryRecord.create({
      data: {
        employeeId,
        amountMinor: salary.amountMinor,
        currency: salary.currency,
        effectiveFrom,
      },
    });
  }

  findSalaryHistory(employeeId: string) {
    return this.prisma.salaryRecord.findMany({
      where: { employeeId },
      orderBy: { effectiveFrom: 'desc' },
    });
  }
}
