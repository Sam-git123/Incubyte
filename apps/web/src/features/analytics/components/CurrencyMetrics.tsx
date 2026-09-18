import type { CompensationMetric } from '@acme/contracts';
import { Box, Chip, Paper, Stack, Typography } from '@mui/material';

import { formatMoney } from '../../employees/utils/salary-format';

export function CurrencyMetrics({
  metrics,
}: {
  metrics: CompensationMetric[];
}) {
  return (
    <Box component="section">
      <SectionHeading
        description="Salary values stay separated by currency; no FX conversion is applied."
        title="Compensation by currency"
      />
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            xl: 'repeat(4, minmax(0, 1fr))',
          },
        }}
      >
        {metrics.map((metric) => (
          <Paper
            component="article"
            key={metric.currency}
            sx={{ p: { xs: 2.25, sm: 2.5 } }}
            variant="outlined"
          >
            <Stack
              direction="row"
              sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
            >
              <Typography component="h3" sx={{ fontWeight: 850 }} variant="h5">
                {metric.currency}
              </Typography>
              <Chip
                label={`${metric.employeeCount.toLocaleString()} ${metric.employeeCount === 1 ? 'employee' : 'employees'}`}
                size="small"
                variant="outlined"
              />
            </Stack>
            <Metric
              label="Average"
              value={formatMoney(metric.averageSalaryMinor, metric.currency)}
            />
            <Metric
              label="Median"
              value={formatMoney(metric.medianSalaryMinor, metric.currency)}
            />
            <Box
              sx={{
                borderTop: '1px solid',
                borderColor: 'divider',
                mt: 2,
                pt: 1.5,
              }}
            >
              <Typography color="text.secondary" variant="caption">
                Range
              </Typography>
              <Typography sx={{ fontWeight: 650 }} variant="body2">
                {formatMoney(metric.minSalaryMinor, metric.currency)} –{' '}
                {formatMoney(metric.maxSalaryMinor, metric.currency)}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ mt: 1.75 }}>
      <Typography color="text.secondary" variant="caption">
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 750 }}>{value}</Typography>
    </Box>
  );
}

function SectionHeading({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography component="h2" sx={{ fontWeight: 800 }} variant="h6">
        {title}
      </Typography>
      <Typography color="text.secondary" variant="body2">
        {description}
      </Typography>
    </Box>
  );
}
