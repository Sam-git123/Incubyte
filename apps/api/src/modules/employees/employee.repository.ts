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

export type EmployeeListRecord = CreateEmployeeInput & {
  id: string;
  currentSalary: {
    amountMinor: number;
    currency: string;
    effectiveFrom: Date;
  } | null;
};

export type EmployeePage = {
  employees: EmployeeListRecord[];
  total: number;
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

  async listPage(
    offset: number,
    limit: number,
    asOf: Date,
  ): Promise<EmployeePage> {
    const [total, employees] = await this.prisma.$transaction([
      this.prisma.employee.count(),
      this.prisma.employee.findMany({
        skip: offset,
        take: limit,
        orderBy: { employeeCode: 'asc' },
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          lastName: true,
          email: true,
          countryCode: true,
          department: true,
          jobTitle: true,
          salaryRecords: {
            where: { effectiveFrom: { lte: asOf } },
            orderBy: [
              { effectiveFrom: 'desc' },
              { createdAt: 'desc' },
              { id: 'desc' },
            ],
            take: 1,
            select: {
              amountMinor: true,
              currency: true,
              effectiveFrom: true,
            },
          },
        },
      }),
    ]);

    return {
      total,
      employees: employees.map(({ salaryRecords, ...employee }) => ({
        ...employee,
        currentSalary: salaryRecords[0] ?? null,
      })),
    };
  }
}
