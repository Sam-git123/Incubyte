export const SUPPORTED_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'INR',
  'AED',
  'SGD',
  'AUD',
  'CAD',
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export type SalaryInput = {
  amountMinor: number;
  currency: string;
};

export type Salary = Readonly<{
  amountMinor: number;
  currency: SupportedCurrency;
}>;

const supportedCurrencySet: ReadonlySet<string> = new Set(SUPPORTED_CURRENCIES);

export class SalaryValidationError extends Error {
  override readonly name = 'SalaryValidationError';
}

export function createSalary(input: SalaryInput): Salary {
  if (!Number.isInteger(input.amountMinor)) {
    throw new SalaryValidationError('Salary amount must be an integer.');
  }

  if (input.amountMinor <= 0) {
    throw new SalaryValidationError('Salary amount must be greater than zero.');
  }

  if (!isSupportedCurrency(input.currency)) {
    throw new SalaryValidationError(`Unsupported currency: ${input.currency}.`);
  }

  return Object.freeze({
    amountMinor: input.amountMinor,
    currency: input.currency,
  });
}

function isSupportedCurrency(currency: string): currency is SupportedCurrency {
  return supportedCurrencySet.has(currency);
}
