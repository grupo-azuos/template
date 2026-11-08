import { UnauthorizedException } from '@nestjs/common';
import { type NextFunction, type Request, type Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { AuthenticationMiddleware, SHARED_EVENTS_PATH } from './authentication.middleware';
import { FORWARDED_IDENTITY_HEADERS, MOCK_IDENTITY } from './identity.provider';
import { type RequestUser } from './request-user.type';

function requestWith(headers: Record<string, string>) {
  return { headers } as unknown as Request & { user?: RequestUser };
}

function deliveryTo(method: string, originalUrl: string, headers: Record<string, string> = {}) {
  return { method, originalUrl, headers } as unknown as Request & { user?: RequestUser };
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

  describe('the shared-api delivery route', () => {
    // feliz
    it('lets the machine delivery through without a person, so the route guard decides', () => {
      const request = deliveryTo('POST', `${SHARED_EVENTS_PATH}?retry=1`);
      const next = vi.fn() as NextFunction;

      new AuthenticationMiddleware().use(request, response, next);

      expect(request.user).toBeUndefined();
      expect(next).toHaveBeenCalledOnce();
    });

    // triste
    it('does not extend the exemption to other methods or nearby paths', () => {
      const next = vi.fn() as NextFunction;
      const get = deliveryTo('GET', SHARED_EVENTS_PATH);
      const nearby = deliveryTo('POST', `${SHARED_EVENTS_PATH}/notices`);

      new AuthenticationMiddleware().use(get, response, next);
      new AuthenticationMiddleware().use(nearby, response, next);

      expect(get.user).toEqual(MOCK_IDENTITY);
      expect(nearby.user).toEqual(MOCK_IDENTITY);
    });

    // triste
    it('still refuses a forged identity sent to any other path', () => {
      const request = deliveryTo('POST', '/api/v1/tasks', { [FORWARDED_IDENTITY_HEADERS.id]: '7' });

      expect(() => new AuthenticationMiddleware().use(request, response, vi.fn())).toThrow(
        UnauthorizedException,
      );
    });
  });
});
