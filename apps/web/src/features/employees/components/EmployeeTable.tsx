import type { EmployeeListItem } from '@acme/contracts';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
} from '@mui/material';
import {
  DataGrid,
  GridOverlay,
  type GridColDef,
  type GridPaginationModel,
  type GridSortModel,
} from '@mui/x-data-grid';

import { getCountryLabel } from '../employee-options';
import { formatSalary } from '../utils/salary-format';

type EmployeeTableProps = {
  error: boolean;
  hasActiveFilters: boolean;
  loading: boolean;
  onPaginationChange: (model: GridPaginationModel) => void;
  onRetry: () => void;
  onSortChange: (model: GridSortModel) => void;
  paginationModel: GridPaginationModel;
  rowCount: number;
  rows: EmployeeListItem[];
  sortModel: GridSortModel;
};

const columns: GridColDef<EmployeeListItem>[] = [
  {
    field: 'employeeName',
    headerName: 'Employee',
    minWidth: 230,
    flex: 1.4,
    sortable: true,
    valueGetter: (_value, row) => `${row.firstName} ${row.lastName}`,
    renderCell: (parameters) => (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Typography sx={{ fontWeight: 700 }} variant="body2">
          {parameters.row.firstName} {parameters.row.lastName}
        </Typography>
        <Typography color="text.secondary" variant="caption">
          {parameters.row.email}
        </Typography>
      </Box>
    ),
  },
  {
    field: 'employeeCode',
    headerName: 'Employee ID',
    minWidth: 130,
    flex: 0.7,
  },
  {
    field: 'department',
    headerName: 'Department',
    minWidth: 150,
    flex: 0.9,
  },
  {
    field: 'jobTitle',
    headerName: 'Job title',
    minWidth: 200,
    flex: 1.1,
    sortable: false,
  },
  {
    field: 'countryCode',
    headerName: 'Country',
    minWidth: 175,
    flex: 0.9,
    valueFormatter: (value: string) => getCountryLabel(value),
  },
  {
    field: 'currentSalary',
    headerName: 'Current salary',
    minWidth: 160,
    align: 'right',
    headerAlign: 'right',
    sortable: false,
    valueFormatter: (value: EmployeeListItem['currentSalary']) =>
      formatSalary(value),
  },
];

export function EmployeeTable({
  error,
  hasActiveFilters,
  loading,
  onPaginationChange,
  onRetry,
  onSortChange,
  paginationModel,
  rowCount,
  rows,
  sortModel,
}: EmployeeTableProps) {
  if (error) {
    return (
      <Paper
        sx={{ alignItems: 'center', display: 'flex', minHeight: 420, p: 3 }}
        variant="outlined"
      >
        <Alert
          action={
            <Button color="inherit" onClick={onRetry} size="small">
              Retry
            </Button>
          }
          severity="error"
          sx={{ mx: 'auto', width: 'min(100%, 560px)' }}
        >
          We couldn't load employees.
        </Alert>
      </Paper>
    );
  }

  const EmptyOverlay = () => (
    <GridOverlay>
      <Box sx={{ maxWidth: 420, px: 3, textAlign: 'center' }}>
        <Typography gutterBottom sx={{ fontWeight: 700 }}>
          {hasActiveFilters
            ? 'No employees match your current search or filters.'
            : 'No employees available.'}
        </Typography>
      </Box>
    </GridOverlay>
  );

  const LoadingOverlay = () => (
    <GridOverlay>
      <CircularProgress aria-label="Loading employees" />
    </GridOverlay>
  );

  return (
    <Paper sx={{ height: 620, width: '100%' }} variant="outlined">
      <DataGrid
        aria-label="Employee directory"
        columns={columns}
        disableColumnMenu
        disableRowSelectionOnClick
        loading={loading}
        onPaginationModelChange={onPaginationChange}
        onSortModelChange={onSortChange}
        pageSizeOptions={[25, 50, 100]}
        paginationMode="server"
        paginationModel={paginationModel}
        rowCount={rowCount}
        rows={rows}
        slots={{ loadingOverlay: LoadingOverlay, noRowsOverlay: EmptyOverlay }}
        sortingMode="server"
        sortModel={sortModel}
        sx={{
          border: 0,
          '& .MuiDataGrid-columnHeaders': { bgcolor: 'grey.50' },
          '& .MuiDataGrid-row:hover': { bgcolor: 'action.hover' },
        }}
      />
    </Paper>
  );
}
