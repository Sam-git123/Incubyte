import { performance } from 'node:perf_hooks';

import { createPrismaClient } from '../db/prisma.js';
import {
  DATA_SEED,
  EMPLOYEE_COUNT,
  generateEmployees,
} from './employee-seed.js';
import { seedDatabase } from './seed-database.js';

const prisma = createPrismaClient();
const startedAt = performance.now();

try {
  const generatedEmployees = generateEmployees({
    count: EMPLOYEE_COUNT,
    seed: DATA_SEED,
  });
  const result = await seedDatabase(prisma, generatedEmployees);
  const durationSeconds = (performance.now() - startedAt) / 1_000;

  console.log(
    `Seeded ${result.employeeCount} employees and ${result.salaryRecordCount} salary records in ${durationSeconds.toFixed(2)} seconds.`,
  );
} finally {
  await prisma.$disconnect();
}
