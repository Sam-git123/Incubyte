import { createPrismaClient } from '../apps/api/src/db/prisma.js';
import {
  DATA_SEED,
  generateEmployees,
} from '../apps/api/src/seed/employee-seed.js';
import { seedDatabase } from '../apps/api/src/seed/seed-database.js';

const E2E_EMPLOYEE_COUNT = 501;
const REQUIRED_EMPLOYEE_CODES = ['EMP000500', 'EMP000501'];
const prisma = createPrismaClient();

try {
  const employees = generateEmployees({
    count: E2E_EMPLOYEE_COUNT,
    seed: DATA_SEED,
  });
  const employeeCodes = new Set(
    employees.map(({ employee }) => employee.employeeCode),
  );

  for (const employeeCode of REQUIRED_EMPLOYEE_CODES) {
    if (!employeeCodes.has(employeeCode)) {
      throw new Error(`Missing required E2E employee: ${employeeCode}.`);
    }
  }

  const result = await seedDatabase(prisma, employees);
  console.log(
    `Prepared E2E database with ${result.employeeCount} employees and ${result.salaryRecordCount} salary records.`,
  );
} finally {
  await prisma.$disconnect();
}
