import type {
  EmployeeListQuery,
  EmployeeListResponse,
  EmployeeSortField,
} from '@acme/contracts';

import type {
  EmployeeOrderField,
  EmployeeRepository,
} from './employee.repository.js';

const repositorySortFields: Record<EmployeeSortField, EmployeeOrderField> = {
  employeeCode: 'employeeCode',
  firstName: 'firstName',
  lastName: 'lastName',
  department: 'department',
  country: 'countryCode',
};

export class EmployeeService {
  constructor(private readonly employeeRepository: EmployeeRepository) {}

  async list(
    query: EmployeeListQuery,
    asOf: Date,
  ): Promise<EmployeeListResponse> {
    const {
      page,
      pageSize,
      search,
      country,
      department,
      sortBy = 'employeeCode',
      sortOrder = 'asc',
    } = query;
    const { employees, total } = await this.employeeRepository.listPage({
      offset: (page - 1) * pageSize,
      limit: pageSize,
      asOf,
      search,
      country,
      department,
      sortBy: repositorySortFields[sortBy],
      sortOrder,
    });

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
