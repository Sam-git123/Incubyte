import type { CurrentSalary } from '@acme/contracts';

export function formatSalary(salary: CurrentSalary | null): string {
  if (!salary) {
    return 'Not set';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: salary.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(salary.amountMinor / 100);
}
