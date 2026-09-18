import type { EmployeeDetailsResponse } from '@acme/contracts';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestQueryClient } from '../../../test/query-client';
import { EmployeeApiError, getEmployee } from '../api/employee-details-api';
import { EmployeeDetails } from './EmployeeDetails';

vi.mock('../api/employee-details-api', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('../api/employee-details-api')>();

  return { ...original, getEmployee: vi.fn() };
});

const mockedGetEmployee = vi.mocked(getEmployee);

describe('EmployeeDetails', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-06-01T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('renders employee information and current salary', async () => {
    mockedGetEmployee.mockResolvedValue(employeeDetailsResponse());

    renderDetails();

    expect(
      await screen.findByRole('heading', { name: 'Ava Patel' }),
    ).toBeInTheDocument();
    expect(screen.getByText('EMP000500')).toBeInTheDocument();
    expect(
      screen.getByText('ava.patel.000500@acme.example'),
    ).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('United Arab Emirates')).toBeInTheDocument();
    expect(screen.getAllByText('AED 300,000.00').length).toBeGreaterThan(0);
    expect(screen.getByText('Effective Jan 1, 2026')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Change salary' }),
    ).toBeInTheDocument();
  });

  it('opens the salary change dialog from employee details', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockedGetEmployee.mockResolvedValue(employeeDetailsResponse());
    renderDetails();

    await user.click(
      await screen.findByRole('button', { name: 'Change salary' }),
    );

    expect(
      screen.getByRole('dialog', { name: 'Change salary' }),
    ).toBeInTheDocument();
  });

  it('shows success feedback after a salary change', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockedGetEmployee.mockResolvedValue(employeeDetailsResponse());
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            salary: {
              id: 'salary-new',
              amountMinor: 31_000_000,
              currency: 'AED',
              effectiveFrom: '2026-10-01T00:00:00.000Z',
              createdAt: '2026-09-17T12:00:00.000Z',
            },
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );
    renderDetails();

    await user.click(
      await screen.findByRole('button', { name: 'Change salary' }),
    );
    await user.type(screen.getByLabelText('New annual salary'), '310000');
    await user.type(screen.getByLabelText('Effective date'), '2026-10-01');
    await user.click(screen.getByRole('button', { name: 'Save change' }));

    expect(await screen.findByText('Salary change saved.')).toBeInTheDocument();
  });

  it('refreshes visible current salary and history after a successful change', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const updatedEmployee = employeeDetailsResponse();
    updatedEmployee.currentSalary = {
      amountMinor: 31_000_000,
      currency: 'AED',
      effectiveFrom: '2026-05-01T00:00:00.000Z',
    };
    updatedEmployee.salaryHistory = [
      {
        id: 'salary-new',
        amountMinor: 31_000_000,
        currency: 'AED',
        effectiveFrom: '2026-05-01T00:00:00.000Z',
      },
      ...updatedEmployee.salaryHistory,
    ];
    mockedGetEmployee
      .mockResolvedValueOnce(employeeDetailsResponse())
      .mockResolvedValue(updatedEmployee);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            salary: {
              id: 'salary-new',
              amountMinor: 31_000_000,
              currency: 'AED',
              effectiveFrom: '2026-05-01T00:00:00.000Z',
              createdAt: '2026-06-01T12:00:00.000Z',
            },
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );
    renderDetails();

    await user.click(
      await screen.findByRole('button', { name: 'Change salary' }),
    );
    await user.type(screen.getByLabelText('New annual salary'), '310000');
    await user.type(screen.getByLabelText('Effective date'), '2026-05-01');
    await user.click(screen.getByRole('button', { name: 'Save change' }));

    expect(await screen.findByText('Salary change saved.')).toBeInTheDocument();
    await waitFor(() => expect(mockedGetEmployee).toHaveBeenCalledTimes(2));
    expect(screen.getAllByText('AED 310,000.00').length).toBeGreaterThan(0);
    const table = screen.getByRole('table', { name: 'Salary history' });
    const newSalaryRow = within(table).getByText('May 1, 2026').closest('tr');
    expect(newSalaryRow).not.toBeNull();
    expect(within(newSalaryRow!).getByText('Current')).toBeInTheDocument();
  });

  it('renders salary history newest first and labels future records', async () => {
    mockedGetEmployee.mockResolvedValue(employeeDetailsResponse());

    renderDetails();

    const table = await screen.findByRole('table', { name: 'Salary history' });
    const rows = within(table).getAllByRole('row').slice(1);

    expect(within(rows[0]!).getByText('Jan 1, 2027')).toBeInTheDocument();
    expect(within(rows[0]!).getByText('Scheduled')).toBeInTheDocument();
    expect(within(rows[1]!).getByText('Jan 1, 2026')).toBeInTheDocument();
    expect(within(rows[1]!).getByText('Current')).toBeInTheDocument();
    expect(within(rows[2]!).getByText('Jan 1, 2025')).toBeInTheDocument();
    expect(within(rows[2]!).getByText('Historical')).toBeInTheDocument();
  });

  it('renders a clear empty salary state', async () => {
    mockedGetEmployee.mockResolvedValue({
      ...employeeDetailsResponse(),
      currentSalary: null,
      salaryHistory: [],
    });

    renderDetails();

    expect(
      await screen.findByText('No current salary recorded.'),
    ).toBeInTheDocument();
    expect(screen.getByText('No salary history recorded.')).toBeInTheDocument();
  });

  it('shows a stable loading state', () => {
    mockedGetEmployee.mockReturnValue(new Promise(() => undefined));

    renderDetails();

    expect(
      screen.getByRole('status', { name: 'Loading employee details' }),
    ).toBeInTheDocument();
  });

  it('shows an unexpected error and retries the request', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockedGetEmployee
      .mockRejectedValueOnce(new EmployeeApiError(500))
      .mockResolvedValueOnce(employeeDetailsResponse());

    renderDetails();

    expect(
      await screen.findByText("We couldn't load this employee."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(
      await screen.findByRole('heading', { name: 'Ava Patel' }),
    ).toBeInTheDocument();
    expect(mockedGetEmployee).toHaveBeenCalledTimes(2);
  });

  it('shows a dedicated not-found experience for a 404', async () => {
    mockedGetEmployee.mockRejectedValue(new EmployeeApiError(404));

    renderDetails();

    expect(
      await screen.findByRole('heading', { name: 'Employee not found' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'The employee may have been removed or the link may be invalid.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Back to employees' }),
    ).toHaveAttribute('href', '/employees');
  });

  it('requests the employee identified by the route', async () => {
    mockedGetEmployee.mockResolvedValue(employeeDetailsResponse());

    renderDetails('/employees/employee-500');

    await waitFor(() =>
      expect(mockedGetEmployee).toHaveBeenCalledWith('employee-500'),
    );
  });

  it('returns to the employee directory through the back link', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockedGetEmployee.mockResolvedValue(employeeDetailsResponse());
    renderDetails();

    await user.click(
      await screen.findByRole('link', { name: 'Back to employees' }),
    );

    expect(
      screen.getByRole('heading', { name: 'Employee directory route' }),
    ).toBeInTheDocument();
  });
});

function renderDetails(initialEntry = '/employees/employee-500') {
  const queryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route
            path="/employees"
            element={<h2>Employee directory route</h2>}
          />
          <Route path="/employees/:employeeId" element={<EmployeeDetails />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function employeeDetailsResponse(): EmployeeDetailsResponse {
  return {
    id: 'employee-500',
    employeeCode: 'EMP000500',
    firstName: 'Ava',
    lastName: 'Patel',
    email: 'ava.patel.000500@acme.example',
    countryCode: 'AE',
    department: 'Engineering',
    jobTitle: 'Senior Software Engineer',
    currentSalary: {
      amountMinor: 30_000_000,
      currency: 'AED',
      effectiveFrom: '2026-01-01T00:00:00.000Z',
    },
    salaryHistory: [
      {
        id: 'salary-3',
        amountMinor: 33_000_000,
        currency: 'AED',
        effectiveFrom: '2027-01-01T00:00:00.000Z',
      },
      {
        id: 'salary-2',
        amountMinor: 30_000_000,
        currency: 'AED',
        effectiveFrom: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'salary-1',
        amountMinor: 27_000_000,
        currency: 'AED',
        effectiveFrom: '2025-01-01T00:00:00.000Z',
      },
    ],
  };
}
