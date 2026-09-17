import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createPrismaClient } from '../../db/prisma.js';
import type { PrismaClient } from '../../generated/prisma/client.js';
import { createSalary } from '../salaries/salary.js';
import { EmployeeRepository } from './employee.repository.js';

const employeeInput = {
  employeeCode: 'ACME-0001',
  firstName: 'Avery',
  lastName: 'Morgan',
  email: 'avery.morgan@example.com',
  countryCode: 'US',
  department: 'Engineering',
  jobTitle: 'Software Engineer',
};
const apiDirectory = fileURLToPath(new URL('../../../', import.meta.url));
const testDatabasePath = join(apiDirectory, 'prisma', 'test.db');

describe('EmployeeRepository persistence', () => {
  let prisma: PrismaClient;
  let repository: EmployeeRepository;

  beforeAll(() => {
    rmSync(testDatabasePath, { force: true });
    const databaseUrl = `file:${testDatabasePath.replaceAll('\\', '/')}`;

    applyMigrations(databaseUrl);
    prisma = createPrismaClient(databaseUrl);
    repository = new EmployeeRepository(prisma);
  });

  beforeEach(async () => {
    await prisma.salaryRecord.deleteMany();
    await prisma.employee.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates and retrieves an employee', async () => {
    const created = await repository.create(employeeInput);

    const found = await repository.findById(created.id);

    expect(found).toMatchObject(employeeInput);
    expect(found?.id).toBe(created.id);
  });

  it('enforces unique employee codes', async () => {
    await repository.create(employeeInput);

    await expect(
      repository.create({
        ...employeeInput,
        email: 'another.employee@example.com',
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('enforces unique employee emails', async () => {
    await repository.create(employeeInput);

    await expect(
      repository.create({
        ...employeeInput,
        employeeCode: 'ACME-0002',
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('stores multiple salary records in newest-effective-date order', async () => {
    const employee = await repository.create(employeeInput);
    const earlierSalary = createSalary({
      amountMinor: 12_500_000,
      currency: 'USD',
    });
    const futureSalary = createSalary({
      amountMinor: 13_250_000,
      currency: 'USD',
    });

    await repository.createSalaryRecord(
      employee.id,
      futureSalary,
      new Date('2027-01-01T00:00:00.000Z'),
    );
    await repository.createSalaryRecord(
      employee.id,
      earlierSalary,
      new Date('2026-01-01T00:00:00.000Z'),
    );

    const history = await repository.findSalaryHistory(employee.id);

    expect(history).toHaveLength(2);
    expect(history.map(({ amountMinor }) => amountMinor)).toEqual([
      13_250_000, 12_500_000,
    ]);
    expect(
      history.map(({ effectiveFrom }) => effectiveFrom.toISOString()),
    ).toEqual(['2027-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z']);
  });

  it('rejects a salary record for an unknown employee', async () => {
    const salary = createSalary({ amountMinor: 12_500_000, currency: 'USD' });

    await expect(
      repository.createSalaryRecord(
        'missing-employee',
        salary,
        new Date('2026-01-01T00:00:00.000Z'),
      ),
    ).rejects.toMatchObject({ code: 'P2003' });
  });

  it('removes salary records when their employee is deleted', async () => {
    const employee = await repository.create(employeeInput);
    const salary = createSalary({ amountMinor: 12_500_000, currency: 'USD' });
    await repository.createSalaryRecord(
      employee.id,
      salary,
      new Date('2026-01-01T00:00:00.000Z'),
    );

    await prisma.employee.delete({ where: { id: employee.id } });

    await expect(prisma.salaryRecord.count()).resolves.toBe(0);
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
