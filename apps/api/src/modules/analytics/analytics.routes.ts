import {
  analyticsFiltersSchema,
  countryAnalyticsQuerySchema,
  departmentAnalyticsQuerySchema,
} from '@acme/contracts';
import type { FastifyPluginAsync, FastifyReply } from 'fastify';

import type { AnalyticsService } from './analytics.service.js';

type AnalyticsRoutesOptions = {
  getAnalyticsService: () => AnalyticsService;
  now: () => Date;
};

export const analyticsRoutes: FastifyPluginAsync<
  AnalyticsRoutesOptions
> = async (app, { getAnalyticsService, now }) => {
  app.get('/api/analytics/summary', async (request, reply) => {
    const filters = analyticsFiltersSchema.safeParse(request.query);

    if (!filters.success) {
      return sendValidationError(reply);
    }

    return getAnalyticsService().getSummary(filters.data, now());
  });

  app.get('/api/analytics/departments', async (request, reply) => {
    const query = departmentAnalyticsQuerySchema.safeParse(request.query);

    if (!query.success) {
      return sendValidationError(reply);
    }

    return getAnalyticsService().getDepartments(query.data, now());
  });

  app.get('/api/analytics/countries', async (request, reply) => {
    const query = countryAnalyticsQuerySchema.safeParse(request.query);

    if (!query.success) {
      return sendValidationError(reply);
    }

    return getAnalyticsService().getCountries(query.data, now());
  });
};

function sendValidationError(reply: FastifyReply) {
  return reply.status(400).send({
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid analytics query parameters.',
    },
  });
}
