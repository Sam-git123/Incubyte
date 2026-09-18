import type { AnalyticsFilters } from '@acme/contracts';
import {
  Alert,
  Box,
  Button,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import { getCountryLabel } from '../../employees/employee-options';
import { AnalyticsFilters as AnalyticsFilterControls } from '../components/AnalyticsFilters';
import { CountryAnalyticsTable } from '../components/CountryAnalyticsTable';
import { CurrencyMetrics } from '../components/CurrencyMetrics';
import { DepartmentHeadcountChart } from '../components/DepartmentHeadcountChart';
import { SummaryCards } from '../components/SummaryCards';
import { useCompensationSummary } from '../hooks/useCompensationSummary';
import { useCountryAnalytics } from '../hooks/useCountryAnalytics';
import { useDepartmentAnalytics } from '../hooks/useDepartmentAnalytics';

export function DashboardPage() {
  const [country, setCountry] = useState('');
  const [department, setDepartment] = useState('');
  const summaryFilters = useMemo<AnalyticsFilters>(
    () => ({
      ...(country ? { country } : {}),
      ...(department ? { department } : {}),
    }),
    [country, department],
  );
  const departmentFilters = useMemo(
    () => ({ ...(country ? { country } : {}) }),
    [country],
  );
  const countryFilters = useMemo(
    () => ({ ...(department ? { department } : {}) }),
    [department],
  );

  const summary = useCompensationSummary(summaryFilters);
  const departments = useDepartmentAnalytics(departmentFilters);
  const countries = useCountryAnalytics(countryFilters);
  const queries = [summary, departments, countries];
  const isLoading = queries.some((query) => query.isLoading);
  const isFetching = queries.some((query) => query.isFetching);
  const isError = queries.some((query) => query.isError);
  const hasActiveFilters = Boolean(country || department);

  const clearFilters = () => {
    setCountry('');
    setDepartment('');
  };

  return (
    <Stack spacing={3.5}>
      <Paper
        component="header"
        sx={{
          background:
            'linear-gradient(135deg, rgba(22,78,99,0.98), rgba(15,118,110,0.92))',
          color: 'common.white',
          overflow: 'hidden',
          p: { xs: 2.5, sm: 3.5 },
          position: 'relative',
        }}
      >
        <Box
          aria-hidden="true"
          sx={{
            bgcolor: 'rgba(255,255,255,0.08)',
            borderRadius: '50%',
            height: 220,
            position: 'absolute',
            right: -75,
            top: -105,
            width: 220,
          }}
        />
        <Typography
          sx={{
            color: 'rgba(255,255,255,0.72)',
            fontWeight: 800,
            letterSpacing: '0.08em',
          }}
          variant="overline"
        >
          Compensation overview
        </Typography>
        <Typography
          component="h2"
          sx={{ fontWeight: 850, mt: 0.25 }}
          variant="h4"
        >
          Compensation insights
        </Typography>
        <Typography
          sx={{ color: 'rgba(255,255,255,0.78)', mt: 1, maxWidth: 680 }}
        >
          Understand salary coverage and compensation patterns without combining
          unlike currencies.
        </Typography>
        <Button
          color="inherit"
          component={RouterLink}
          sx={{ borderColor: 'rgba(255,255,255,0.5)', mt: 2.5 }}
          to="/employees"
          variant="outlined"
        >
          View employees
        </Button>
      </Paper>

      <AnalyticsFilterControls
        country={country}
        department={department}
        onClear={clearFilters}
        onCountryChange={setCountry}
        onDepartmentChange={setDepartment}
      />

      {isFetching && !isLoading ? (
        <LinearProgress aria-label="Refreshing dashboard" />
      ) : null}

      {isLoading ? (
        <DashboardLoading />
      ) : isError ? (
        <DashboardError
          onRetry={() => {
            void Promise.all(queries.map((query) => query.refetch()));
          }}
        />
      ) : summary.data && summary.data.headcount === 0 ? (
        <EmptyDashboard
          hasActiveFilters={hasActiveFilters}
          onClear={clearFilters}
        />
      ) : summary.data && departments.data && countries.data ? (
        <>
          <SummaryCards
            employeesWithSalary={summary.data.employeesWithSalary}
            employeesWithoutSalary={summary.data.employeesWithoutSalary}
            headcount={summary.data.headcount}
          />
          <CurrencyMetrics metrics={summary.data.compensationByCurrency} />
          <Box
            sx={{
              alignItems: 'start',
              display: 'grid',
              gap: 3,
              gridTemplateColumns: {
                xs: '1fr',
                xl: 'minmax(0, 0.9fr) minmax(0, 1.4fr)',
              },
            }}
          >
            <DepartmentHeadcountChart
              departments={departments.data.data}
              scopeLabel={
                country
                  ? `Departments in ${getCountryLabel(country)}`
                  : 'Organization-wide department comparison'
              }
              {...(summary.data.compensationByCurrency.length === 1 &&
              summary.data.compensationByCurrency[0]
                ? {
                    currency: summary.data.compensationByCurrency[0].currency,
                  }
                : {})}
            />
            <CountryAnalyticsTable
              countries={countries.data.data}
              scopeLabel={
                department
                  ? `Countries within ${department}`
                  : 'Organization-wide country comparison'
              }
            />
          </Box>
        </>
      ) : null}
    </Stack>
  );
}

function DashboardLoading() {
  return (
    <Stack spacing={3}>
      <Box
        aria-label="Loading summary metrics"
        role="status"
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
        }}
      >
        {[0, 1, 2].map((item) => (
          <Skeleton height={142} key={item} variant="rounded" />
        ))}
      </Box>
      <Skeleton height={260} variant="rounded" />
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1.3fr' },
        }}
      >
        <Box aria-label="Loading department analytics" role="status">
          <Skeleton height={360} variant="rounded" />
        </Box>
        <Box aria-label="Loading country analytics" role="status">
          <Skeleton height={360} variant="rounded" />
        </Box>
      </Box>
    </Stack>
  );
}

function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <Paper sx={{ p: { xs: 2, sm: 3 } }} variant="outlined">
      <Alert
        action={
          <Button color="inherit" onClick={onRetry} size="small">
            Retry
          </Button>
        }
        severity="error"
      >
        We couldn't load compensation insights.
      </Alert>
    </Paper>
  );
}

function EmptyDashboard({
  hasActiveFilters,
  onClear,
}: {
  hasActiveFilters: boolean;
  onClear: () => void;
}) {
  return (
    <Paper sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center' }} variant="outlined">
      <Typography component="h2" sx={{ fontWeight: 800 }} variant="h6">
        {hasActiveFilters
          ? 'No employees match these filters.'
          : 'No employee compensation data is available.'}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.75 }}>
        Try another view before comparing compensation.
      </Typography>
      {hasActiveFilters ? (
        <Button onClick={onClear} sx={{ mt: 2 }} variant="contained">
          Clear filters
        </Button>
      ) : null}
    </Paper>
  );
}
