import {
  type ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { type ApiErrorBody, HttpExceptionFilter } from './http-exception.filter';

/** O mínimo de `ArgumentsHost` que o filtro usa: a resposta (status + json) e a URL pedida. */
function hostFor(url: string) {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }), getRequest: () => ({ url }) }),
  } as unknown as ArgumentsHost;

  return { host, status, json };
}

function bodySent(json: ReturnType<typeof vi.fn>): ApiErrorBody {
  return json.mock.calls[0]?.[0] as ApiErrorBody;
}

describe('HttpExceptionFilter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // feliz
  it('turns a Zod error into 422 with one detail per field, in Portuguese', () => {
    const { host, status, json } = hostFor('/api/tasks');
    const zodError = z
      .object({ title: z.string().min(1, 'Informe o título.') })
      .safeParse({ title: '' }).error;

    new HttpExceptionFilter().catch(zodError, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(bodySent(json)).toMatchObject({
      statusCode: 422,
      message: 'Confira os campos destacados.',
      details: [{ field: 'title', message: 'Informe o título.' }],
      path: '/api/tasks',
    });
  });

  it('keeps the status and text of an HttpException written as plain text', () => {
    const { host, status, json } = hostFor('/api/tasks/9');

    new HttpExceptionFilter().catch(new HttpException('Tarefa não encontrada.', 404), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(bodySent(json)).toMatchObject({ statusCode: 404, message: 'Tarefa não encontrada.' });
    expect(bodySent(json).details).toBeUndefined();
  });

  it('reads the per-field errors of the ZodValidationPipe and swaps its English message for ours', () => {
    const { host, json } = hostFor('/api/tasks');
    const validation = new BadRequestException({
      message: 'Validation failed',
      errors: [{ path: ['status'], message: 'Escolha uma situação da lista.' }, 'lixo', null],
    });

    new HttpExceptionFilter().catch(validation, host);

    expect(bodySent(json)).toMatchObject({
      statusCode: 400,
      message: 'Confira os campos destacados.',
      details: [{ field: 'status', message: 'Escolha uma situação da lista.' }],
    });
  });

  it('joins a list of messages into one sentence', () => {
    const { host, json } = hostFor('/api/tasks');

    new HttpExceptionFilter().catch(
      new BadRequestException({ message: ['Informe o título.', 'Informe a situação.'] }),
      host,
    );

    expect(bodySent(json).message).toBe('Informe o título.; Informe a situação.');
  });

  // triste
  it('hides an unexpected error behind a generic message and logs it with the stack', () => {
    const { host, status, json } = hostFor('/api/tasks');
    const error = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    new HttpExceptionFilter().catch(new Error('senha=123 vazou no erro'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(bodySent(json).message).not.toContain('senha');
    expect(bodySent(json).message).toMatch(/registrado/);
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining('500 /api/tasks'),
      expect.stringContaining('Error: senha=123'),
    );
  });

  it('does not log a client error, and copes with a request without URL', () => {
    const { host, json } = hostFor(undefined as unknown as string);
    const error = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    new HttpExceptionFilter().catch(new HttpException('Proibido.', 403), host);

    expect(error).not.toHaveBeenCalled();
    expect(bodySent(json).path).toBe('');
  });

  it('logs a thrown value that is not an Error without a stack', () => {
    const { host, json } = hostFor('/api/tasks');
    const error = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    new HttpExceptionFilter().catch('explodiu', host);

    expect(bodySent(json).statusCode).toBe(500);
    expect(error).toHaveBeenCalledWith(expect.any(String), undefined);
  });
});
