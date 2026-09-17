import type { EmployeeListQuery } from '@acme/contracts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { getEmployees } from '../api/employees-api';

export function useEmployees(query: EmployeeListQuery) {
  return useQuery({
    queryKey: ['employees', query],
    queryFn: () => getEmployees(query),
    placeholderData: keepPreviousData,
  });
}
