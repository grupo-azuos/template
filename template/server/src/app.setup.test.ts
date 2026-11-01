import { type INestApplication } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { setupApp } from './app.setup';
import { type Env } from './lib/config/env.schema';
import { HttpExceptionFilter } from './lib/http/http-exception.filter';

function appSpy() {
  return {
    setGlobalPrefix: vi.fn(),
    enableCors: vi.fn(),
    useGlobalFilters: vi.fn(),
  };
}

describe('setupApp', () => {
  // feliz
  it('prefixes the API, opens CORS for each listed origin and installs the error filter', () => {
    const app = appSpy();

    setupApp(
      app as unknown as INestApplication,
      { API_CORS_ORIGIN: 'http://localhost:5009, https://app.exemplo.com.br' } as Env,
    );

    expect(app.setGlobalPrefix).toHaveBeenCalledWith('api');
    expect(app.enableCors).toHaveBeenCalledWith({
      origin: ['http://localhost:5009', 'https://app.exemplo.com.br'],
      credentials: true,
    });
    expect(app.useGlobalFilters).toHaveBeenCalledWith(expect.any(HttpExceptionFilter));
  });

  // triste
  it('does not invent a second origin out of a single one', () => {
    const app = appSpy();

    setupApp(
      app as unknown as INestApplication,
      { API_CORS_ORIGIN: 'http://localhost:5009' } as Env,
    );

    expect(app.enableCors).toHaveBeenCalledWith(
      expect.objectContaining({ origin: ['http://localhost:5009'] }),
    );
  });
});
