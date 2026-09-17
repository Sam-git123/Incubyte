import { useQuery } from '@tanstack/react-query';

import { getEmployee } from '../api/employee-details-api';

export function useEmployee(employeeId: string) {
  return useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => getEmployee(employeeId),
    enabled: Boolean(employeeId),
  });
}
