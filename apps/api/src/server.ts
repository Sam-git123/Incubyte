import { fileURLToPath } from 'node:url';

import { buildApp } from './app.js';
import { readServerConfig } from './config/environment.js';
import { createPrismaClient } from './db/prisma.js';

const config = readServerConfig();
const prisma = createPrismaClient(config.databaseUrl);
const webRoot =
  config.nodeEnv === 'production'
    ? fileURLToPath(new URL('../../web/dist/', import.meta.url))
    : undefined;
const app = buildApp(
  { logger: true },
  { prisma, ...(webRoot === undefined ? {} : { webRoot }) },
);
let shutdownStarted = false;

async function shutdown(signal: NodeJS.Signals) {
  if (shutdownStarted) {
    return;
  }

  shutdownStarted = true;
  app.log.info({ signal }, 'Shutting down');

  try {
    await app.close();
    await prisma.$disconnect();
  } catch (error) {
    app.log.error(error, 'Graceful shutdown failed');
    process.exitCode = 1;
  }
}

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));

try {
  await app.listen({ host: '0.0.0.0', port: config.port });
} catch (error) {
  app.log.error(error);
  await prisma.$disconnect();
  process.exitCode = 1;
}
