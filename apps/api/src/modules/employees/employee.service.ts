import type { EmployeeListQuery, EmployeeListResponse } from '@acme/contracts';

import type { EmployeeRepository } from './employee.repository.js';

export class EmployeeService {
  constructor(private readonly employeeRepository: EmployeeRepository) {}

  async list(
    query: EmployeeListQuery,
    asOf: Date,
  ): Promise<EmployeeListResponse> {
    const { page, pageSize } = query;
    const { employees, total } = await this.employeeRepository.listPage(
      (page - 1) * pageSize,
      pageSize,
      asOf,
    );

    return {
      data: employees.map((employee) => ({
        ...employee,
        currentSalary: employee.currentSalary
          ? {
              ...employee.currentSalary,
              effectiveFrom: employee.currentSalary.effectiveFrom.toISOString(),
            }
          : null,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}
