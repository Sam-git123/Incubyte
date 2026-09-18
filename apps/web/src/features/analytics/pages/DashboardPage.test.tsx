import type {
  CompensationSummaryResponse,
  CountryAnalyticsResponse,
  DepartmentAnalyticsResponse,
} from '@acme/contracts';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createTestQueryClient } from '../../../test/query-client';
import {
  getCompensationSummary,
  getCountryAnalytics,
  getDepartmentAnalytics,
} from '../api/analytics-api';
import { DashboardPage } from './DashboardPage';

vi.mock('../api/analytics-api', () => ({
  getCompensationSummary: vi.fn(),
  getCountryAnalytics: vi.fn(),
  getDepartmentAnalytics: vi.fn(),
}));

const mockedGetCompensationSummary = vi.mocked(getCompensationSummary);
const mockedGetCountryAnalytics = vi.mocked(getCountryAnalytics);
const mockedGetDepartmentAnalytics = vi.mocked(getDepartmentAnalytics);

describe('DashboardPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders organization counts and separate currency compensation groups', async () => {
    arrangeSuccessfulRequests();

    renderDashboard();

    const summary = await screen.findByRole('region', {
      name: 'Organization summary',
    });
    expect(within(summary).getByText('10 employees')).toBeInTheDocument();
    expect(within(summary).getByText('8 employees')).toBeInTheDocument();
    expect(within(summary).getByText('2 employees')).toBeInTheDocument();
    expect(
      within(summary).getByText('80% salary coverage'),
    ).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'AED' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'USD' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'INR' })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /global average salary/i }),
    ).not.toBeInTheDocument();
  });

  it('sends only supported filters to each analytics endpoint', async () => {
    arrangeSuccessfulRequests();
    const user = userEvent.setup();
    renderDashboard();
    await screen.findByText('10 employees');

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Country' }),
      'AE',
    );

    await waitFor(() => {
      expect(mockedGetCompensationSummary).toHaveBeenCalledWith({
        country: 'AE',
      });
      expect(mockedGetDepartmentAnalytics).toHaveBeenCalledWith({
        country: 'AE',
      });
      expect(mockedGetCountryAnalytics).toHaveBeenCalledWith({});
    });

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Department' }),
      'Engineering',
    );

    await waitFor(() => {
      expect(mockedGetCompensationSummary).toHaveBeenCalledWith({
        country: 'AE',
        department: 'Engineering',
      });
      expect(mockedGetDepartmentAnalytics).toHaveBeenCalledWith({
        country: 'AE',
      });
      expect(mockedGetCountryAnalytics).toHaveBeenCalledWith({
        department: 'Engineering',
      });
    });
  });

  it('clears active filters and restores unfiltered analytics', async () => {
    arrangeSuccessfulRequests();
    const user = userEvent.setup();
    renderDashboard();
    await screen.findByText('10 employees');

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Country' }),
      'AE',
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Department' }),
      'Engineering',
    );
    await screen.findByRole('button', { name: 'Clear filters' });
    vi.clearAllMocks();

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    await waitFor(() => {
      expect(mockedGetCompensationSummary).toHaveBeenCalledWith({});
      expect(mockedGetDepartmentAnalytics).toHaveBeenCalledWith({});
      expect(mockedGetCountryAnalytics).toHaveBeenCalledWith({});
    });
    expect(screen.getByRole('combobox', { name: 'Country' })).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'Department' })).toHaveValue(
      '',
    );
  });

  it('keeps the dashboard structure visible while analytics load', () => {
    const pending = new Promise<never>(() => undefined);
    mockedGetCompensationSummary.mockReturnValue(pending);
    mockedGetDepartmentAnalytics.mockReturnValue(pending);
    mockedGetCountryAnalytics.mockReturnValue(pending);

    renderDashboard();

    expect(
      screen.getByRole('heading', { name: 'Compensation insights' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('status', { name: 'Loading summary metrics' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('status', { name: 'Loading department analytics' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('status', { name: 'Loading country analytics' }),
    ).toBeInTheDocument();
  });

  it('shows a coherent error with a retry action when a request fails', async () => {
    mockedGetCompensationSummary.mockRejectedValue(new Error('Unavailable'));
    mockedGetDepartmentAnalytics.mockResolvedValue(departmentResponse());
    mockedGetCountryAnalytics.mockResolvedValue(countryResponse());

    renderDashboard();

    expect(
      await screen.findByText("We couldn't load compensation insights."),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('shows a useful empty state instead of zero-value salary visuals', async () => {
    mockedGetCompensationSummary.mockResolvedValue({
      headcount: 0,
      employeesWithSalary: 0,
      employeesWithoutSalary: 0,
      compensationByCurrency: [],
    });
    mockedGetDepartmentAnalytics.mockResolvedValue({ data: [] });
    mockedGetCountryAnalytics.mockResolvedValue({ data: [] });

    renderDashboard();

    expect(
      await screen.findByText('No employee compensation data is available.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Compensation by currency' }),
    ).not.toBeInTheDocument();
  });

  it('distinguishes a filtered empty result and lets the user clear filters', async () => {
    arrangeSuccessfulRequests();
    mockedGetCompensationSummary.mockImplementation(async (filters) =>
      filters.country
        ? {
            headcount: 0,
            employeesWithSalary: 0,
            employeesWithoutSalary: 0,
            compensationByCurrency: [],
          }
        : summaryResponse(),
    );
    const user = userEvent.setup();
    renderDashboard();
    await screen.findByText('10 employees');

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Country' }),
      'AE',
    );

    expect(
      await screen.findByText('No employees match these filters.'),
    ).toBeInTheDocument();
    const emptyState = screen.getByText(
      'No employees match these filters.',
    ).parentElement;
    expect(emptyState).not.toBeNull();
    await user.click(
      within(emptyState!).getByRole('button', { name: 'Clear filters' }),
    );
    expect(await screen.findByText('10 employees')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Country' })).toHaveValue('');
  });

  it('renders accessible department headcount data without mixed-currency salary comparisons', async () => {
    arrangeSuccessfulRequests();

    renderDashboard();

    const chart = await screen.findByRole('img', {
      name: 'Employee headcount by department',
    });
    expect(chart).toHaveTextContent('Engineering');
    expect(chart).toHaveTextContent('6');
    expect(chart).toHaveTextContent('Sales');
    expect(chart).toHaveTextContent('4');
    expect(
      screen.getByText(/organization-wide department comparison/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Average salary by department'),
    ).not.toBeInTheDocument();
  });

  it('renders country metrics with an explicit currency for every salary value', async () => {
    arrangeSuccessfulRequests();

    renderDashboard();

    const table = await screen.findByRole('table', {
      name: 'Compensation by country',
    });
    expect(table).toHaveTextContent('United Arab Emirates');
    expect(table).toHaveTextContent('AED');
    expect(table).toHaveTextContent('United States');
    expect(table).toHaveTextContent('USD');
    expect(table).toHaveTextContent('India');
    expect(table).toHaveTextContent('INR');
  });
});

function renderDashboard() {
  const queryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function arrangeSuccessfulRequests() {
  mockedGetCompensationSummary.mockImplementation(async () =>
    summaryResponse(),
  );
  mockedGetDepartmentAnalytics.mockResolvedValue(departmentResponse());
  mockedGetCountryAnalytics.mockResolvedValue(countryResponse());
}

function summaryResponse(): CompensationSummaryResponse {
  return {
    headcount: 10,
    employeesWithSalary: 8,
    employeesWithoutSalary: 2,
    compensationByCurrency: [
      metric('AED', 3, 28_500_000, 27_000_000, 9_000_000, 65_000_000),
      metric('INR', 2, 20_000_000, 19_000_000, 12_000_000, 28_000_000),
      metric('USD', 3, 12_500_000, 12_000_000, 8_000_000, 18_000_000),
    ],
  };
}

function departmentResponse(): DepartmentAnalyticsResponse {
  return {
    data: [
      {
        department: 'Engineering',
        headcount: 6,
        employeesWithSalary: 5,
        employeesWithoutSalary: 1,
        compensationByCurrency: [
          metric('AED', 2, 30_000_000, 30_000_000, 25_000_000, 35_000_000),
          metric('USD', 3, 13_000_000, 12_500_000, 10_000_000, 16_500_000),
        ],
      },
      {
        department: 'Sales',
        headcount: 4,
        employeesWithSalary: 3,
        employeesWithoutSalary: 1,
        compensationByCurrency: [
          metric('INR', 2, 20_000_000, 19_000_000, 12_000_000, 28_000_000),
          metric('USD', 1, 11_000_000, 11_000_000, 11_000_000, 11_000_000),
        ],
      },
    ],
  };
}

function countryResponse(): CountryAnalyticsResponse {
  return {
    data: [
      {
        countryCode: 'AE',
        headcount: 3,
        employeesWithSalary: 3,
        employeesWithoutSalary: 0,
        compensationByCurrency: [
          metric('AED', 3, 28_500_000, 27_000_000, 9_000_000, 65_000_000),
        ],
      },
      {
        countryCode: 'IN',
        headcount: 3,
        employeesWithSalary: 2,
        employeesWithoutSalary: 1,
        compensationByCurrency: [
          metric('INR', 2, 20_000_000, 19_000_000, 12_000_000, 28_000_000),
        ],
      },
      {
        countryCode: 'US',
        headcount: 4,
        employeesWithSalary: 3,
        employeesWithoutSalary: 1,
        compensationByCurrency: [
          metric('USD', 3, 12_500_000, 12_000_000, 8_000_000, 18_000_000),
        ],
      },
    ],
  };
}

function metric(
  currency: string,
  employeeCount: number,
  averageSalaryMinor: number,
  medianSalaryMinor: number,
  minSalaryMinor: number,
  maxSalaryMinor: number,
) {
  return {
    currency,
    employeeCount,
    averageSalaryMinor,
    medianSalaryMinor,
    minSalaryMinor,
    maxSalaryMinor,
  };
}
