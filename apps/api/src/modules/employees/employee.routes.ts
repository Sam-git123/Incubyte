import { employeeListQuerySchema } from '@acme/contracts';
import type { FastifyPluginAsync } from 'fastify';

import type { EmployeeService } from './employee.service.js';

type EmployeeRoutesOptions = {
  getEmployeeService: () => EmployeeService;
  now: () => Date;
};

export const employeeRoutes: FastifyPluginAsync<EmployeeRoutesOptions> = async (
  app,
  { getEmployeeService, now },
) => {
  app.get('/api/employees', async (request, reply) => {
    const query = employeeListQuerySchema.safeParse(request.query);

    if (!query.success) {
      const hasOnlyPaginationErrors = query.error.issues.every((issue) =>
        ['page', 'pageSize'].includes(String(issue.path[0])),
      );

      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: hasOnlyPaginationErrors
            ? 'Invalid pagination parameters.'
            : 'Invalid employee query parameters.',
        },
      });
    }

    return getEmployeeService().list(query.data, now());
  });

  app.get<{ Params: { employeeId: string } }>(
    '/api/employees/:employeeId',
    async (request, reply) => {
      const employee = await getEmployeeService().getById(
        request.params.employeeId,
        now(),
      );

      if (!employee) {
        return reply.status(404).send({
          error: {
            code: 'EMPLOYEE_NOT_FOUND',
            message: 'Employee not found.',
          },
        });
      }

      return employee;
    },
  );
};
