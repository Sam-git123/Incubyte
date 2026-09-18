import {
  compensationSummaryResponseSchema,
  countryAnalyticsResponseSchema,
  departmentAnalyticsResponseSchema,
  type AnalyticsFilters,
  type CompensationSummaryResponse,
  type CountryAnalyticsResponse,
  type DepartmentAnalyticsResponse,
} from '@acme/contracts';

import { API_BASE_URL } from '../../../config/api';

export async function getCompensationSummary(
  filters: AnalyticsFilters,
): Promise<CompensationSummaryResponse> {
  return requestAnalytics(
    'summary',
    filters,
    compensationSummaryResponseSchema.parse,
  );
}

export async function getDepartmentAnalytics(
  filters: Pick<AnalyticsFilters, 'country'>,
): Promise<DepartmentAnalyticsResponse> {
  return requestAnalytics(
    'departments',
    filters,
    departmentAnalyticsResponseSchema.parse,
  );
}

export async function getCountryAnalytics(
  filters: Pick<AnalyticsFilters, 'department'>,
): Promise<CountryAnalyticsResponse> {
  return requestAnalytics(
    'countries',
    filters,
    countryAnalyticsResponseSchema.parse,
  );
}

async function requestAnalytics<T>(
  resource: string,
  filters: AnalyticsFilters,
  parse: (value: unknown) => T,
): Promise<T> {
  const parameters = new URLSearchParams();

  if (filters.country) {
    parameters.set('country', filters.country);
  }
  if (filters.department) {
    parameters.set('department', filters.department);
  }

  const query = parameters.size > 0 ? `?${parameters.toString()}` : '';
  const response = await fetch(
    `${API_BASE_URL.replace(/\/$/, '')}/analytics/${resource}${query}`,
    { headers: { Accept: 'application/json' } },
  );

  if (!response.ok) {
    throw new Error('The compensation analytics request failed.');
  }

  return parse(await response.json());
}
