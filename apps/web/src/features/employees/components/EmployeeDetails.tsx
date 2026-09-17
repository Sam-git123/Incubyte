import type {
  EmployeeDetailsResponse,
  SalaryHistoryItem,
} from '@acme/contracts';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';

import { EmployeeApiError } from '../api/employee-details-api';
import { getCountryLabel } from '../employee-options';
import { useEmployee } from '../hooks/useEmployee';
import { formatDate } from '../utils/date-format';
import { formatSalary } from '../utils/salary-format';

export function EmployeeDetails() {
  const { employeeId = '' } = useParams();
  const employee = useEmployee(employeeId);

  if (employee.isLoading) {
    return <EmployeeDetailsLoading />;
  }

  if (employee.isError) {
    if (
      employee.error instanceof EmployeeApiError &&
      employee.error.status === 404
    ) {
      return <EmployeeNotFound />;
    }

    return (
      <PageFrame>
        <Alert
          action={
            <Button
              color="inherit"
              onClick={() => void employee.refetch()}
              size="small"
            >
              Retry
            </Button>
          }
          severity="error"
        >
          We couldn't load this employee.
        </Alert>
      </PageFrame>
    );
  }

  if (!employee.data) {
    return null;
  }

  return <EmployeeDetailsContent employee={employee.data} />;
}

function EmployeeDetailsContent({
  employee,
}: {
  employee: EmployeeDetailsResponse;
}) {
  return (
    <PageFrame>
      <Box>
        <Typography component="h2" sx={{ fontWeight: 800 }} variant="h4">
          {employee.firstName} {employee.lastName}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          {employee.employeeCode}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: {
            xs: '1fr',
            lg: 'minmax(0, 2fr) minmax(280px, 1fr)',
          },
        }}
      >
        <InformationSection employee={employee} />
        <CurrentSalarySection employee={employee} />
      </Box>

      <SalaryHistorySection salaryHistory={employee.salaryHistory} />
    </PageFrame>
  );
}

function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <Stack spacing={3}>
      <Button
        aria-label="Back to employees"
        component={RouterLink}
        sx={{ alignSelf: 'flex-start', px: 0 }}
        to="/employees"
      >
        ← Back to employees
      </Button>
      {children}
    </Stack>
  );
}

function InformationSection({
  employee,
}: {
  employee: EmployeeDetailsResponse;
}) {
  const fields = [
    ['Email', employee.email],
    ['Department', employee.department],
    ['Job title', employee.jobTitle],
    ['Country', getCountryLabel(employee.countryCode)],
  ];

  return (
    <Paper
      component="section"
      sx={{ p: { xs: 2.5, sm: 3 } }}
      variant="outlined"
    >
      <Typography component="h3" sx={{ fontWeight: 750 }} variant="h6">
        Employee information
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Box
        component="dl"
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
          m: 0,
        }}
      >
        {fields.map(([label, value]) => (
          <Box key={label}>
            <Typography component="dt" color="text.secondary" variant="caption">
              {label}
            </Typography>
            <Typography
              component="dd"
              sx={{ m: 0, mt: 0.25, overflowWrap: 'anywhere' }}
            >
              {value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

function CurrentSalarySection({
  employee,
}: {
  employee: EmployeeDetailsResponse;
}) {
  return (
    <Paper
      component="section"
      sx={{ p: { xs: 2.5, sm: 3 } }}
      variant="outlined"
    >
      <Typography component="h3" sx={{ fontWeight: 750 }} variant="h6">
        Current salary
      </Typography>
      <Divider sx={{ my: 2 }} />
      {employee.currentSalary ? (
        <Stack spacing={0.75}>
          <Typography sx={{ fontWeight: 800 }} variant="h5">
            {formatSalary(employee.currentSalary)}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {employee.currentSalary.currency}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Effective {formatDate(employee.currentSalary.effectiveFrom)}
          </Typography>
        </Stack>
      ) : (
        <Typography color="text.secondary">
          No current salary recorded.
        </Typography>
      )}
    </Paper>
  );
}

function SalaryHistorySection({
  salaryHistory,
}: {
  salaryHistory: SalaryHistoryItem[];
}) {
  return (
    <Box component="section">
      <Typography component="h3" sx={{ fontWeight: 750, mb: 1.5 }} variant="h6">
        Salary history
      </Typography>
      {salaryHistory.length === 0 ? (
        <Paper sx={{ p: 3 }} variant="outlined">
          <Typography color="text.secondary">
            No salary history recorded.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table aria-label="Salary history">
            <TableHead>
              <TableRow>
                <TableCell>Effective date</TableCell>
                <TableCell>Salary</TableCell>
                <TableCell>Currency</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {salaryHistory.map((salary) => {
                const scheduled = new Date(salary.effectiveFrom) > new Date();

                return (
                  <TableRow key={salary.id}>
                    <TableCell>{formatDate(salary.effectiveFrom)}</TableCell>
                    <TableCell>{formatSalary(salary)}</TableCell>
                    <TableCell>{salary.currency}</TableCell>
                    <TableCell>
                      {scheduled ? (
                        <Chip label="Scheduled" size="small" />
                      ) : (
                        'Effective'
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

function EmployeeDetailsLoading() {
  return (
    <Box aria-label="Loading employee details" role="status">
      <Skeleton height={36} width={150} />
      <Skeleton height={52} sx={{ mt: 2 }} width="min(100%, 360px)" />
      <Skeleton height={220} sx={{ mt: 3 }} variant="rounded" />
      <Skeleton height={260} sx={{ mt: 3 }} variant="rounded" />
    </Box>
  );
}

function EmployeeNotFound() {
  return (
    <PageFrame>
      <Paper
        sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center' }}
        variant="outlined"
      >
        <Typography component="h2" sx={{ fontWeight: 800 }} variant="h4">
          Employee not found
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          The employee may have been removed or the link may be invalid.
        </Typography>
      </Paper>
    </PageFrame>
  );
}
