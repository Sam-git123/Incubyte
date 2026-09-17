import { createSalaryRequestSchema } from '@acme/contracts';
import type { FastifyPluginAsync } from 'fastify';

import { SalaryValidationError } from './salary.js';
import {
  EmployeeNotFoundError,
  SalaryCurrencyMismatchError,
  SalaryEffectiveDateConflictError,
  type SalaryService,
} from './salary.service.js';

type SalaryRoutesOptions = {
  getSalaryService: () => SalaryService;
};

export const salaryRoutes: FastifyPluginAsync<SalaryRoutesOptions> = async (
  app,
  { getSalaryService },
) => {
  app.post<{ Params: { employeeId: string } }>(
    '/api/employees/:employeeId/salaries',
    async (request, reply) => {
      const body = createSalaryRequestSchema.safeParse(request.body);

      if (!body.success) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid salary request.',
          },
        });
      }

      try {
        const result = await getSalaryService().create(
          request.params.employeeId,
          body.data,
        );

        return reply.status(201).send(result);
      } catch (error) {
        if (error instanceof EmployeeNotFoundError) {
          return reply.status(404).send({
            error: { code: 'EMPLOYEE_NOT_FOUND', message: error.message },
          });
        }

        if (error instanceof SalaryEffectiveDateConflictError) {
          return reply.status(409).send({
            error: {
              code: 'SALARY_EFFECTIVE_DATE_CONFLICT',
              message: error.message,
            },
          });
        }

        if (error instanceof SalaryCurrencyMismatchError) {
          return reply.status(400).send({
            error: { code: 'INVALID_SALARY', message: error.message },
          });
        }

        if (error instanceof SalaryValidationError) {
          return reply.status(400).send({
            error: {
              code:
                error.reason === 'UNSUPPORTED_CURRENCY'
                  ? 'UNSUPPORTED_CURRENCY'
                  : 'INVALID_SALARY',
              message: error.message,
            },
          });
        }

        throw error;
      }
    },
  );
};
