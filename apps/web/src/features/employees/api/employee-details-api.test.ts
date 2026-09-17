import type { EmployeeDetailsResponse } from '@acme/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EmployeeApiError, getEmployee } from './employee-details-api';

describe('getEmployee', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests the dedicated encoded employee resource', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(employeeResponse()), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await getEmployee('employee/id');

    expect(fetchMock).toHaveBeenCalledWith('/api/employees/employee%2Fid', {
      headers: { Accept: 'application/json' },
    });
  });

  it('preserves the response status for safe UI error handling', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404 }),
    );

    let requestError: unknown;
    try {
      await getEmployee('missing');
    } catch (error) {
      requestError = error;
    }

    expect(requestError).toBeInstanceOf(EmployeeApiError);
    expect((requestError as EmployeeApiError).status).toBe(404);
  });
});

function employeeResponse(): EmployeeDetailsResponse {
  return {
    id: 'employee-500',
    employeeCode: 'EMP000500',
    firstName: 'Ava',
    lastName: 'Patel',
    email: 'ava.patel.000500@acme.example',
    countryCode: 'AE',
    department: 'Engineering',
    jobTitle: 'Senior Software Engineer',
    currentSalary: null,
    salaryHistory: [],
  };
}
