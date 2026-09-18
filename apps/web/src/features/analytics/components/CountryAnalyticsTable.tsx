import type { CountryAnalyticsItem } from '@acme/contracts';
import {
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import { getCountryLabel } from '../../employees/employee-options';
import { formatMoney } from '../../employees/utils/salary-format';

export function CountryAnalyticsTable({
  countries,
  scopeLabel,
}: {
  countries: CountryAnalyticsItem[];
  scopeLabel: string;
}) {
  return (
    <Paper component="section" sx={{ overflow: 'hidden' }} variant="outlined">
      <Typography
        component="h2"
        sx={{ fontWeight: 800, px: 3, pt: 3 }}
        variant="h6"
      >
        Country compensation
      </Typography>
      <Typography color="text.secondary" sx={{ px: 3, pb: 2 }} variant="body2">
        {scopeLabel}. Each salary value keeps its currency visible.
      </Typography>
      <TableContainer>
        <Table aria-label="Compensation by country" size="small">
          <TableHead>
            <TableRow>
              <TableCell>Country</TableCell>
              <TableCell align="right">Headcount</TableCell>
              <TableCell>Currency</TableCell>
              <TableCell align="right">Average</TableCell>
              <TableCell align="right">Median</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {countries.flatMap((country) => countryRows(country))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

function countryRows(country: CountryAnalyticsItem) {
  if (country.compensationByCurrency.length === 0) {
    return (
      <TableRow key={`${country.countryCode}-none`}>
        <TableCell>{getCountryLabel(country.countryCode)}</TableCell>
        <TableCell align="right">
          {country.headcount.toLocaleString()}
        </TableCell>
        <TableCell colSpan={3}>No current salary data</TableCell>
      </TableRow>
    );
  }

  return country.compensationByCurrency.map((metric, index) => (
    <TableRow key={`${country.countryCode}-${metric.currency}`}>
      <TableCell>
        {index === 0 ? getCountryLabel(country.countryCode) : ''}
      </TableCell>
      <TableCell align="right">
        {index === 0 ? country.headcount.toLocaleString() : ''}
      </TableCell>
      <TableCell>
        <Chip label={metric.currency} size="small" variant="outlined" />
      </TableCell>
      <TableCell align="right">
        {formatMoney(metric.averageSalaryMinor, metric.currency)}
      </TableCell>
      <TableCell align="right">
        {formatMoney(metric.medianSalaryMinor, metric.currency)}
      </TableCell>
    </TableRow>
  ));
}
