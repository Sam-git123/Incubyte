import type { CurrentSalary } from '@acme/contracts';

export function formatMoney(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

export function formatSalary(salary: CurrentSalary | null): string {
  if (!salary) {
    return 'Not set';
  }

  return formatMoney(salary.amountMinor, salary.currency);
}
