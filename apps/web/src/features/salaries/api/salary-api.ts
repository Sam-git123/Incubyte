import {
  apiErrorResponseSchema,
  createSalaryResponseSchema,
  type CreateSalaryRequest,
  type CreateSalaryResponse,
} from '@acme/contracts';

import { API_BASE_URL } from '../../../config/api';

export class SalaryApiError extends Error {
  constructor(
    readonly status: number,
    readonly code?: string,
    message = 'The salary change request failed.',
  ) {
    super(message);
    this.name = 'SalaryApiError';
  }
}

export async function createEmployeeSalary(
  employeeId: string,
  input: CreateSalaryRequest,
): Promise<CreateSalaryResponse> {
  const response = await fetch(
    `${API_BASE_URL.replace(/\/$/, '')}/employees/${encodeURIComponent(employeeId)}/salaries`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  );

  if (!response.ok) {
    const parsedError = apiErrorResponseSchema.safeParse(
      await readJsonSafely(response),
    );

    throw new SalaryApiError(
      response.status,
      parsedError.success ? parsedError.data.error.code : undefined,
      parsedError.success ? parsedError.data.error.message : undefined,
    );
  }

  return createSalaryResponseSchema.parse(await response.json());
}

async function readJsonSafely(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}
