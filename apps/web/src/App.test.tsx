import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { App } from './App';

vi.mock('./features/employees/components/EmployeeDirectory', () => ({
  EmployeeDirectory: () => <div>Employee directory</div>,
}));

describe('App', () => {
  it('renders the application heading', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'ACME Salary Management' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Employee directory')).toBeInTheDocument();
  });
});
