import { describe, expect, it } from 'vitest';

import { readServerConfig } from './environment.js';

describe('readServerConfig', () => {
  it('uses local server defaults', () => {
    expect(readServerConfig({ DATABASE_URL: 'file:./dev.db' })).toEqual({
      databaseUrl: 'file:./dev.db',
      nodeEnv: 'development',
      port: 3000,
    });
  });

  it('accepts production configuration', () => {
    expect(
      readServerConfig({
        DATABASE_URL: 'file:/var/data/acme.db',
        NODE_ENV: 'production',
        PORT: '10000',
      }),
    ).toEqual({
      databaseUrl: 'file:/var/data/acme.db',
      nodeEnv: 'production',
      port: 10000,
    });
  });

  it('rejects a missing database URL', () => {
    expect(() => readServerConfig({})).toThrowError(
      'DATABASE_URL is required.',
    );
  });

  it.each(['0', '65536', '1.5', 'not-a-port'])(
    'rejects invalid PORT %s',
    (port) => {
      expect(() =>
        readServerConfig({ DATABASE_URL: 'file:./dev.db', PORT: port }),
      ).toThrowError('PORT must be an integer between 1 and 65535.');
    },
  );

  it('rejects an unsupported NODE_ENV', () => {
    expect(() =>
      readServerConfig({
        DATABASE_URL: 'file:./dev.db',
        NODE_ENV: 'staging',
      }),
    ).toThrowError('NODE_ENV must be one of: development, production, test.');
  });
});
