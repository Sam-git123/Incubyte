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
  'analytics-groups.test.db',
);
const asOf = new Date('2026-09-17T12:00:00.000Z');

describe('grouped compensation analytics', () => {
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
    await createGroupedFixture(prisma);
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  describe('GET /api/analytics/departments', () => {
    it('groups headcount and compensation by department and currency', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/analytics/departments',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        data: [
          {
            department: 'Engineering',
            headcount: 4,
            employeesWithSalary: 3,
            employeesWithoutSalary: 1,
            compensationByCurrency: [
              metric('AED', 1, 500, 500, 500, 500),
              metric('USD', 2, 150, 150, 100, 200),
            ],
          },
          {
            department: 'Sales',
            headcount: 3,
            employeesWithSalary: 2,
            employeesWithoutSalary: 1,
            compensationByCurrency: [
              metric('INR', 1, 700, 700, 700, 700),
              metric('USD', 1, 301, 301, 301, 301),
            ],
          },
        ],
      });
    });

    it('filters departments by normalized country', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/analytics/departments?country=us',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data).toEqual([
        expect.objectContaining({
          department: 'Engineering',
          headcount: 3,
          employeesWithSalary: 2,
          employeesWithoutSalary: 1,
        }),
        expect.objectContaining({
          department: 'Sales',
          headcount: 1,
          employeesWithSalary: 1,
          employeesWithoutSalary: 0,
        }),
      ]);
    });

    it('returns an empty data array when no departments match', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/analytics/departments?country=CA',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ data: [] });
    });

    it.each([
      '/api/analytics/departments?country=USA',
      '/api/analytics/departments?department=Engineering',
    ])('rejects unsupported department query %s', async (url) => {
      const response = await app.inject({ method: 'GET', url });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual(validationError());
    });
  });

  describe('GET /api/analytics/countries', () => {
    it('groups headcount and compensation by country and currency', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/analytics/countries',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        data: [
          {
            countryCode: 'AE',
            headcount: 2,
            employeesWithSalary: 1,
            employeesWithoutSalary: 1,
            compensationByCurrency: [metric('AED', 1, 500, 500, 500, 500)],
          },
          {
            countryCode: 'IN',
            headcount: 1,
            employeesWithSalary: 1,
            employeesWithoutSalary: 0,
            compensationByCurrency: [metric('INR', 1, 700, 700, 700, 700)],
          },
          {
            countryCode: 'US',
            headcount: 4,
            employeesWithSalary: 3,
            employeesWithoutSalary: 1,
            compensationByCurrency: [metric('USD', 3, 200, 200, 100, 301)],
          },
        ],
      });
    });

    it('filters countries by exact trimmed department', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/analytics/countries?department=%20Engineering%20',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().data).toEqual([
        expect.objectContaining({
          countryCode: 'AE',
          headcount: 1,
          employeesWithSalary: 1,
        }),
        expect.objectContaining({
          countryCode: 'US',
          headcount: 3,
          employeesWithSalary: 2,
        }),
      ]);
    });

    it('returns an empty data array when no countries match', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/analytics/countries?department=Finance',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ data: [] });
    });

    it.each([
      '/api/analytics/countries?department=%20%20',
      '/api/analytics/countries?country=US',
    ])('rejects unsupported country query %s', async (url) => {
      const response = await app.inject({ method: 'GET', url });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual(validationError());
    });
  });
});

async function createGroupedFixture(prisma: PrismaClient) {
  await createEmployee(prisma, 1, 'US', 'Engineering', [
    ['2026-01-01', 100, 'USD'],
  ]);
  await createEmployee(prisma, 2, 'US', 'Engineering', [
    ['2026-01-01', 200, 'USD'],
  ]);
  await createEmployee(prisma, 3, 'AE', 'Engineering', [
    ['2026-01-01', 500, 'AED'],
  ]);
  await createEmployee(prisma, 4, 'US', 'Engineering', []);
  await createEmployee(prisma, 5, 'US', 'Sales', [['2026-01-01', 301, 'USD']]);
  await createEmployee(prisma, 6, 'IN', 'Sales', [['2026-01-01', 700, 'INR']]);
  await createEmployee(prisma, 7, 'AE', 'Sales', [['2027-01-01', 800, 'AED']]);
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
      email: `grouped-analytics${index}@example.com`,
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

function metric(
  currency: string,
  employeeCount: number,
  averageSalaryMinor: number,
  medianSalaryMinor: number,
  minSalaryMinor: number,
  maxSalaryMinor: number,
) {
  return {
    currency,
    employeeCount,
    averageSalaryMinor,
    medianSalaryMinor,
    minSalaryMinor,
    maxSalaryMinor,
  };
}

function validationError() {
  return {
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid analytics query parameters.',
    },
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
