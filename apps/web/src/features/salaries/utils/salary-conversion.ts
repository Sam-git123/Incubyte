const MAJOR_UNIT_PATTERN = /^-?\d+(?:\.\d{1,2})?$/;

export function majorUnitsToMinor(value: string): number | null {
  const normalized = value.trim();

  if (!MAJOR_UNIT_PATTERN.test(normalized)) {
    return null;
  }

  const negative = normalized.startsWith('-');
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [wholePart = '0', fractionalPart = ''] = unsigned.split('.');
  const amountMinor =
    Number(wholePart) * 100 + Number(fractionalPart.padEnd(2, '0'));

  if (!Number.isSafeInteger(amountMinor)) {
    return null;
  }

  return negative ? -amountMinor : amountMinor;
}

export function minorUnitsToMajor(amountMinor: number): string {
  const sign = amountMinor < 0 ? '-' : '';
  const absoluteAmount = Math.abs(amountMinor);
  const wholePart = Math.floor(absoluteAmount / 100);
  const fractionalPart = (absoluteAmount % 100).toString().padStart(2, '0');

  return `${sign}${wholePart}.${fractionalPart}`;
}
