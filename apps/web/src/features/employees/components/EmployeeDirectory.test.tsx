import type { EmployeeListResponse } from '@acme/contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getEmployees } from '../api/employees-api';
import { EmployeeDirectory } from './EmployeeDirectory';

vi.mock('../api/employees-api', () => ({
  getEmployees: vi.fn(),
}));

const mockedGetEmployees = vi.mocked(getEmployees);

describe('EmployeeDirectory', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders employee data returned by the API', async () => {
    mockedGetEmployees.mockResolvedValue(employeeResponse());

    renderDirectory();

    expect(await screen.findByText('Ava Patel')).toBeInTheDocument();
    expect(
      screen.getByRole('gridcell', { name: 'Engineering' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('gridcell', { name: 'United Arab Emirates' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('gridcell', { name: '$125,000.00' }),
    ).toBeInTheDocument();
    expect(screen.getByText('100 employees')).toBeInTheDocument();
  });

  it('shows a table loading state while the request is unresolved', () => {
    mockedGetEmployees.mockReturnValue(new Promise(() => undefined));

    renderDirectory();

    expect(
      screen.getByRole('progressbar', { name: 'Loading employees' }),
    ).toBeInTheDocument();
  });

  it('shows a friendly error and retries the request', async () => {
    const user = userEvent.setup();
    mockedGetEmployees
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValueOnce(employeeResponse());

    renderDirectory();

    expect(
      await screen.findByText("We couldn't load employees."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Ava Patel')).toBeInTheDocument();
    expect(mockedGetEmployees).toHaveBeenCalledTimes(2);
  });

  it('distinguishes an empty organization from filtered empty results', async () => {
    const user = userEvent.setup();
    mockedGetEmployees.mockResolvedValue(emptyResponse());

    renderDirectory();

    expect(
      await screen.findByText('No employees available.'),
    ).toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Country' }),
      'AE',
    );

    expect(
      await screen.findByText(
        'No employees match your current search or filters.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Clear filters' }),
    ).toBeInTheDocument();
  });

  it('debounces search and maps it to the employee request', async () => {
    mockedGetEmployees.mockResolvedValue(employeeResponse());
    renderDirectory();
    await screen.findByText('Ava Patel');
    const user = userEvent.setup();

    await user.type(
      screen.getByRole('searchbox', { name: 'Search employees' }),
      '  Ava  ',
    );

    expect(mockedGetEmployees).toHaveBeenCalledTimes(1);

    await waitFor(() =>
      expect(mockedGetEmployees).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1, search: 'Ava' }),
      ),
    );
  });

  it('sends country and department filters and resets pagination', async () => {
    const user = userEvent.setup();
    mockedGetEmployees.mockResolvedValue(employeeResponse());
    renderDirectory();
    await screen.findByText('Ava Patel');

    await user.click(screen.getByRole('button', { name: /next page/i }));
    await waitFor(() =>
      expect(mockedGetEmployees).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2 }),
      ),
    );

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Country' }),
      'AE',
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Department' }),
      'Engineering',
    );

    await waitFor(() =>
      expect(mockedGetEmployees).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 1,
          country: 'AE',
          department: 'Engineering',
        }),
      ),
    );
  });

  it('converts DataGrid pagination and sorting into API query values', async () => {
    const user = userEvent.setup();
    mockedGetEmployees.mockResolvedValue(employeeResponse());
    renderDirectory();
    await screen.findByText('Ava Patel');

    await user.click(screen.getByRole('button', { name: /next page/i }));
    await waitFor(() =>
      expect(mockedGetEmployees).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2, pageSize: 25 }),
      ),
    );

    await user.click(
      screen.getByRole('columnheader', { name: /employee id/i }),
    );

    await waitFor(() =>
      expect(mockedGetEmployees).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 1,
          sortBy: 'employeeCode',
          sortOrder: 'asc',
        }),
      ),
    );
  });

  it('opens the selected employee details route from the employee name', async () => {
    const user = userEvent.setup();
    mockedGetEmployees.mockResolvedValue(employeeResponse());
    renderDirectory(true);

    await user.click(await screen.findByRole('link', { name: 'Ava Patel' }));

    expect(
      screen.getByRole('heading', { name: 'Employee details route' }),
    ).toBeInTheDocument();
  });
});

function renderDirectory(withDetailsRoute = false) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/employees']}>
        <Routes>
          <Route path="/employees" element={<EmployeeDirectory />} />
          {withDetailsRoute ? (
            <Route
              path="/employees/:employeeId"
              element={<h2>Employee details route</h2>}
            />
          ) : null}
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function employeeResponse(): EmployeeListResponse {
  return {
    data: [
      {
        id: 'employee-1',
        employeeCode: 'EMP000001',
        firstName: 'Ava',
        lastName: 'Patel',
        email: 'ava.patel.000001@acme.example',
        countryCode: 'AE',
        department: 'Engineering',
        jobTitle: 'Senior Software Engineer',
        currentSalary: {
          amountMinor: 12_500_000,
          currency: 'USD',
          effectiveFrom: '2026-01-01T00:00:00.000Z',
        },
      },
    ],
    pagination: {
      page: 1,
      pageSize: 25,
      total: 100,
      totalPages: 4,
    },
  };
}

function emptyResponse(): EmployeeListResponse {
  return {
    data: [],
    pagination: {
      page: 1,
      pageSize: 25,
      total: 0,
      totalPages: 0,
    },
  };
}
