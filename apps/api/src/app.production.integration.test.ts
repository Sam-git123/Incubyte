import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildApp } from './app.js';

describe('production web serving', () => {
  let app: FastifyInstance;
  let webRoot: string;

  beforeAll(async () => {
    webRoot = mkdtempSync(join(tmpdir(), 'acme-web-'));
    mkdirSync(join(webRoot, 'assets'));
    writeFileSync(
      join(webRoot, 'index.html'),
      '<!doctype html><html><body>ACME application</body></html>',
    );
    writeFileSync(join(webRoot, 'assets', 'application.js'), 'export {};');

    app = buildApp({}, { webRoot });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    rmSync(webRoot, { force: true, recursive: true });
  });

  it('adds baseline security headers', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  it('serves fingerprinted frontend assets with long-lived caching', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/assets/application.js',
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe('export {};');
    expect(response.headers['cache-control']).toBe(
      'public, max-age=31536000, immutable',
    );
  });

  it('serves the SPA entry point for direct frontend routes', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/employees/employee-1',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.headers['cache-control']).toBe('no-cache');
    expect(response.body).toContain('ACME application');
  });

  it('keeps unknown API routes on a predictable JSON contract', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/not-a-route',
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found.',
      },
    });
  });
});
