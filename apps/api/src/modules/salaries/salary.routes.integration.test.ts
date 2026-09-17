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
const testDatabasePath = join(apiDirectory, 'prisma', 'salary-api.test.db');

describe('POST /api/employees/:employeeId/salaries', () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;
  let currentTime: Date;

  beforeAll(async () => {
    rmSync(testDatabasePath, { force: true });
    const databaseUrl = `file:${testDatabasePath.replaceAll('\\', '/')}`;

    applyMigrations(databaseUrl);
    prisma = createPrismaClient(databaseUrl);
    currentTime = new Date('2026-09-17T12:00:00.000Z');
    app = buildApp({}, { prisma, now: () => currentTime });
    await app.ready();
  });

  beforeEach(async () => {
    currentTime = new Date('2026-09-17T12:00:00.000Z');
    await prisma.salaryRecord.deleteMany();
    await prisma.employee.deleteMany();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('creates a new salary record', async () => {
    const employee = await createEmployee(prisma);

    const response = await createSalary(app, employee.id, {
      amountMinor: 30_000_000,
      currency: 'AED',
      effectiveFrom: '2026-10-01',
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      salary: {
        id: expect.any(String),
        amountMinor: 30_000_000,
        currency: 'AED',
        effectiveFrom: '2026-10-01T00:00:00.000Z',
        createdAt: expect.any(String),
      },
    });
    await expect(
      prisma.salaryRecord.findFirst({
        where: { employeeId: employee.id, amountMinor: 30_000_000 },
      }),
    ).resolves.toMatchObject({ currency: 'AED' });
  });

  it('preserves previous salary records and returns history newest first', async () => {
    const employee = await createEmployee(prisma);
    await prisma.salaryRecord.createMany({
      data: [
        salaryData(employee.id, 25_000_000, '2025-01-01'),
        salaryData(employee.id, 28_000_000, '2026-01-01'),
      ],
    });

    await createSalary(app, employee.id, {
      amountMinor: 30_000_000,
      currency: 'AED',
      effectiveFrom: '2026-10-01',
    });
    const details = await app.inject({
      method: 'GET',
      url: `/api/employees/${employee.id}`,
    });

    expect(details.statusCode).toBe(200);
    expect(
      details
        .json()
        .salaryHistory.map(
          (salary: { amountMinor: number }) => salary.amountMinor,
        ),
    ).toEqual([30_000_000, 28_000_000, 25_000_000]);
  });

  it('makes an immediately-effective salary current', async () => {
    const employee = await createEmployeeWithCurrentSalary(prisma);

    await createSalary(app, employee.id, {
      amountMinor: 30_000_000,
      currency: 'AED',
      effectiveFrom: '2026-09-17',
    });
    const details = await getEmployee(app, employee.id);

    expect(details.currentSalary).toEqual({
      amountMinor: 30_000_000,
      currency: 'AED',
      effectiveFrom: '2026-09-17T00:00:00.000Z',
    });
  });

  it('does not make a future salary current before its effective date', async () => {
    const employee = await createEmployeeWithCurrentSalary(prisma);

    await createSalary(app, employee.id, {
      amountMinor: 30_000_000,
      currency: 'AED',
      effectiveFrom: '2026-10-01',
    });
    const details = await getEmployee(app, employee.id);

    expect(details.currentSalary.amountMinor).toBe(28_000_000);
    expect(details.salaryHistory[0]).toEqual(
      expect.objectContaining({
        amountMinor: 30_000_000,
        effectiveFrom: '2026-10-01T00:00:00.000Z',
      }),
    );
  });

  it('makes a future salary current after its effective date', async () => {
    const employee = await createEmployeeWithCurrentSalary(prisma);
    await createSalary(app, employee.id, {
      amountMinor: 30_000_000,
      currency: 'AED',
      effectiveFrom: '2026-10-01',
    });

    currentTime = new Date('2026-10-02T12:00:00.000Z');
    const details = await getEmployee(app, employee.id);

    expect(details.currentSalary.amountMinor).toBe(30_000_000);
  });

  it('allows an unambiguous past effective date', async () => {
    const employee = await createEmployeeWithCurrentSalary(prisma);

    const response = await createSalary(app, employee.id, {
      amountMinor: 26_000_000,
      currency: 'AED',
      effectiveFrom: '2025-07-01',
    });

    expect(response.statusCode).toBe(201);
  });

  it.each([
    [0, 'Salary amount must be greater than zero.'],
    [-1, 'Salary amount must be greater than zero.'],
    [30_000_000.5, 'Salary amount must be an integer.'],
  ])('rejects invalid amountMinor %s', async (amountMinor, message) => {
    const employee = await createEmployee(prisma);

    const response = await createSalary(app, employee.id, {
      amountMinor,
      currency: 'AED',
      effectiveFrom: '2026-10-01',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: { code: 'INVALID_SALARY', message },
    });
  });

  it('rejects an unsupported currency', async () => {
    const employee = await createEmployee(prisma);

    const response = await createSalary(app, employee.id, {
      amountMinor: 30_000_000,
      currency: 'XYZ',
      effectiveFrom: '2026-10-01',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: 'UNSUPPORTED_CURRENCY',
        message: 'Unsupported currency: XYZ.',
      },
    });
  });

  it('rejects a currency that differs from the employee salary currency', async () => {
    const employee = await createEmployeeWithCurrentSalary(prisma);

    const response = await createSalary(app, employee.id, {
      amountMinor: 30_000_000,
      currency: 'USD',
      effectiveFrom: '2026-10-01',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: 'INVALID_SALARY',
        message: 'Salary currency must be AED.',
      },
    });
  });

  it('derives the expected currency from country when salary history is empty', async () => {
    const employee = await createEmployee(prisma);

    const response = await createSalary(app, employee.id, {
      amountMinor: 30_000_000,
      currency: 'USD',
      effectiveFrom: '2026-10-01',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: 'INVALID_SALARY',
        message: 'Salary currency must be AED.',
      },
    });
  });

  it.each(['not-a-date', '2026-02-30', '2026-10-01T12:00:00.000Z'])(
    'rejects invalid effective date %s',
    async (effectiveFrom) => {
      const employee = await createEmployee(prisma);

      const response = await createSalary(app, employee.id, {
        amountMinor: 30_000_000,
        currency: 'AED',
        effectiveFrom,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid salary request.',
        },
      });
    },
  );

  it('rejects a malformed request body', async () => {
    const employee = await createEmployee(prisma);

    const response = await app.inject({
      method: 'POST',
      url: `/api/employees/${employee.id}/salaries`,
      payload: { amountMinor: '30000000', currency: 'AED' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid salary request.',
      },
    });
  });

  it('returns not found for an unknown employee', async () => {
    const response = await createSalary(app, 'missing-employee', {
      amountMinor: 30_000_000,
      currency: 'AED',
      effectiveFrom: '2026-10-01',
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: {
        code: 'EMPLOYEE_NOT_FOUND',
        message: 'Employee not found.',
      },
    });
  });

  it('rejects a duplicate effective date without adding history', async () => {
    const employee = await createEmployeeWithCurrentSalary(prisma);

    const response = await createSalary(app, employee.id, {
      amountMinor: 30_000_000,
      currency: 'AED',
      effectiveFrom: '2026-01-01',
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      error: {
        code: 'SALARY_EFFECTIVE_DATE_CONFLICT',
        message: 'A salary record already exists for this effective date.',
      },
    });
    await expect(
      prisma.salaryRecord.count({ where: { employeeId: employee.id } }),
    ).resolves.toBe(1);
  });

  it('protects against concurrent duplicate submissions', async () => {
    const employee = await createEmployee(prisma);
    const payload = {
      amountMinor: 30_000_000,
      currency: 'AED',
      effectiveFrom: '2026-10-01',
    };

    const responses = await Promise.all([
      createSalary(app, employee.id, payload),
      createSalary(app, employee.id, payload),
    ]);

    expect(responses.map(({ statusCode }) => statusCode).sort()).toEqual([
      201, 409,
    ]);
    await expect(
      prisma.salaryRecord.count({ where: { employeeId: employee.id } }),
    ).resolves.toBe(1);
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

async function createEmployeeWithCurrentSalary(prisma: PrismaClient) {
  const employee = await createEmployee(prisma);
  await prisma.salaryRecord.create({
    data: salaryData(employee.id, 28_000_000, '2026-01-01'),
  });
  return employee;
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
    effectiveFrom: new Date(`${effectiveFrom}T00:00:00.000Z`),
  };
}

function createSalary(
  app: FastifyInstance,
  employeeId: string,
  payload: {
    amountMinor: number;
    currency: string;
    effectiveFrom: string;
  },
) {
  return app.inject({
    method: 'POST',
    url: `/api/employees/${employeeId}/salaries`,
    payload,
  });
}

async function getEmployee(app: FastifyInstance, employeeId: string) {
  const response = await app.inject({
    method: 'GET',
    url: `/api/employees/${employeeId}`,
  });

  expect(response.statusCode).toBe(200);
  return response.json();
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
