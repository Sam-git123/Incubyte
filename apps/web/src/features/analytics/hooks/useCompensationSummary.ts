import type { AnalyticsFilters } from '@acme/contracts';
import { useQuery } from '@tanstack/react-query';

import { getCompensationSummary } from '../api/analytics-api';

export function useCompensationSummary(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ['analytics', 'summary', filters],
    queryFn: () => getCompensationSummary(filters),
  });
}
