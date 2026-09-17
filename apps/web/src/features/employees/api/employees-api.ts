import {
  employeeListResponseSchema,
  type EmployeeListQuery,
  type EmployeeListResponse,
} from '@acme/contracts';

import { API_BASE_URL } from '../../../config/api';

export async function getEmployees(
  query: EmployeeListQuery,
): Promise<EmployeeListResponse> {
  const parameters = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });

  addOptionalParameter(parameters, 'search', query.search);
  addOptionalParameter(parameters, 'country', query.country);
  addOptionalParameter(parameters, 'department', query.department);
  addOptionalParameter(parameters, 'sortBy', query.sortBy);
  addOptionalParameter(parameters, 'sortOrder', query.sortOrder);

  const response = await fetch(
    `${API_BASE_URL.replace(/\/$/, '')}/employees?${parameters.toString()}`,
    { headers: { Accept: 'application/json' } },
  );

  if (!response.ok) {
    throw new Error('The employee directory request failed.');
  }

  return employeeListResponseSchema.parse(await response.json());
}

function addOptionalParameter(
  parameters: URLSearchParams,
  name: string,
  value: string | undefined,
) {
  if (value) {
    parameters.set(name, value);
  }
}
