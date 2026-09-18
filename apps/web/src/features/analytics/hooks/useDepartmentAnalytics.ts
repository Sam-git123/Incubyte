import type { AnalyticsFilters } from '@acme/contracts';
import { useQuery } from '@tanstack/react-query';

import { getDepartmentAnalytics } from '../api/analytics-api';

type DepartmentFilters = Pick<AnalyticsFilters, 'country'>;

export function useDepartmentAnalytics(filters: DepartmentFilters) {
  return useQuery({
    queryKey: ['analytics', 'departments', filters],
    queryFn: () => getDepartmentAnalytics(filters),
  });
}
