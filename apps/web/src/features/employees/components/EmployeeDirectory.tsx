import type {
  EmployeeListQuery,
  EmployeeSortField,
  SortOrder,
} from '@acme/contracts';
import { Box, Stack, Typography } from '@mui/material';
import type { GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import { useMemo, useState } from 'react';

import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useEmployees } from '../hooks/useEmployees';
import { EmployeeFilters } from './EmployeeFilters';
import { EmployeeTable } from './EmployeeTable';

const sortFieldMap: Record<string, EmployeeSortField> = {
  countryCode: 'country',
  department: 'department',
  employeeCode: 'employeeCode',
  employeeName: 'firstName',
};

const initialPagination: GridPaginationModel = { page: 0, pageSize: 25 };

export function EmployeeDirectory() {
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [department, setDepartment] = useState('');
  const [paginationModel, setPaginationModel] =
    useState<GridPaginationModel>(initialPagination);
  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const debouncedSearch = useDebouncedValue(search, 300).trim();

  const query = useMemo<EmployeeListQuery>(() => {
    const activeSort = sortModel[0];
    const sortBy = activeSort ? sortFieldMap[activeSort.field] : undefined;

    return {
      page: paginationModel.page + 1,
      pageSize: paginationModel.pageSize,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(country ? { country } : {}),
      ...(department ? { department } : {}),
      ...(sortBy && activeSort?.sort
        ? { sortBy, sortOrder: activeSort.sort as SortOrder }
        : {}),
    };
  }, [country, debouncedSearch, department, paginationModel, sortModel]);

  const employees = useEmployees(query);
  const hasActiveFilters = Boolean(search.trim() || country || department);

  const resetPage = () => {
    setPaginationModel((current) => ({ ...current, page: 0 }));
  };

  const clearFilters = () => {
    setSearch('');
    setCountry('');
    setDepartment('');
    resetPage();
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography component="h2" sx={{ fontWeight: 800 }} variant="h4">
          Employees
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Browse employee profiles and their current compensation.
        </Typography>
      </Box>

      <EmployeeFilters
        country={country}
        department={department}
        hasActiveFilters={hasActiveFilters}
        onClear={clearFilters}
        onCountryChange={(value) => {
          setCountry(value);
          resetPage();
        }}
        onDepartmentChange={(value) => {
          setDepartment(value);
          resetPage();
        }}
        onSearchChange={(value) => {
          setSearch(value);
          resetPage();
        }}
        search={search}
      />

      <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
        <Typography color="text.secondary" variant="body2">
          {(employees.data?.pagination.total ?? 0).toLocaleString()} employees
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Salaries shown in each employee's currency
        </Typography>
      </Stack>

      <EmployeeTable
        error={employees.isError}
        hasActiveFilters={hasActiveFilters}
        loading={employees.isLoading || employees.isFetching}
        onPaginationChange={setPaginationModel}
        onRetry={() => void employees.refetch()}
        onSortChange={(model) => {
          setSortModel(model);
          resetPage();
        }}
        paginationModel={paginationModel}
        rowCount={employees.data?.pagination.total ?? 0}
        rows={employees.data?.data ?? []}
        sortModel={sortModel}
      />
    </Stack>
  );
}
