import { z } from 'zod';

const integerQueryParameterSchema = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number);

const searchQueryParameterSchema = z
  .string()
  .trim()
  .max(100)
  .transform((search) => search || undefined);

const countryQueryParameterSchema = z
  .string()
  .trim()
  .transform((country) => country.toUpperCase())
  .pipe(z.string().regex(/^[A-Z]{2}$/));

const departmentQueryParameterSchema = z.string().trim().min(1).max(100);

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
    country: countryQueryParameterSchema.optional(),
    department: departmentQueryParameterSchema.optional(),
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

export const apiErrorResponseSchema = z
  .object({
    error: z
      .object({
        code: z.enum([
          'VALIDATION_ERROR',
          'EMPLOYEE_NOT_FOUND',
          'INTERNAL_ERROR',
        ]),
        message: z.string(),
      })
      .strict(),
  })
  .strict();

export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
