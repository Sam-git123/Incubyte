import Fastify, { type FastifyServerOptions } from 'fastify';
import fastifyHelmet from '@fastify/helmet';
import fastifyStatic from '@fastify/static';

import { getPrismaClient } from './db/prisma.js';
import type { PrismaClient } from './generated/prisma/client.js';
import { AnalyticsRepository } from './modules/analytics/analytics.repository.js';
import { analyticsRoutes } from './modules/analytics/analytics.routes.js';
import { AnalyticsService } from './modules/analytics/analytics.service.js';
import { EmployeeRepository } from './modules/employees/employee.repository.js';
import { employeeRoutes } from './modules/employees/employee.routes.js';
import { EmployeeService } from './modules/employees/employee.service.js';
import { SalaryRepository } from './modules/salaries/salary.repository.js';
import { salaryRoutes } from './modules/salaries/salary.routes.js';
import { SalaryService } from './modules/salaries/salary.service.js';

type AppDependencies = {
  prisma?: PrismaClient;
  now?: () => Date;
  webRoot?: string;
};

export function buildApp(
  options: FastifyServerOptions = { logger: false },
  dependencies: AppDependencies = {},
) {
  const app = Fastify(options);
  const now = dependencies.now ?? (() => new Date());
  let employeeService: EmployeeService | undefined;
  let salaryService: SalaryService | undefined;
  let analyticsService: AnalyticsService | undefined;

  app.register(fastifyHelmet);

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

  const getAnalyticsService = () => {
    analyticsService ??= new AnalyticsService(
      new AnalyticsRepository(dependencies.prisma ?? getPrismaClient()),
    );

    return analyticsService;
  };

  app.get('/health', async () => ({ status: 'ok' }));
  app.register(employeeRoutes, { getEmployeeService, now });
  app.register(salaryRoutes, { getSalaryService });
  app.register(analyticsRoutes, { getAnalyticsService, now });

  if (dependencies.webRoot) {
    app.register(fastifyStatic, {
      root: dependencies.webRoot,
      wildcard: false,
      cacheControl: false,
      setHeaders(response, filePath) {
        response.setHeader(
          'Cache-Control',
          /[\\/]assets[\\/]/.test(filePath)
            ? 'public, max-age=31536000, immutable'
            : 'no-cache',
        );
      },
    });

    app.setNotFoundHandler((request, reply) => {
      if (request.url === '/api' || request.url.startsWith('/api/')) {
        return reply.status(404).send({
          error: {
            code: 'NOT_FOUND',
            message: 'Resource not found.',
          },
        });
      }

      return reply
        .header('Cache-Control', 'no-cache')
        .type('text/html')
        .sendFile('index.html');
    });
  }

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
