import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from '../../app.js';
import { createPrismaClient } from '../../db/prisma.js';
import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';

const apiDirectory = fileURLToPath(new URL('../../../', import.meta.url));
const testDatabasePath = join(
  apiDirectory,
  'prisma',
  'employee-query-api.test.db',
);
const asOf = new Date('2026-06-01T12:00:00.000Z');

describe('GET /api/employees query behaviour', () => {
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

  describe('search', () => {
    it('searches by first name', async () => {
      await createSearchFixtures(prisma);

      const response = await app.inject({
        method: 'GET',
        url: '/api/employees?search=ava',
      });

      expect(response.statusCode).toBe(200);
      expect(employeeCodes(response.json())).toEqual(['EMP000001']);
      expect(response.json().pagination.total).toBe(1);
    });

    it('searches by last name', async () => {
      await createSearchFixtures(prisma);

      const response = await app.inject({
        method: 'GET',
        url: '/api/employees?search=Khan',
      });

      expect(response.statusCode).toBe(200);
      expect(employeeCodes(response.json())).toEqual(['EMP000002']);
    });

    it('searches by employee code', async () => {
      await createSearchFixtures(prisma);

      const response = await app.inject({
        method: 'GET',
        url: '/api/employees?search=emp000003',
      });

      expect(response.statusCode).toBe(200);
      expect(employeeCodes(response.json())).toEqual(['EMP000003']);
    });

    it('searches case-insensitively', async () => {
      await createSearchFixtures(prisma);

      const response = await app.inject({
        method: 'GET',
        url: '/api/employees?search=ALEX',
      });

      expect(response.statusCode).toBe(200);
      expect(employeeCodes(response.json())).toEqual(['EMP000003']);
    });

    it('trims surrounding whitespace', async () => {
      await createSearchFixtures(prisma);

      const response = await app.inject({
        method: 'GET',
        url: '/api/employees?search=%20%20ava%20%20',
      });

      expect(response.statusCode).toBe(200);
      expect(employeeCodes(response.json())).toEqual(['EMP000001']);
    });

    it('treats an empty search as no search filter', async () => {
      await createSearchFixtures(prisma);

      const response = await app.inject({
        method: 'GET',
        url: '/api/employees?search=%20%20%20',
      });

      expect(response.statusCode).toBe(200);
      expect(employeeCodes(response.json())).toEqual([
        'EMP000001',
        'EMP000002',
        'EMP000003',
        'EMP000004',
      ]);
      expect(response.json().pagination.total).toBe(4);
    });

    it('returns an empty result for a nonmatching search', async () => {
      await createSearchFixtures(prisma);

      const response = await app.inject({
        method: 'GET',
        url: '/api/employees?search=Nobody',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        data: [],
        pagination: { total: 0, totalPages: 0 },
      });
    });

    it('searches by full name', async () => {
      await createSearchFixtures(prisma);

      const response = await app.inject({
        method: 'GET',
        url: '/api/employees?search=Ava%20Patel',
      });

      expect(response.statusCode).toBe(200);
      expect(employeeCodes(response.json())).toEqual(['EMP000001']);
    });

    it('rejects search terms longer than 100 characters', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/employees?search=${'a'.repeat(101)}`,
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid employee query parameters.',
        },
      });
    });
  });

  describe('filters', () => {
    it('filters employees by country', async () => {
      await createFilterFixtures(prisma);

      const response = await app.inject({
        method: 'GET',
        url: '/api/employees?country=AE',
      });

      expect(response.statusCode).toBe(200);
      expect(employeeCodes(response.json())).toEqual([
        'EMP000001',
        'EMP000002',
        'EMP000003',
      ]);
      expect(response.json().pagination.total).toBe(3);
    });

    it('normalizes a lowercase country code', async () => {
      await createFilterFixtures(prisma);

      const response = await app.inject({
        method: 'GET',
        url: '/api/employees?country=ae',
      });

      expect(response.statusCode).toBe(200);
      expect(employeeCodes(response.json())).toEqual([
        'EMP000001',
        'EMP000002',
        'EMP000003',
      ]);
    });

    it('paginates after applying the country filter', async () => {
      await prisma.employee.createMany({
        data: [
          ...Array.from({ length: 12 }, (_, index) =>
            employeeData(index + 1, { countryCode: 'AE' }),
          ),
          ...Array.from({ length: 3 }, (_, index) =>
            employeeData(index + 20, { countryCode: 'US' }),
          ),
        ],
      });

      const responses = await Promise.all(
        [1, 2, 3].map((page) =>
          app.inject({
            method: 'GET',
            url: `/api/employees?country=AE&page=${page}&pageSize=5`,
          }),
        ),
      );

      expect(responses.map(({ statusCode }) => statusCode)).toEqual([
        200, 200, 200,
      ]);
      expect(responses.map((response) => response.json().data.length)).toEqual([
        5, 5, 2,
      ]);
      expect(responses.map((response) => response.json().pagination)).toEqual([
        { page: 1, pageSize: 5, total: 12, totalPages: 3 },
        { page: 2, pageSize: 5, total: 12, totalPages: 3 },
        { page: 3, pageSize: 5, total: 12, totalPages: 3 },
      ]);
    });

    it('returns an empty result for a nonmatching country', async () => {
      await createFilterFixtures(prisma);

      const response = await app.inject({
        method: 'GET',
        url: '/api/employees?country=GB',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        data: [],
        pagination: { total: 0, totalPages: 0 },
      });
    });

    it('filters employees by an exact trimmed department', async () => {
      await createFilterFixtures(prisma);

      const response = await app.inject({
        method: 'GET',
        url: '/api/employees?department=%20Engineering%20&pageSize=2',
      });

      expect(response.statusCode).toBe(200);
      expect(employeeCodes(response.json())).toEqual([
        'EMP000001',
        'EMP000002',
      ]);
      expect(response.json().pagination).toEqual({
        page: 1,
        pageSize: 2,
        total: 3,
        totalPages: 2,
      });
    });

    it('returns an empty result for a nonmatching department', async () => {
      await createFilterFixtures(prisma);

      const response = await app.inject({
        method: 'GET',
        url: '/api/employees?department=Legal',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        data: [],
        pagination: { total: 0, totalPages: 0 },
      });
    });

    it('combines search, country, and department with AND semantics', async () => {
      await createFilterFixtures(prisma);

      const response = await app.inject({
        method: 'GET',
        url: '/api/employees?search=ali&country=AE&department=Engineering',
      });

      expect(response.statusCode).toBe(200);
      expect(employeeCodes(response.json())).toEqual(['EMP000002']);
      expect(response.json().pagination.total).toBe(1);
    });

    it.each(['A', 'UAE', '1N'])(
      'rejects invalid country value %s',
      async (country) => {
        const response = await app.inject({
          method: 'GET',
          url: `/api/employees?country=${country}`,
        });

        expect(response.statusCode).toBe(400);
        expect(response.json()).toEqual({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid employee query parameters.',
          },
        });
      },
    );

    it('rejects an empty department filter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/employees?department=%20%20%20',
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid employee query parameters.',
        },
      });
    });
  });

  describe('sorting', () => {
    it('sorts first names ascending with stable employee-code ties', async () => {
      await createSortingFixtures(prisma);

      const response = await app.inject({
        method: 'GET',
        url: '/api/employees?sortBy=firstName&sortOrder=asc',
      });

      expect(response.statusCode).toBe(200);
      expect(employeeCodes(response.json())).toEqual([
        'EMP000003',
        'EMP000004',
        'EMP000002',
        'EMP000001',
      ]);
    });

    it('sorts first names descending with stable employee-code ties', async () => {
      await createSortingFixtures(prisma);

      const response = await app.inject({
        method: 'GET',
        url: '/api/employees?sortBy=firstName&sortOrder=desc',
      });

      expect(response.statusCode).toBe(200);
      expect(employeeCodes(response.json())).toEqual([
        'EMP000001',
        'EMP000002',
        'EMP000003',
        'EMP000004',
      ]);
    });

    it('sorts last names ascending when sort order is omitted', async () => {
      await createSortingFixtures(prisma);

      const response = await app.inject({
        method: 'GET',
        url: '/api/employees?sortBy=lastName',
      });

      expect(response.statusCode).toBe(200);
      expect(employeeCodes(response.json())).toEqual([
        'EMP000004',
        'EMP000001',
        'EMP000002',
        'EMP000003',
      ]);
    });

    it('sorts departments with stable employee-code ties', async () => {
      await createSortingFixtures(prisma);

      const response = await app.inject({
        method: 'GET',
        url: '/api/employees?sortBy=department&sortOrder=asc',
      });

      expect(response.statusCode).toBe(200);
      expect(employeeCodes(response.json())).toEqual([
        'EMP000002',
        'EMP000003',
        'EMP000004',
        'EMP000001',
      ]);
    });

    it('sorts countries with stable employee-code ties', async () => {
      await createSortingFixtures(prisma);

      const response = await app.inject({
        method: 'GET',
        url: '/api/employees?sortBy=country&sortOrder=asc',
      });

      expect(response.statusCode).toBe(200);
      expect(employeeCodes(response.json())).toEqual([
        'EMP000001',
        'EMP000002',
        'EMP000004',
        'EMP000003',
      ]);
    });

    it.each(['DROP_TABLE', 'randomField', 'salary'])(
      'rejects unsupported sort field %s',
      async (sortBy) => {
        const response = await app.inject({
          method: 'GET',
          url: `/api/employees?sortBy=${sortBy}`,
        });

        expect(response.statusCode).toBe(400);
        expect(response.json()).toEqual({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid employee query parameters.',
          },
        });
      },
    );

    it('rejects an unsupported sort order', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/employees?sortBy=lastName&sortOrder=sideways',
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid employee query parameters.',
        },
      });
    });

    it('rejects sort order without a sort field', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/employees?sortOrder=desc',
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid employee query parameters.',
        },
      });
    });

    it('combines searching, filters, sorting, and pagination', async () => {
      await createFilterFixtures(prisma);

      const response = await app.inject({
        method: 'GET',
        url: '/api/employees?search=ali&country=AE&department=Engineering&sortBy=lastName&sortOrder=desc&page=1&pageSize=1',
      });

      expect(response.statusCode).toBe(200);
      expect(employeeCodes(response.json())).toEqual(['EMP000002']);
      expect(response.json().pagination).toEqual({
        page: 1,
        pageSize: 1,
        total: 1,
        totalPages: 1,
      });
    });
  });
});

function createSearchFixtures(prisma: PrismaClient) {
  return prisma.employee.createMany({
    data: [
      employeeData(1, { firstName: 'Ava', lastName: 'Patel' }),
      employeeData(2, { firstName: 'Ali', lastName: 'Khan' }),
      employeeData(3, { firstName: 'Alex', lastName: 'Smith' }),
      employeeData(4, { firstName: 'Jordan', lastName: 'Lee' }),
    ],
  });
}

function createFilterFixtures(prisma: PrismaClient) {
  return prisma.employee.createMany({
    data: [
      employeeData(1, {
        firstName: 'Ava',
        lastName: 'Patel',
        countryCode: 'AE',
        department: 'Engineering',
      }),
      employeeData(2, {
        firstName: 'Ali',
        lastName: 'Khan',
        countryCode: 'AE',
        department: 'Engineering',
      }),
      employeeData(3, {
        firstName: 'Alex',
        lastName: 'Smith',
        countryCode: 'AE',
        department: 'Finance',
      }),
      employeeData(4, {
        firstName: 'Alicia',
        lastName: 'Brown',
        countryCode: 'US',
        department: 'Engineering',
      }),
    ],
  });
}

function createSortingFixtures(prisma: PrismaClient) {
  return prisma.employee.createMany({
    data: [
      employeeData(3, {
        firstName: 'Ava',
        lastName: 'Young',
        department: 'Engineering',
        countryCode: 'US',
      }),
      employeeData(1, {
        firstName: 'Zoe',
        lastName: 'Brown',
        department: 'Finance',
        countryCode: 'AE',
      }),
      employeeData(4, {
        firstName: 'Ava',
        lastName: 'Adams',
        department: 'Engineering',
        countryCode: 'IN',
      }),
      employeeData(2, {
        firstName: 'Mia',
        lastName: 'Brown',
        department: 'Engineering',
        countryCode: 'AE',
      }),
    ],
  });
}

function employeeData(
  index: number,
  overrides: Partial<Prisma.EmployeeCreateManyInput> = {},
): Prisma.EmployeeCreateManyInput {
  const suffix = index.toString().padStart(6, '0');

  return {
    employeeCode: `EMP${suffix}`,
    firstName: `First${index}`,
    lastName: `Last${index}`,
    email: `employee${index}@example.com`,
    countryCode: 'IN',
    department: 'Engineering',
    jobTitle: 'Software Engineer',
    ...overrides,
  };
}

function employeeCodes(responseBody: {
  data: { employeeCode: string }[];
}): string[] {
  return responseBody.data.map(({ employeeCode }) => employeeCode);
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
