import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { App } from './App';

vi.mock('./features/employees/components/EmployeeDirectory', () => ({
  EmployeeDirectory: () => <div>Employee directory</div>,
}));

vi.mock('./features/employees/components/EmployeeDetails', () => ({
  EmployeeDetails: () => <div>Employee details</div>,
}));

describe('App', () => {
  it('renders the application heading', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'ACME Salary Management' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Employee directory')).toBeInTheDocument();
  });
});
