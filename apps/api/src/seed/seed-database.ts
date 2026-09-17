import type { PrismaClient } from '../generated/prisma/client.js';
import type { GeneratedEmployee } from './employee-seed.js';

const EMPLOYEE_BATCH_SIZE = 500;
const SALARY_BATCH_SIZE = 1_000;

export type SeedResult = Readonly<{
  employeeCount: number;
  salaryRecordCount: number;
}>;

export async function seedDatabase(
  prisma: PrismaClient,
  generatedEmployees: readonly GeneratedEmployee[],
): Promise<SeedResult> {
  validateSeedData(generatedEmployees);

  const employees = generatedEmployees.map(({ employee }) => employee);
  const salaries = generatedEmployees.flatMap(({ salaries }) => salaries);
  const operations = [
    prisma.salaryRecord.deleteMany(),
    prisma.employee.deleteMany(),
    ...chunks(employees, EMPLOYEE_BATCH_SIZE).map((data) =>
      prisma.employee.createMany({ data }),
    ),
    ...chunks(salaries, SALARY_BATCH_SIZE).map((data) =>
      prisma.salaryRecord.createMany({ data }),
    ),
  ];

  await prisma.$transaction(operations);

  const [employeeCount, salaryRecordCount, employeesWithoutSalary] =
    await Promise.all([
      prisma.employee.count(),
      prisma.salaryRecord.count(),
      prisma.employee.count({ where: { salaryRecords: { none: {} } } }),
    ]);

  if (employeeCount !== employees.length) {
    throw new Error(
      `Seed verification failed: expected ${employees.length} employees, found ${employeeCount}.`,
    );
  }

  if (salaryRecordCount !== salaries.length) {
    throw new Error(
      `Seed verification failed: expected ${salaries.length} salary records, found ${salaryRecordCount}.`,
    );
  }

  if (employeesWithoutSalary !== 0) {
    throw new Error(
      `Seed verification failed: ${employeesWithoutSalary} employees have no salary record.`,
    );
  }

  return { employeeCount, salaryRecordCount };
}

function validateSeedData(
  generatedEmployees: readonly GeneratedEmployee[],
): void {
  const employeeCodes = new Set<string>();
  const emails = new Set<string>();
  const employeeIds = new Set(
    generatedEmployees.map(({ employee }) => employee.id),
  );

  for (const { employee, salaries } of generatedEmployees) {
    if (employeeCodes.has(employee.employeeCode)) {
      throw new Error(`Duplicate employee code: ${employee.employeeCode}.`);
    }

    if (emails.has(employee.email)) {
      throw new Error(`Duplicate employee email: ${employee.email}.`);
    }

    if (salaries.length === 0) {
      throw new Error(
        `Employee ${employee.employeeCode} has no salary record.`,
      );
    }

    employeeCodes.add(employee.employeeCode);
    emails.add(employee.email);

    for (const salary of salaries) {
      if (!employeeIds.has(salary.employeeId)) {
        throw new Error(
          `Salary record ${salary.id} references an unknown employee.`,
        );
      }
    }
  }
}

function chunks<Item>(items: readonly Item[], size: number): Item[][] {
  const result: Item[][] = [];

  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }

  return result;
}
