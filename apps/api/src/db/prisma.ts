import 'dotenv/config';

import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PrismaClient } from '../generated/prisma/client.js';

let prismaClient: PrismaClient | undefined;

export function createPrismaClient(
  databaseUrl = requireDatabaseUrl(),
): PrismaClient {
  const adapter = new PrismaLibSQL({ url: resolveDatabaseUrl(databaseUrl) });

  return new PrismaClient({ adapter });
}

export function getPrismaClient(): PrismaClient {
  prismaClient ??= createPrismaClient();

  return prismaClient;
}

function requireDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to create the database client.');
  }

  return databaseUrl;
}

function resolveDatabaseUrl(databaseUrl: string): string {
  const relativeFilePrefix = 'file:./';

  if (!databaseUrl.startsWith(relativeFilePrefix)) {
    return databaseUrl;
  }

  const prismaDirectory = fileURLToPath(
    new URL('../../prisma/', import.meta.url),
  );
  const databasePath = resolve(
    prismaDirectory,
    databaseUrl.slice(relativeFilePrefix.length),
  );

  return `file:${databasePath.replaceAll('\\', '/')}`;
}
