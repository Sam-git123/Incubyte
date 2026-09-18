import {
  Box,
  Button,
  FormControl,
  InputLabel,
  NativeSelect,
  Paper,
  Typography,
} from '@mui/material';

import {
  COUNTRY_OPTIONS,
  DEPARTMENT_OPTIONS,
} from '../../employees/employee-options';

type AnalyticsFiltersProps = {
  country: string;
  department: string;
  onClear: () => void;
  onCountryChange: (country: string) => void;
  onDepartmentChange: (department: string) => void;
};

export function AnalyticsFilters({
  country,
  department,
  onClear,
  onCountryChange,
  onDepartmentChange,
}: AnalyticsFiltersProps) {
  const hasActiveFilters = Boolean(country || department);

  return (
    <Paper
      aria-label="Dashboard filters"
      component="section"
      sx={{
        alignItems: { md: 'end' },
        display: 'grid',
        gap: 2,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          md: 'minmax(180px, 1fr) minmax(180px, 1fr) auto',
        },
        p: { xs: 2, sm: 2.5 },
      }}
      variant="outlined"
    >
      <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1', md: '1 / -1' } }}>
        <Typography sx={{ fontWeight: 750 }}>Focus the analysis</Typography>
        <Typography color="text.secondary" variant="body2">
          Summary uses both filters; comparison sections keep their own
          dimension visible.
        </Typography>
      </Box>

      <FormControl fullWidth>
        <InputLabel htmlFor="analytics-country-filter" shrink>
          Country
        </InputLabel>
        <NativeSelect
          inputProps={{
            'aria-label': 'Country',
            id: 'analytics-country-filter',
          }}
          onChange={(event) => onCountryChange(event.target.value)}
          value={country}
        >
          <option value="">All countries</option>
          {COUNTRY_OPTIONS.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </NativeSelect>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel htmlFor="analytics-department-filter" shrink>
          Department
        </InputLabel>
        <NativeSelect
          inputProps={{
            'aria-label': 'Department',
            id: 'analytics-department-filter',
          }}
          onChange={(event) => onDepartmentChange(event.target.value)}
          value={department}
        >
          <option value="">All departments</option>
          {DEPARTMENT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </NativeSelect>
      </FormControl>

      <Button
        disabled={!hasActiveFilters}
        onClick={onClear}
        sx={{ minHeight: 40, whiteSpace: 'nowrap' }}
      >
        Clear filters
      </Button>
    </Paper>
  );
}
