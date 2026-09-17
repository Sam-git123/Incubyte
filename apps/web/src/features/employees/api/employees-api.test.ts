import type { EmployeeListResponse } from '@acme/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getEmployees } from './employees-api';

describe('getEmployees', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps the directory query to API query parameters', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(employeeResponse()), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await getEmployees({
      page: 2,
      pageSize: 50,
      search: 'Ava Patel',
      country: 'AE',
      department: 'Engineering',
      sortBy: 'lastName',
      sortOrder: 'desc',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/employees?page=2&pageSize=50&search=Ava+Patel&country=AE&department=Engineering&sortBy=lastName&sortOrder=desc',
      { headers: { Accept: 'application/json' } },
    );
  });

  it('returns a safe application error when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    let requestError: unknown;
    try {
      await getEmployees({ page: 1, pageSize: 25 });
    } catch (error) {
      requestError = error;
    }

    expect(requestError).toBeInstanceOf(Error);
    expect((requestError as Error).message).toBe(
      'The employee directory request failed.',
    );
  });
});

function employeeResponse(): EmployeeListResponse {
  return {
    data: [
      {
        id: 'employee-1',
        employeeCode: 'EMP000001',
        firstName: 'Ava',
        lastName: 'Patel',
        email: 'ava.patel.000001@acme.example',
        countryCode: 'AE',
        department: 'Engineering',
        jobTitle: 'Senior Software Engineer',
        currentSalary: null,
      },
    ],
    pagination: {
      page: 2,
      pageSize: 50,
      total: 100,
      totalPages: 2,
    },
  };
}
