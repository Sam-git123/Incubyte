import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createPrismaClient } from '../db/prisma.js';
import type { PrismaClient } from '../generated/prisma/client.js';
import { DATA_SEED, generateEmployees } from './employee-seed.js';
import { seedDatabase } from './seed-database.js';

const apiDirectory = fileURLToPath(new URL('../../', import.meta.url));
const testDatabasePath = join(
  apiDirectory,
  'prisma',
  'seed-integration.test.db',
);

describe('seedDatabase', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    rmSync(testDatabasePath, { force: true });
    const databaseUrl = `file:${testDatabasePath.replaceAll('\\', '/')}`;

    applyMigrations(databaseUrl);
    prisma = createPrismaClient(databaseUrl);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('inserts related records and remains idempotent', async () => {
    const generated = generateEmployees({ count: 25, seed: DATA_SEED });
    const expectedSalaryCount = generated.reduce(
      (total, { salaries }) => total + salaries.length,
      0,
    );

    const firstResult = await seedDatabase(prisma, generated);
    const secondResult = await seedDatabase(prisma, generated);
    const firstEmployee = await prisma.employee.findUnique({
      where: { employeeCode: 'EMP000001' },
      include: { salaryRecords: true },
    });

    expect(firstResult).toEqual({
      employeeCount: 25,
      salaryRecordCount: expectedSalaryCount,
    });
    expect(secondResult).toEqual(firstResult);
    await expect(prisma.employee.count()).resolves.toBe(25);
    await expect(prisma.salaryRecord.count()).resolves.toBe(
      expectedSalaryCount,
    );
    expect(firstEmployee?.salaryRecords.length).toBeGreaterThanOrEqual(1);
    expect(firstEmployee?.email).toMatch(/\.000001@acme\.example$/);
  });
});

function applyMigrations(databaseUrl: string) {
  const schemaPath = join(apiDirectory, 'prisma', 'schema.prisma');
  const prismaCliPath = fileURLToPath(
    import.meta.resolve('prisma/build/index.js'),
  );

  execFileSync(
    process.execPath,
    [prismaCliPath, 'migrate', 'deploy', '--schema', schemaPath],
    {
      cwd: apiDirectory,
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        RUST_LOG: 'info',
      },
      stdio: 'pipe',
    },
  );
}
