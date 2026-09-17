import type {
  AnalyticsFilters,
  CountryAnalyticsQuery,
  CountryAnalyticsResponse,
  DepartmentAnalyticsQuery,
  DepartmentAnalyticsResponse,
  CompensationSummaryResponse,
} from '@acme/contracts';

import type {
  AnalyticsRepository,
  CurrentEmployeeCompensation,
} from './analytics.repository.js';
import { calculateCompensationByCurrency } from './statistics.js';

export class AnalyticsService {
  constructor(private readonly analyticsRepository: AnalyticsRepository) {}

  async getSummary(
    filters: AnalyticsFilters,
    asOf: Date,
  ): Promise<CompensationSummaryResponse> {
    const employees = await this.analyticsRepository.findCurrentCompensation({
      ...filters,
      asOf,
    });

    return summarizePopulation(employees);
  }

  async getDepartments(
    query: DepartmentAnalyticsQuery,
    asOf: Date,
  ): Promise<DepartmentAnalyticsResponse> {
    const employees = await this.analyticsRepository.findCurrentCompensation({
      ...query,
      asOf,
    });

    return {
      data: groupPopulation(employees, (employee) => employee.department).map(
        ([department, group]) => ({
          department,
          ...summarizePopulation(group),
        }),
      ),
    };
  }

  async getCountries(
    query: CountryAnalyticsQuery,
    asOf: Date,
  ): Promise<CountryAnalyticsResponse> {
    const employees = await this.analyticsRepository.findCurrentCompensation({
      ...query,
      asOf,
    });

    return {
      data: groupPopulation(employees, (employee) => employee.countryCode).map(
        ([countryCode, group]) => ({
          countryCode,
          ...summarizePopulation(group),
        }),
      ),
    };
  }
}

function summarizePopulation(
  employees: readonly CurrentEmployeeCompensation[],
): CompensationSummaryResponse {
  const salaries = employees.flatMap(({ currentSalary }) =>
    currentSalary ? [currentSalary] : [],
  );

  return {
    headcount: employees.length,
    employeesWithSalary: salaries.length,
    employeesWithoutSalary: employees.length - salaries.length,
    compensationByCurrency: calculateCompensationByCurrency(salaries),
  };
}

function groupPopulation(
  employees: readonly CurrentEmployeeCompensation[],
  selectKey: (employee: CurrentEmployeeCompensation) => string,
): [string, CurrentEmployeeCompensation[]][] {
  const groups = new Map<string, CurrentEmployeeCompensation[]>();

  for (const employee of employees) {
    const key = selectKey(employee);
    const group = groups.get(key) ?? [];
    group.push(employee);
    groups.set(key, group);
  }

  return [...groups.entries()].sort(([left], [right]) =>
    left.localeCompare(right),
  );
}
