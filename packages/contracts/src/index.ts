import { z } from 'zod';

const integerQueryParameterSchema = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number);

export const employeeListQuerySchema = z
  .object({
    page: integerQueryParameterSchema
      .pipe(z.number().int().safe().positive())
      .default(1),
    pageSize: integerQueryParameterSchema
      .pipe(z.number().int().safe().min(1).max(100))
      .default(25),
  })
  .strict();

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

export const apiErrorResponseSchema = z
  .object({
    error: z
      .object({
        code: z.enum(['VALIDATION_ERROR', 'INTERNAL_ERROR']),
        message: z.string(),
      })
      .strict(),
  })
  .strict();

export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
