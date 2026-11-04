import { UnauthorizedException } from '@nestjs/common';
import { type NextFunction, type Request, type Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { AuthenticationMiddleware } from './authentication.middleware';
import { FORWARDED_IDENTITY_HEADERS, MOCK_IDENTITY } from './identity.provider';
import { type RequestUser } from './request-user.type';

function requestWith(headers: Record<string, string>) {
  return { headers } as unknown as Request & { user?: RequestUser };
}

const response = {} as Response;

describe('AuthenticationMiddleware', () => {
  // feliz
  it('attaches the identity the proxy forwarded and moves on', () => {
    const request = requestWith({
      [FORWARDED_IDENTITY_HEADERS.id]: '7',
      [FORWARDED_IDENTITY_HEADERS.email]: 'ana@empresa.com.br',
      [FORWARDED_IDENTITY_HEADERS.name]: 'Ana',
      [FORWARDED_IDENTITY_HEADERS.role]: 'editor',
    });
    const next = vi.fn() as NextFunction;

    new AuthenticationMiddleware().use(request, response, next);

    expect(request.user).toMatchObject({ id: '7', email: 'ana@empresa.com.br', role: 'editor' });
    expect(next).toHaveBeenCalledOnce();
  });

  it('falls back to the mock identity when no identity header came at all', () => {
    const request = requestWith({});
    const next = vi.fn() as NextFunction;

    new AuthenticationMiddleware().use(request, response, next);

    expect(request.user).toEqual(MOCK_IDENTITY);
    expect(next).toHaveBeenCalledOnce();
  });

  // triste
  it('refuses headers that came but do not form a valid identity, instead of granting the mock', () => {
    const request = requestWith({ [FORWARDED_IDENTITY_HEADERS.id]: '7' });
    const next = vi.fn() as NextFunction;

    expect(() => new AuthenticationMiddleware().use(request, response, next)).toThrow(
      UnauthorizedException,
    );
    expect(request.user).toBeUndefined();
    expect(next).not.toHaveBeenCalled();
  });
});
