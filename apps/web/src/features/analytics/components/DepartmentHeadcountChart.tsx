import type { DepartmentAnalyticsItem } from '@acme/contracts';
import { Box, Paper, Stack, Typography } from '@mui/material';

import { formatMoney } from '../../employees/utils/salary-format';

export function DepartmentHeadcountChart({
  currency,
  departments,
  scopeLabel,
}: {
  currency?: string;
  departments: DepartmentAnalyticsItem[];
  scopeLabel: string;
}) {
  const maxHeadcount = Math.max(
    ...departments.map(({ headcount }) => headcount),
    1,
  );
  const accessibleSummary = departments
    .map(({ department, headcount }) => `${department}: ${headcount} employees`)
    .join('; ');

  return (
    <Paper
      component="section"
      sx={{ p: { xs: 2.25, sm: 3 } }}
      variant="outlined"
    >
      <Typography component="h2" sx={{ fontWeight: 800 }} variant="h6">
        Headcount by department
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2.5 }} variant="body2">
        {scopeLabel}.{' '}
        {currency
          ? `Salary context is shown because this view contains ${currency} only.`
          : 'Headcount remains comparable even when departments contain different currencies.'}
      </Typography>

      <Box
        aria-describedby="department-chart-summary"
        aria-label="Employee headcount by department"
        role="img"
      >
        <Stack spacing={2}>
          {departments.map((item) => {
            const metric = currency
              ? item.compensationByCurrency.find(
                  (candidate) => candidate.currency === currency,
                )
              : undefined;

            return (
              <Box key={item.department}>
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography sx={{ fontWeight: 700 }} variant="body2">
                    {item.department}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {item.headcount.toLocaleString()}
                  </Typography>
                </Stack>
                <Box
                  sx={{
                    bgcolor: 'grey.100',
                    borderRadius: 999,
                    height: 9,
                    mt: 0.75,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: 'secondary.main',
                      borderRadius: 999,
                      height: '100%',
                      minWidth: 4,
                      width: `${(item.headcount / maxHeadcount) * 100}%`,
                    }}
                  />
                </Box>
                {metric ? (
                  <Typography
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                    variant="caption"
                  >
                    Average{' '}
                    {formatMoney(metric.averageSalaryMinor, metric.currency)} ·
                    Median{' '}
                    {formatMoney(metric.medianSalaryMinor, metric.currency)}
                  </Typography>
                ) : null}
              </Box>
            );
          })}
        </Stack>
      </Box>
      <Box
        id="department-chart-summary"
        sx={{
          clip: 'rect(0 0 0 0)',
          clipPath: 'inset(50%)',
          height: '1px',
          overflow: 'hidden',
          position: 'absolute',
          whiteSpace: 'nowrap',
          width: '1px',
        }}
      >
        {accessibleSummary}
      </Box>
    </Paper>
  );
}
