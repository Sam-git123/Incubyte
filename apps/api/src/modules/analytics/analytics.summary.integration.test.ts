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
  'analytics-summary.test.db',
);
const asOf = new Date('2026-09-17T12:00:00.000Z');

describe('GET /api/analytics/summary', () => {
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

  it('returns headcount and currency-separated current compensation metrics', async () => {
    await createSummaryFixture(prisma);

    const response = await app.inject({
      method: 'GET',
      url: '/api/analytics/summary',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      headcount: 5,
      employeesWithSalary: 3,
      employeesWithoutSalary: 2,
      compensationByCurrency: [
        {
          currency: 'AED',
          employeeCount: 1,
          averageSalaryMinor: 500,
          medianSalaryMinor: 500,
          minSalaryMinor: 500,
          maxSalaryMinor: 500,
        },
        {
          currency: 'USD',
          employeeCount: 2,
          averageSalaryMinor: 251,
          medianSalaryMinor: 251,
          minSalaryMinor: 200,
          maxSalaryMinor: 301,
        },
      ],
    });
    expect(response.json()).not.toHaveProperty('averageSalaryMinor');
    expect(response.json()).not.toHaveProperty('totalPayrollMinor');
  });

  it('uses only the latest effective salary and ignores future history', async () => {
    await createSummaryFixture(prisma);

    const response = await app.inject({
      method: 'GET',
      url: '/api/analytics/summary?country=US&department=Engineering',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      headcount: 2,
      employeesWithSalary: 1,
      employeesWithoutSalary: 1,
      compensationByCurrency: [
        {
          currency: 'USD',
          employeeCount: 1,
          averageSalaryMinor: 200,
          medianSalaryMinor: 200,
          minSalaryMinor: 200,
          maxSalaryMinor: 200,
        },
      ],
    });
  });

  it('normalizes and applies the country filter', async () => {
    await createSummaryFixture(prisma);

    const response = await app.inject({
      method: 'GET',
      url: '/api/analytics/summary?country=us',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      headcount: 3,
      employeesWithSalary: 2,
      employeesWithoutSalary: 1,
    });
    expect(response.json().compensationByCurrency).toHaveLength(1);
    expect(response.json().compensationByCurrency[0].currency).toBe('USD');
  });

  it('applies the exact trimmed department filter', async () => {
    await createSummaryFixture(prisma);

    const response = await app.inject({
      method: 'GET',
      url: '/api/analytics/summary?department=%20Engineering%20',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      headcount: 4,
      employeesWithSalary: 2,
      employeesWithoutSalary: 2,
    });
  });

  it('composes country and department filters with AND semantics', async () => {
    await createSummaryFixture(prisma);

    const response = await app.inject({
      method: 'GET',
      url: '/api/analytics/summary?country=AE&department=Engineering',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      headcount: 1,
      employeesWithSalary: 1,
      employeesWithoutSalary: 0,
    });
    expect(response.json().compensationByCurrency[0].currency).toBe('AED');
  });

  it('returns no salary metrics when matching employees lack current salary', async () => {
    await createSummaryFixture(prisma);

    const response = await app.inject({
      method: 'GET',
      url: '/api/analytics/summary?country=IN',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      headcount: 1,
      employeesWithSalary: 0,
      employeesWithoutSalary: 1,
      compensationByCurrency: [],
    });
  });

  it('returns an empty successful summary when no employees match', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/analytics/summary?country=CA',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      headcount: 0,
      employeesWithSalary: 0,
      employeesWithoutSalary: 0,
      compensationByCurrency: [],
    });
  });

  it.each([
    '/api/analytics/summary?country=USA',
    '/api/analytics/summary?department=%20%20',
    '/api/analytics/summary?unknown=value',
  ])('rejects malformed filters for %s', async (url) => {
    const response = await app.inject({ method: 'GET', url });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid analytics query parameters.',
      },
    });
  });
});

async function createSummaryFixture(prisma: PrismaClient) {
  await createEmployee(prisma, 1, 'US', 'Engineering', [
    ['2025-01-01', 100, 'USD'],
    ['2026-01-01', 200, 'USD'],
    ['2027-01-01', 999, 'USD'],
  ]);
  await createEmployee(prisma, 2, 'US', 'Sales', [['2026-01-01', 301, 'USD']]);
  await createEmployee(prisma, 3, 'AE', 'Engineering', [
    ['2026-01-01', 500, 'AED'],
  ]);
  await createEmployee(prisma, 4, 'IN', 'Engineering', [
    ['2027-01-01', 700, 'INR'],
  ]);
  await createEmployee(prisma, 5, 'US', 'Engineering', []);
}

async function createEmployee(
  prisma: PrismaClient,
  index: number,
  countryCode: string,
  department: string,
  salaries: readonly (readonly [string, number, string])[],
) {
  const suffix = index.toString().padStart(6, '0');
  const employee = await prisma.employee.create({
    data: {
      employeeCode: `EMP${suffix}`,
      firstName: `First${index}`,
      lastName: `Last${index}`,
      email: `analytics${index}@example.com`,
      countryCode,
      department,
      jobTitle: 'Analyst',
    },
  });

  if (salaries.length > 0) {
    await prisma.salaryRecord.createMany({
      data: salaries.map(([effectiveFrom, amountMinor, currency]) => ({
        employeeId: employee.id,
        amountMinor,
        currency,
        effectiveFrom: new Date(`${effectiveFrom}T00:00:00.000Z`),
      })),
    });
  }
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
