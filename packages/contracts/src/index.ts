import { z } from 'zod';

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

export const CURRENCY_BY_COUNTRY = {
  US: 'USD',
  IN: 'INR',
  AE: 'AED',
  GB: 'GBP',
  DE: 'EUR',
  SG: 'SGD',
  AU: 'AUD',
  CA: 'CAD',
} as const satisfies Readonly<Record<string, SupportedCurrency>>;

const integerQueryParameterSchema = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number);

const searchQueryParameterSchema = z
  .string()
  .trim()
  .max(100)
  .transform((search) => search || undefined);

export const countryFilterSchema = z
  .string()
  .trim()
  .transform((country) => country.toUpperCase())
  .pipe(z.string().regex(/^[A-Z]{2}$/));

export const departmentFilterSchema = z.string().trim().min(1).max(100);

export const employeeSortFieldSchema = z.enum([
  'employeeCode',
  'firstName',
  'lastName',
  'department',
  'country',
]);

export type EmployeeSortField = z.infer<typeof employeeSortFieldSchema>;

export const sortOrderSchema = z.enum(['asc', 'desc']);

export type SortOrder = z.infer<typeof sortOrderSchema>;

export const employeeListQuerySchema = z
  .object({
    page: integerQueryParameterSchema
      .pipe(z.number().int().safe().positive())
      .default(1),
    pageSize: integerQueryParameterSchema
      .pipe(z.number().int().safe().min(1).max(100))
      .default(25),
    search: searchQueryParameterSchema.optional(),
    country: countryFilterSchema.optional(),
    department: departmentFilterSchema.optional(),
    sortBy: employeeSortFieldSchema.optional(),
    sortOrder: sortOrderSchema.optional(),
  })
  .strict()
  .superRefine((query, context) => {
    if (query.sortOrder && !query.sortBy) {
      context.addIssue({
        code: 'custom',
        path: ['sortOrder'],
        message: 'sortOrder requires sortBy.',
      });
    }
  });

export type EmployeeListQuery = z.infer<typeof employeeListQuerySchema>;

export const currentSalarySchema = z
  .object({
    amountMinor: z.number().int().safe().positive(),
    currency: z.string().regex(/^[A-Z]{3}$/),
    effectiveFrom: z.iso.datetime(),
  })
  .strict();

export type CurrentSalary = z.infer<typeof currentSalarySchema>;

export const employeeListItemSchema = z
  .object({
    id: z.string(),
    employeeCode: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.email(),
    countryCode: z.string(),
    department: z.string(),
    jobTitle: z.string(),
    currentSalary: currentSalarySchema.nullable(),
  })
  .strict();

export type EmployeeListItem = z.infer<typeof employeeListItemSchema>;

export const paginationMetadataSchema = z
  .object({
    page: z.number().int().positive(),
    pageSize: z.number().int().min(1).max(100),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })
  .strict();

export type PaginationMetadata = z.infer<typeof paginationMetadataSchema>;

export const employeeListResponseSchema = z
  .object({
    data: z.array(employeeListItemSchema),
    pagination: paginationMetadataSchema,
  })
  .strict();

export type EmployeeListResponse = z.infer<typeof employeeListResponseSchema>;

export const salaryHistoryItemSchema = currentSalarySchema.extend({
  id: z.string(),
});

export type SalaryHistoryItem = z.infer<typeof salaryHistoryItemSchema>;

export const employeeDetailsResponseSchema = employeeListItemSchema
  .omit({ currentSalary: true })
  .extend({
    currentSalary: currentSalarySchema.nullable(),
    salaryHistory: z.array(salaryHistoryItemSchema),
  })
  .strict();

export type EmployeeDetailsResponse = z.infer<
  typeof employeeDetailsResponseSchema
>;

export const createSalaryRequestSchema = z
  .object({
    amountMinor: z.number(),
    currency: z.string(),
    effectiveFrom: z.iso.date(),
  })
  .strict();

export type CreateSalaryRequest = z.infer<typeof createSalaryRequestSchema>;

export const createdSalarySchema = salaryHistoryItemSchema.extend({
  createdAt: z.iso.datetime(),
});

export type CreatedSalary = z.infer<typeof createdSalarySchema>;

export const createSalaryResponseSchema = z
  .object({ salary: createdSalarySchema })
  .strict();

export type CreateSalaryResponse = z.infer<typeof createSalaryResponseSchema>;

export const analyticsFiltersSchema = z
  .object({
    country: countryFilterSchema.optional(),
    department: departmentFilterSchema.optional(),
  })
  .strict();

export type AnalyticsFilters = z.infer<typeof analyticsFiltersSchema>;

export const compensationMetricSchema = z
  .object({
    currency: z.string().regex(/^[A-Z]{3}$/),
    employeeCount: z.number().int().positive(),
    averageSalaryMinor: z.number().int().positive(),
    medianSalaryMinor: z.number().int().positive(),
    minSalaryMinor: z.number().int().positive(),
    maxSalaryMinor: z.number().int().positive(),
  })
  .strict();

export type CompensationMetric = z.infer<typeof compensationMetricSchema>;

export const compensationSummaryResponseSchema = z
  .object({
    headcount: z.number().int().nonnegative(),
    employeesWithSalary: z.number().int().nonnegative(),
    employeesWithoutSalary: z.number().int().nonnegative(),
    compensationByCurrency: z.array(compensationMetricSchema),
  })
  .strict();

export type CompensationSummaryResponse = z.infer<
  typeof compensationSummaryResponseSchema
>;

export const departmentAnalyticsQuerySchema = z
  .object({ country: countryFilterSchema.optional() })
  .strict();

export type DepartmentAnalyticsQuery = z.infer<
  typeof departmentAnalyticsQuerySchema
>;

export const countryAnalyticsQuerySchema = z
  .object({ department: departmentFilterSchema.optional() })
  .strict();

export type CountryAnalyticsQuery = z.infer<typeof countryAnalyticsQuerySchema>;

const analyticsGroupPopulationSchema = z.object({
  headcount: z.number().int().nonnegative(),
  employeesWithSalary: z.number().int().nonnegative(),
  employeesWithoutSalary: z.number().int().nonnegative(),
  compensationByCurrency: z.array(compensationMetricSchema),
});

export const departmentAnalyticsItemSchema = analyticsGroupPopulationSchema
  .extend({ department: z.string() })
  .strict();

export type DepartmentAnalyticsItem = z.infer<
  typeof departmentAnalyticsItemSchema
>;

export const departmentAnalyticsResponseSchema = z
  .object({ data: z.array(departmentAnalyticsItemSchema) })
  .strict();

export type DepartmentAnalyticsResponse = z.infer<
  typeof departmentAnalyticsResponseSchema
>;

export const countryAnalyticsItemSchema = analyticsGroupPopulationSchema
  .extend({ countryCode: z.string() })
  .strict();

export type CountryAnalyticsItem = z.infer<typeof countryAnalyticsItemSchema>;

export const countryAnalyticsResponseSchema = z
  .object({ data: z.array(countryAnalyticsItemSchema) })
  .strict();

export type CountryAnalyticsResponse = z.infer<
  typeof countryAnalyticsResponseSchema
>;

export const apiErrorResponseSchema = z
  .object({
    error: z
      .object({
        code: z.enum([
          'VALIDATION_ERROR',
          'EMPLOYEE_NOT_FOUND',
          'INVALID_SALARY',
          'UNSUPPORTED_CURRENCY',
          'SALARY_EFFECTIVE_DATE_CONFLICT',
          'INTERNAL_ERROR',
        ]),
        message: z.string(),
      })
      .strict(),
  })
  .strict();

export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
