import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from '../../app.js';
import { createPrismaClient } from '../../db/prisma.js';
import type { PrismaClient } from '../../generated/prisma/client.js';

const apiDirectory = fileURLToPath(new URL('../../../', import.meta.url));
const testDatabasePath = join(
  apiDirectory,
  'prisma',
  'employee-details-api.test.db',
);
const asOf = new Date('2026-06-01T12:00:00.000Z');

describe('GET /api/employees/:employeeId', () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;

  beforeAll(async () => {
    rmSync(testDatabasePath, { force: true });
    const databaseUrl = `file:${testDatabasePath.replaceAll('\\', '/')}`;

    applyMigrations(databaseUrl);
    prisma = createPrismaClient(databaseUrl);
    app = buildApp({}, { prisma, now: () => asOf });
    await app.ready();
  });

  beforeEach(async () => {
    await prisma.salaryRecord.deleteMany();
    await prisma.employee.deleteMany();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('returns explicit employee details', async () => {
    const employee = await createEmployee(prisma);

    const response = await app.inject({
      method: 'GET',
      url: `/api/employees/${employee.id}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      id: employee.id,
      employeeCode: 'EMP000500',
      firstName: 'Ava',
      lastName: 'Patel',
      email: 'ava.patel.000500@acme.example',
      countryCode: 'AE',
      department: 'Engineering',
      jobTitle: 'Senior Software Engineer',
      currentSalary: null,
      salaryHistory: [],
    });
  });

  it('returns the latest currently-effective salary', async () => {
    const employee = await createEmployee(prisma);
    await prisma.salaryRecord.createMany({
      data: [
        salaryData(employee.id, 27_000_000, '2025-01-01T00:00:00.000Z'),
        salaryData(employee.id, 30_000_000, '2026-01-01T00:00:00.000Z'),
      ],
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/employees/${employee.id}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().currentSalary).toEqual({
      amountMinor: 30_000_000,
      currency: 'AED',
      effectiveFrom: '2026-01-01T00:00:00.000Z',
    });
  });

  it('returns salary history newest effective date first', async () => {
    const employee = await createEmployee(prisma);
    await prisma.salaryRecord.createMany({
      data: [
        salaryData(employee.id, 30_000_000, '2026-01-01T00:00:00.000Z'),
        salaryData(employee.id, 27_000_000, '2025-01-01T00:00:00.000Z'),
        salaryData(employee.id, 33_000_000, '2027-01-01T00:00:00.000Z'),
      ],
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/employees/${employee.id}`,
    });

    expect(
      response
        .json()
        .salaryHistory.map(
          (salary: { effectiveFrom: string }) => salary.effectiveFrom,
        ),
    ).toEqual([
      '2027-01-01T00:00:00.000Z',
      '2026-01-01T00:00:00.000Z',
      '2025-01-01T00:00:00.000Z',
    ]);
    expect(response.json().salaryHistory[0]).toEqual({
      id: expect.any(String),
      amountMinor: 33_000_000,
      currency: 'AED',
      effectiveFrom: '2027-01-01T00:00:00.000Z',
    });
  });

  it('includes future salary history without treating it as current', async () => {
    const employee = await createEmployee(prisma);
    await prisma.salaryRecord.createMany({
      data: [
        salaryData(employee.id, 30_000_000, '2026-01-01T00:00:00.000Z'),
        salaryData(employee.id, 33_000_000, '2027-01-01T00:00:00.000Z'),
      ],
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/employees/${employee.id}`,
    });

    expect(response.json().currentSalary.amountMinor).toBe(30_000_000);
    expect(response.json().salaryHistory[0]).toEqual(
      expect.objectContaining({
        amountMinor: 33_000_000,
        effectiveFrom: '2027-01-01T00:00:00.000Z',
      }),
    );
  });

  it('returns empty salary values for an employee without salary records', async () => {
    const employee = await createEmployee(prisma);

    const response = await app.inject({
      method: 'GET',
      url: `/api/employees/${employee.id}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().currentSalary).toBeNull();
    expect(response.json().salaryHistory).toEqual([]);
  });

  it('returns the public not-found error for an unknown opaque ID', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/employees/not-a-real-employee-id',
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: {
        code: 'EMPLOYEE_NOT_FOUND',
        message: 'Employee not found.',
      },
    });
  });
});

function createEmployee(prisma: PrismaClient) {
  return prisma.employee.create({
    data: {
      employeeCode: 'EMP000500',
      firstName: 'Ava',
      lastName: 'Patel',
      email: 'ava.patel.000500@acme.example',
      countryCode: 'AE',
      department: 'Engineering',
      jobTitle: 'Senior Software Engineer',
    },
  });
}

function salaryData(
  employeeId: string,
  amountMinor: number,
  effectiveFrom: string,
) {
  return {
    employeeId,
    amountMinor,
    currency: 'AED',
    effectiveFrom: new Date(effectiveFrom),
  };
}

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
