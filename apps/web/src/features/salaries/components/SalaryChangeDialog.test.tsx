import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SalaryChangeDialog } from './SalaryChangeDialog';

describe('SalaryChangeDialog', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('shows the current salary when opened', () => {
    renderDialog();

    expect(
      screen.getByRole('dialog', { name: 'Change salary' }),
    ).toBeInTheDocument();
    expect(screen.getByText('AED 280,000.00')).toBeInTheDocument();
    expect(screen.getByLabelText('Currency')).toHaveValue('AED');
  });

  it('rejects an empty salary', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText('Effective date'), '2026-10-01');
    await user.click(screen.getByRole('button', { name: 'Save change' }));

    expect(
      await screen.findByText('Enter a new annual salary.'),
    ).toBeInTheDocument();
  });

  it.each([
    ['0', 'Salary must be greater than zero.'],
    ['-1', 'Salary must be greater than zero.'],
    ['300000.123', 'Use no more than two decimal places.'],
  ])('rejects invalid salary input %s', async (value, message) => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText('New annual salary'), value);
    await user.type(screen.getByLabelText('Effective date'), '2026-10-01');
    await user.click(screen.getByRole('button', { name: 'Save change' }));

    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it('requires an effective date', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText('New annual salary'), '300000');
    await user.click(screen.getByRole('button', { name: 'Save change' }));

    expect(
      await screen.findByText('Choose an effective date.'),
    ).toBeInTheDocument();
  });

  it('submits integer minor units, refreshes salary queries, and reports success', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          salary: {
            id: 'salary-new',
            amountMinor: 30_000_050,
            currency: 'AED',
            effectiveFrom: '2026-10-01T00:00:00.000Z',
            createdAt: '2026-09-17T12:00:00.000Z',
          },
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const onSaved = vi.fn();
    const { queryClient } = renderDialog({ onSaved });
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    await user.type(screen.getByLabelText('New annual salary'), '300000.50');
    await user.type(screen.getByLabelText('Effective date'), '2026-10-01');
    await user.click(screen.getByRole('button', { name: 'Save change' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/employees/employee-500/salaries',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          amountMinor: 30_000_050,
          currency: 'AED',
          effectiveFrom: '2026-10-01',
        }),
      }),
    );
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['employee', 'employee-500'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['employees'],
    });
  });

  it('shows a useful duplicate effective-date error', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: 'SALARY_EFFECTIVE_DATE_CONFLICT',
              message:
                'A salary record already exists for this effective date.',
            },
          }),
          { status: 409, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );
    renderDialog();

    await user.type(screen.getByLabelText('New annual salary'), '300000');
    await user.type(screen.getByLabelText('Effective date'), '2026-01-01');
    await user.click(screen.getByRole('button', { name: 'Save change' }));

    expect(
      await screen.findByText(
        'A salary already exists for this effective date.',
      ),
    ).toBeInTheDocument();
  });

  it('disables saving while the request is pending', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(new Promise(() => undefined)),
    );
    renderDialog();

    await user.type(screen.getByLabelText('New annual salary'), '300000');
    await user.type(screen.getByLabelText('Effective date'), '2026-10-01');
    await user.click(screen.getByRole('button', { name: 'Save change' }));

    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
  });
});

function renderDialog({ onSaved = vi.fn() } = {}) {
  const trigger = document.createElement('button');
  document.body.append(trigger);
  trigger.focus();
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false, gcTime: Infinity },
    },
  });

  const result = render(
    <QueryClientProvider client={queryClient}>
      <SalaryChangeDialog
        currency="AED"
        currentSalary={{
          amountMinor: 28_000_000,
          currency: 'AED',
          effectiveFrom: '2026-01-01T00:00:00.000Z',
        }}
        employeeId="employee-500"
        onClose={vi.fn()}
        onSaved={onSaved}
        open
      />
    </QueryClientProvider>,
  );

  return { ...result, queryClient };
}
