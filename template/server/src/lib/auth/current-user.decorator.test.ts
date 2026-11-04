import 'reflect-metadata';

import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { describe, expect, it } from 'vitest';

import { CurrentUser } from './current-user.decorator';
import { type RequestUser } from './request-user.type';

const ana: RequestUser = { id: '1', email: 'ana@empresa.com.br', name: 'Ana', role: 'editor' };

/**
 * Um decorator de parâmetro só guarda a sua "fábrica" nos metadados da rota. Para chamá-la
 * sem subir o Nest, decora-se um método de prova e lê-se a fábrica de volta.
 */
function factoryOf() {
  class Probe {
    handle(@CurrentUser() user: RequestUser): RequestUser {
      return user;
    }
  }
  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Probe, 'handle') as Record<
    string,
    { factory: (data: unknown, context: ExecutionContext) => RequestUser }
  >;

  return Object.values(args)[0]!.factory;
}

function contextWith(user: RequestUser | undefined): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => ({ user }) }) } as unknown as ExecutionContext;
}

describe('@CurrentUser', () => {
  // feliz
  it('hands the controller the person attached to the request', () => {
    expect(factoryOf()(undefined, contextWith(ana))).toEqual(ana);
  });

  // triste
  it('refuses a request that reached the controller without identity', () => {
    expect(() => factoryOf()(undefined, contextWith(undefined))).toThrow(UnauthorizedException);
  });
});
