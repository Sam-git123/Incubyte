import type { CreateSalaryRequest } from '@acme/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createEmployeeSalary } from '../api/salary-api';

export function useCreateSalary(employeeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSalaryRequest) =>
      createEmployeeSalary(employeeId, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['employee', employeeId],
        }),
        queryClient.invalidateQueries({ queryKey: ['employees'] }),
      ]);
    },
  });
}
