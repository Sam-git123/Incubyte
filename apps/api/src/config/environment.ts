export type ServerConfig = {
  databaseUrl: string;
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
};

const NODE_ENVIRONMENTS = ['development', 'production', 'test'] as const;

export function readServerConfig(
  environment: NodeJS.ProcessEnv = process.env,
): ServerConfig {
  const databaseUrl = environment.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required.');
  }

  const nodeEnv = environment.NODE_ENV ?? 'development';

  if (!isNodeEnvironment(nodeEnv)) {
    throw new Error(
      `NODE_ENV must be one of: ${NODE_ENVIRONMENTS.join(', ')}.`,
    );
  }

  return {
    databaseUrl,
    nodeEnv,
    port: parsePort(environment.PORT),
  };
}

function parsePort(value: string | undefined): number {
  if (value === undefined) {
    return 3000;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  return port;
}

function isNodeEnvironment(value: string): value is ServerConfig['nodeEnv'] {
  return NODE_ENVIRONMENTS.some((environment) => environment === value);
}
