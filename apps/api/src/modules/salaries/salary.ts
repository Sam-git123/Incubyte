import {
  CURRENCY_BY_COUNTRY,
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from '@acme/contracts';

export {
  CURRENCY_BY_COUNTRY,
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from '@acme/contracts';

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

  constructor(
    message: string,
    readonly reason: 'INVALID_AMOUNT' | 'UNSUPPORTED_CURRENCY',
  ) {
    super(message);
  }
}

export function createSalary(input: SalaryInput): Salary {
  if (!Number.isInteger(input.amountMinor)) {
    throw new SalaryValidationError(
      'Salary amount must be an integer.',
      'INVALID_AMOUNT',
    );
  }

  if (input.amountMinor <= 0) {
    throw new SalaryValidationError(
      'Salary amount must be greater than zero.',
      'INVALID_AMOUNT',
    );
  }

  if (!isSupportedCurrency(input.currency)) {
    throw new SalaryValidationError(
      `Unsupported currency: ${input.currency}.`,
      'UNSUPPORTED_CURRENCY',
    );
  }

  return Object.freeze({
    amountMinor: input.amountMinor,
    currency: input.currency,
  });
}

function isSupportedCurrency(currency: string): currency is SupportedCurrency {
  return supportedCurrencySet.has(currency);
}

export function getCurrencyForCountry(
  countryCode: string,
): SupportedCurrency | undefined {
  return (CURRENCY_BY_COUNTRY as Readonly<Record<string, SupportedCurrency>>)[
    countryCode
  ];
}
