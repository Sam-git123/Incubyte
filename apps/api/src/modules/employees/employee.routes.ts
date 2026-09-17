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
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid pagination parameters.',
        },
      });
    }

    return getEmployeeService().list(query.data, now());
  });
};
