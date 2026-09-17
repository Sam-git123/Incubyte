import type { PrismaClient } from '../../generated/prisma/client.js';

export type AnalyticsQuery = {
  asOf: Date;
  country?: string | undefined;
  department?: string | undefined;
};

export type CurrentEmployeeCompensation = {
  countryCode: string;
  department: string;
  currentSalary: {
    amountMinor: number;
    currency: string;
  } | null;
};

export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findCurrentCompensation({
    asOf,
    country,
    department,
  }: AnalyticsQuery): Promise<CurrentEmployeeCompensation[]> {
    const employees = await this.prisma.employee.findMany({
      where: {
        ...(country ? { countryCode: country } : {}),
        ...(department ? { department } : {}),
      },
      select: {
        countryCode: true,
        department: true,
        salaryRecords: {
          where: { effectiveFrom: { lte: asOf } },
          orderBy: [
            { effectiveFrom: 'desc' },
            { createdAt: 'desc' },
            { id: 'desc' },
          ],
          take: 1,
          select: { amountMinor: true, currency: true },
        },
      },
    });

    return employees.map(({ salaryRecords, ...employee }) => ({
      ...employee,
      currentSalary: salaryRecords[0] ?? null,
    }));
  }
}
