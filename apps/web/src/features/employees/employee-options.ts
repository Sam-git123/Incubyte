export const COUNTRY_OPTIONS = [
  { code: 'US', label: 'United States' },
  { code: 'IN', label: 'India' },
  { code: 'AE', label: 'United Arab Emirates' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'DE', label: 'Germany' },
  { code: 'SG', label: 'Singapore' },
  { code: 'AU', label: 'Australia' },
  { code: 'CA', label: 'Canada' },
] as const;

export const DEPARTMENT_OPTIONS = [
  'Engineering',
  'Product',
  'Finance',
  'Human Resources',
  'Sales',
  'Marketing',
  'Operations',
  'Customer Success',
] as const;

export function getCountryLabel(countryCode: string): string {
  return (
    COUNTRY_OPTIONS.find(({ code }) => code === countryCode)?.label ??
    countryCode
  );
}
