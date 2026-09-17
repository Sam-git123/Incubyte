import Fastify, { type FastifyServerOptions } from 'fastify';

export function buildApp(options: FastifyServerOptions = { logger: false }) {
  const app = Fastify(options);

  app.get('/health', async () => ({ status: 'ok' }));

  return app;
}
