import { type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { type Reflector } from '@nestjs/core';
import { type UserRole } from '@template/shared/schemas/user.schema';
import { describe, expect, it, vi } from 'vitest';

import { type RequestUser } from './request-user.type';
import { RolesGuard } from './roles.guard';

const editor: RequestUser = { id: '1', email: 'ana@empresa.com.br', name: 'Ana', role: 'manager' };

/** O guard lê os perfis exigidos pelo Reflector e a pessoa pela requisição; é só isso que se finge. */
function guardFor(required: UserRole[] | undefined, user: RequestUser | undefined) {
  const reflector = {
    getAllAndOverride: vi.fn().mockReturnValue(required),
  } as unknown as Reflector;
  const context = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;

  return { guard: new RolesGuard(reflector), context };
}

describe('RolesGuard', () => {
  // feliz
  it('lets everyone through a route that demands no role', () => {
    const { guard, context } = guardFor(undefined, undefined);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('lets the person through when her role is one of the required', () => {
    const { guard, context } = guardFor(['admin', 'manager'], editor);

    expect(guard.canActivate(context)).toBe(true);
  });

  // feliz — cascata: o dono passa onde o gestor passa.
  it('lets a higher role through a route open to a lower one', () => {
    const { guard, context } = guardFor(['manager'], { ...editor, role: 'owner' });

    expect(guard.canActivate(context)).toBe(true);
  });

  // triste
  it('refuses a lower role, saying from which role up', () => {
    const { guard, context } = guardFor(['manager'], { ...editor, role: 'user' });

    expect(() => guard.canActivate(context)).toThrow('Esta ação é de Gestor para cima.');
  });

  // triste
  it('refuses a request without identity on a protected route', () => {
    const { guard, context } = guardFor(['manager'], undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('refuses the wrong role, saying which role would be allowed', () => {
    const { guard, context } = guardFor(['admin'], editor);

    expect(() => guard.canActivate(context)).toThrow('Esta ação é de Administrador.');
  });
});
