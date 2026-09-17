import {
  employeeDetailsResponseSchema,
  type EmployeeDetailsResponse,
} from '@acme/contracts';

import { API_BASE_URL } from '../../../config/api';

export class EmployeeApiError extends Error {
  constructor(readonly status: number) {
    super('The employee details request failed.');
    this.name = 'EmployeeApiError';
  }
}

export async function getEmployee(
  employeeId: string,
): Promise<EmployeeDetailsResponse> {
  const response = await fetch(
    `${API_BASE_URL.replace(/\/$/, '')}/employees/${encodeURIComponent(employeeId)}`,
    { headers: { Accept: 'application/json' } },
  );

  if (!response.ok) {
    throw new EmployeeApiError(response.status);
  }

  return employeeDetailsResponseSchema.parse(await response.json());
}
