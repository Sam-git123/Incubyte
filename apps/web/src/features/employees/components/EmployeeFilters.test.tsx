import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EmployeeFilters } from './EmployeeFilters';

describe('EmployeeFilters', () => {
  it('keeps empty select labels clear of their all-options', () => {
    render(
      <EmployeeFilters
        country=""
        department=""
        hasActiveFilters={false}
        onClear={vi.fn()}
        onCountryChange={vi.fn()}
        onDepartmentChange={vi.fn()}
        onSearchChange={vi.fn()}
        search=""
      />,
    );

    expect(screen.getByText('Country', { selector: 'label' })).toHaveAttribute(
      'data-shrink',
      'true',
    );
    expect(
      screen.getByText('Department', { selector: 'label' }),
    ).toHaveAttribute('data-shrink', 'true');
    expect(screen.getByLabelText('Country')).toHaveValue('');
    expect(screen.getByLabelText('Department')).toHaveValue('');
  });
});
