import type { CompensationMetric } from '@acme/contracts';

export type CompensationValue = Readonly<{
  amountMinor: number;
  currency: string;
}>;

export function calculateMedian(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[middle]!;
  }

  const lower = sorted[middle - 1]!;
  const upper = sorted[middle]!;

  return Math.round(lower + (upper - lower) / 2);
}

export function calculateCompensationByCurrency(
  salaries: readonly CompensationValue[],
): CompensationMetric[] {
  const amountsByCurrency = new Map<string, number[]>();

  for (const salary of salaries) {
    const amounts = amountsByCurrency.get(salary.currency) ?? [];
    amounts.push(salary.amountMinor);
    amountsByCurrency.set(salary.currency, amounts);
  }

  return [...amountsByCurrency.entries()]
    .sort(([leftCurrency], [rightCurrency]) =>
      leftCurrency.localeCompare(rightCurrency),
    )
    .map(([currency, amounts]) => {
      const median = calculateMedian(amounts);

      if (median === null) {
        throw new Error('A currency group cannot be empty.');
      }

      return {
        currency,
        employeeCount: amounts.length,
        averageSalaryMinor: Math.round(
          amounts.reduce((total, amount) => total + amount, 0) / amounts.length,
        ),
        medianSalaryMinor: median,
        minSalaryMinor: Math.min(...amounts),
        maxSalaryMinor: Math.max(...amounts),
      };
    });
}
