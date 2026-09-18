import type { AnalyticsFilters } from '@acme/contracts';
import { useQuery } from '@tanstack/react-query';

import { getCountryAnalytics } from '../api/analytics-api';

type CountryFilters = Pick<AnalyticsFilters, 'department'>;

export function useCountryAnalytics(filters: CountryFilters) {
  return useQuery({
    queryKey: ['analytics', 'countries', filters],
    queryFn: () => getCountryAnalytics(filters),
  });
}
