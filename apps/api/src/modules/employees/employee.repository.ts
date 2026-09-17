import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
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

export type EmployeeListOptions = {
  offset: number;
  limit: number;
  asOf: Date;
  search?: string | undefined;
  country?: string | undefined;
  department?: string | undefined;
  sortBy: EmployeeOrderField;
  sortOrder: EmployeeSortOrder;
};

export type EmployeeOrderField =
  'employeeCode' | 'firstName' | 'lastName' | 'department' | 'countryCode';

export type EmployeeSortOrder = 'asc' | 'desc';

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

  async listPage({
    offset,
    limit,
    asOf,
    search,
    country,
    department,
    sortBy,
    sortOrder,
  }: EmployeeListOptions): Promise<EmployeePage> {
    const where = buildEmployeeWhere({ search, country, department });
    const [total, employees] = await this.prisma.$transaction([
      this.prisma.employee.count({ where }),
      this.prisma.employee.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: buildEmployeeOrderBy(sortBy, sortOrder),
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

function buildEmployeeOrderBy(
  sortBy: EmployeeOrderField,
  sortOrder: EmployeeSortOrder,
): Prisma.EmployeeOrderByWithRelationInput[] {
  const primaryOrderBy: Record<
    EmployeeOrderField,
    Prisma.EmployeeOrderByWithRelationInput
  > = {
    employeeCode: { employeeCode: sortOrder },
    firstName: { firstName: sortOrder },
    lastName: { lastName: sortOrder },
    department: { department: sortOrder },
    countryCode: { countryCode: sortOrder },
  };
  const orderBy = [primaryOrderBy[sortBy]];

  if (sortBy !== 'employeeCode') {
    orderBy.push({ employeeCode: 'asc' });
  }

  return orderBy;
}

function buildEmployeeWhere({
  search,
  country,
  department,
}: Pick<
  EmployeeListOptions,
  'search' | 'country' | 'department'
>): Prisma.EmployeeWhereInput {
  return {
    ...(country ? { countryCode: country } : {}),
    ...(department ? { department } : {}),
    ...(search
      ? {
          AND: search.split(/\s+/).map((term) => ({
            OR: [
              { firstName: { contains: term } },
              { lastName: { contains: term } },
              { employeeCode: { contains: term } },
            ],
          })),
        }
      : {}),
  };
}
