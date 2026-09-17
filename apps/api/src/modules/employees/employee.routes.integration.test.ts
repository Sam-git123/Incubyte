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
  'employee-list-api.test.db',
);
const asOf = new Date('2026-06-01T12:00:00.000Z');

describe('GET /api/employees', () => {
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

  it('uses the default page and page size', async () => {
    await createEmployees(prisma, 26);

    const response = await app.inject({ method: 'GET', url: '/api/employees' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: expect.arrayContaining([
        {
          id: expect.any(String),
          employeeCode: 'EMP000001',
          firstName: 'First1',
          lastName: 'Last1',
          email: 'employee1@example.com',
          countryCode: 'IN',
          department: 'Engineering',
          jobTitle: 'Software Engineer',
          currentSalary: null,
        },
      ]),
      pagination: {
        page: 1,
        pageSize: 25,
        total: 26,
        totalPages: 2,
      },
    });
    expect(response.json().data).toHaveLength(25);
  });

  it('returns the requested page using database pagination', async () => {
    await createEmployees(prisma, 25);

    const response = await app.inject({
      method: 'GET',
      url: '/api/employees?page=2&pageSize=10',
    });

    expect(response.statusCode).toBe(200);
    expect(
      response
        .json()
        .data.map(
          (employee: { employeeCode: string }) => employee.employeeCode,
        ),
    ).toEqual([
      'EMP000011',
      'EMP000012',
      'EMP000013',
      'EMP000014',
      'EMP000015',
      'EMP000016',
      'EMP000017',
      'EMP000018',
      'EMP000019',
      'EMP000020',
    ]);
    expect(response.json().pagination).toEqual({
      page: 2,
      pageSize: 10,
      total: 25,
      totalPages: 3,
    });
  });

  it('orders employees by employee code ascending', async () => {
    await prisma.employee.createMany({
      data: [employeeData(3), employeeData(1), employeeData(2)],
    });

    const response = await app.inject({ method: 'GET', url: '/api/employees' });

    expect(response.statusCode).toBe(200);
    expect(
      response
        .json()
        .data.map(
          (employee: { employeeCode: string }) => employee.employeeCode,
        ),
    ).toEqual(['EMP000001', 'EMP000002', 'EMP000003']);
  });

  it('returns an empty page when a valid page is out of range', async () => {
    await createEmployees(prisma, 3);

    const response = await app.inject({
      method: 'GET',
      url: '/api/employees?page=10&pageSize=2',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: [],
      pagination: {
        page: 10,
        pageSize: 2,
        total: 3,
        totalPages: 2,
      },
    });
  });

  it('returns zero totals for an empty database', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/employees' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: [],
      pagination: {
        page: 1,
        pageSize: 25,
        total: 0,
        totalPages: 0,
      },
    });
  });

  it.each(['0', '-1', 'abc', '1.5'])(
    'rejects invalid page value %s',
    async (page) => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/employees?page=${page}`,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid pagination parameters.',
        },
      });
    },
  );

  it.each(['0', '101', 'abc', '1.5'])(
    'rejects invalid pageSize value %s',
    async (pageSize) => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/employees?pageSize=${pageSize}`,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid pagination parameters.',
        },
      });
    },
  );

  it('rejects query parameters outside this phase', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/employees?search=Ava',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid pagination parameters.',
      },
    });
  });

  it('selects the latest salary effective at the controlled current time', async () => {
    const employee = await prisma.employee.create({ data: employeeData(1) });
    await prisma.salaryRecord.createMany({
      data: [
        salaryData(employee.id, 10_000_000, '2025-01-01T00:00:00.000Z'),
        salaryData(employee.id, 11_000_000, '2026-01-01T00:00:00.000Z'),
      ],
    });

    const response = await app.inject({ method: 'GET', url: '/api/employees' });

    expect(response.statusCode).toBe(200);
    expect(response.json().data[0].currentSalary).toEqual({
      amountMinor: 11_000_000,
      currency: 'USD',
      effectiveFrom: '2026-01-01T00:00:00.000Z',
    });
  });

  it('does not treat a future salary as current', async () => {
    const employee = await prisma.employee.create({ data: employeeData(1) });
    await prisma.salaryRecord.createMany({
      data: [
        salaryData(employee.id, 11_000_000, '2026-01-01T00:00:00.000Z'),
        salaryData(employee.id, 12_000_000, '2027-01-01T00:00:00.000Z'),
      ],
    });

    const response = await app.inject({ method: 'GET', url: '/api/employees' });

    expect(response.statusCode).toBe(200);
    expect(response.json().data[0].currentSalary).toEqual({
      amountMinor: 11_000_000,
      currency: 'USD',
      effectiveFrom: '2026-01-01T00:00:00.000Z',
    });
  });

  it('returns null when an employee has no currently-effective salary', async () => {
    const employee = await prisma.employee.create({ data: employeeData(1) });
    await prisma.salaryRecord.create({
      data: salaryData(employee.id, 12_000_000, '2027-01-01T00:00:00.000Z'),
    });

    const response = await app.inject({ method: 'GET', url: '/api/employees' });

    expect(response.statusCode).toBe(200);
    expect(response.json().data[0].currentSalary).toBeNull();
  });
});

function createEmployees(prisma: PrismaClient, count: number) {
  return prisma.employee.createMany({
    data: Array.from({ length: count }, (_, index) => employeeData(index + 1)),
  });
}

function employeeData(index: number) {
  const suffix = index.toString().padStart(6, '0');

  return {
    employeeCode: `EMP${suffix}`,
    firstName: `First${index}`,
    lastName: `Last${index}`,
    email: `employee${index}@example.com`,
    countryCode: 'IN',
    department: 'Engineering',
    jobTitle: 'Software Engineer',
  };
}

function salaryData(
  employeeId: string,
  amountMinor: number,
  effectiveFrom: string,
) {
  return {
    employeeId,
    amountMinor,
    currency: 'USD',
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
