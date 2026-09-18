import type { CompensationSummaryResponse } from '@acme/contracts';
import { Box, Paper, Typography } from '@mui/material';

type SummaryCardsProps = Pick<
  CompensationSummaryResponse,
  'headcount' | 'employeesWithSalary' | 'employeesWithoutSalary'
>;

export function SummaryCards({
  headcount,
  employeesWithSalary,
  employeesWithoutSalary,
}: SummaryCardsProps) {
  const coverage =
    headcount === 0 ? 0 : Math.round((employeesWithSalary / headcount) * 100);
  const cards = [
    {
      label: 'Headcount',
      value: `${headcount.toLocaleString()} employees`,
      detail: 'People in the selected population',
      accent: '#164e63',
    },
    {
      label: 'With salary',
      value: `${employeesWithSalary.toLocaleString()} employees`,
      detail: `${coverage}% salary coverage`,
      accent: '#0f766e',
    },
    {
      label: 'Missing salary',
      value: `${employeesWithoutSalary.toLocaleString()} employees`,
      detail: 'Excluded from compensation metrics',
      accent: employeesWithoutSalary > 0 ? '#b45309' : '#64748b',
    },
  ];

  return (
    <Box
      aria-label="Organization summary"
      component="section"
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(3, minmax(0, 1fr))',
        },
      }}
    >
      {cards.map((card) => (
        <Paper
          key={card.label}
          sx={{
            borderTop: '4px solid',
            borderTopColor: card.accent,
            minWidth: 0,
            p: { xs: 2.25, sm: 2.5 },
          }}
          variant="outlined"
        >
          <Typography color="text.secondary" variant="body2">
            {card.label}
          </Typography>
          <Typography
            component="p"
            sx={{ fontWeight: 800, mt: 0.75 }}
            variant="h5"
          >
            {card.value}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="caption">
            {card.detail}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}
