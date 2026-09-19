import type { CreateSalaryRequest } from '@acme/contracts';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createTestQueryClient } from '../../../test/query-client';
import { createEmployeeSalary } from '../api/salary-api';
import { useCreateSalary } from './useCreateSalary';

vi.mock('../api/salary-api', () => ({ createEmployeeSalary: vi.fn() }));

const mockedCreateEmployeeSalary = vi.mocked(createEmployeeSalary);

describe('useCreateSalary', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('invalidates employee and analytics data after a successful change', async () => {
    const queryClient = createTestQueryClient();
    const employeeId = 'employee-500';
    const input: CreateSalaryRequest = {
      amountMinor: 31_000_000,
      currency: 'AED',
      effectiveFrom: '2026-10-01',
    };
    mockedCreateEmployeeSalary.mockResolvedValue({
      salary: {
        id: 'salary-new',
        ...input,
        effectiveFrom: '2026-10-01T00:00:00.000Z',
        createdAt: '2026-09-19T12:00:00.000Z',
      },
    });
    queryClient.setQueryData(['employee', employeeId], { id: employeeId });
    queryClient.setQueryData(['employees', { page: 1 }], { data: [] });
    queryClient.setQueryData(['analytics', 'summary', {}], { headcount: 1 });

    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useCreateSalary(employeeId), {
      wrapper,
    });

    await act(() => result.current.mutateAsync(input));

    expect(
      queryClient.getQueryState(['employee', employeeId])?.isInvalidated,
    ).toBe(true);
    expect(
      queryClient.getQueryState(['employees', { page: 1 }])?.isInvalidated,
    ).toBe(true);
    expect(
      queryClient.getQueryState(['analytics', 'summary', {}])?.isInvalidated,
    ).toBe(true);
  });
});
