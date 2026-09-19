import {
  Box,
  Button,
  FormControl,
  InputLabel,
  NativeSelect,
  TextField,
} from '@mui/material';

import { COUNTRY_OPTIONS, DEPARTMENT_OPTIONS } from '../employee-options';

type EmployeeFiltersProps = {
  country: string;
  department: string;
  hasActiveFilters: boolean;
  onClear: () => void;
  onCountryChange: (country: string) => void;
  onDepartmentChange: (department: string) => void;
  onSearchChange: (search: string) => void;
  search: string;
};

export function EmployeeFilters({
  country,
  department,
  hasActiveFilters,
  onClear,
  onCountryChange,
  onDepartmentChange,
  onSearchChange,
  search,
}: EmployeeFiltersProps) {
  return (
    <Box
      aria-label="Employee filters"
      component="section"
      sx={{
        alignItems: { sm: 'flex-end' },
        display: 'grid',
        gap: 2,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          lg: 'minmax(260px, 2fr) repeat(2, minmax(150px, 1fr)) auto',
        },
      }}
    >
      <TextField
        fullWidth
        label="Search employees"
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by name or employee ID"
        slotProps={{ htmlInput: { maxLength: 100, type: 'search' } }}
        sx={{ gridColumn: { sm: '1 / -1', lg: 'auto' } }}
        value={search}
      />

      <FormControl fullWidth>
        <InputLabel htmlFor="country-filter" shrink>
          Country
        </InputLabel>
        <NativeSelect
          inputProps={{ 'aria-label': 'Country', id: 'country-filter' }}
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
        <InputLabel htmlFor="department-filter" shrink>
          Department
        </InputLabel>
        <NativeSelect
          inputProps={{ 'aria-label': 'Department', id: 'department-filter' }}
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
        sx={{ minHeight: 40 }}
      >
        Clear filters
      </Button>
    </Box>
  );
}
