import Fastify, { type FastifyServerOptions } from 'fastify';

import { getPrismaClient } from './db/prisma.js';
import type { PrismaClient } from './generated/prisma/client.js';
import { EmployeeRepository } from './modules/employees/employee.repository.js';
import { employeeRoutes } from './modules/employees/employee.routes.js';
import { EmployeeService } from './modules/employees/employee.service.js';
import { SalaryRepository } from './modules/salaries/salary.repository.js';
import { salaryRoutes } from './modules/salaries/salary.routes.js';
import { SalaryService } from './modules/salaries/salary.service.js';

type AppDependencies = {
  prisma?: PrismaClient;
  now?: () => Date;
};

export function buildApp(
  options: FastifyServerOptions = { logger: false },
  dependencies: AppDependencies = {},
) {
  const app = Fastify(options);
  const now = dependencies.now ?? (() => new Date());
  let employeeService: EmployeeService | undefined;
  let salaryService: SalaryService | undefined;

  const getEmployeeService = () => {
    employeeService ??= new EmployeeService(
      new EmployeeRepository(dependencies.prisma ?? getPrismaClient()),
    );

    return employeeService;
  };

  const getSalaryService = () => {
    salaryService ??= new SalaryService(
      new SalaryRepository(dependencies.prisma ?? getPrismaClient()),
    );

    return salaryService;
  };

  app.get('/health', async () => ({ status: 'ok' }));
  app.register(employeeRoutes, { getEmployeeService, now });
  app.register(salaryRoutes, { getSalaryService });

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    return reply.status(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.',
      },
    });
  });

  return app;
}
