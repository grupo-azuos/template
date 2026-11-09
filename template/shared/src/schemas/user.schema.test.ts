import { describe, expect, it } from 'vitest';

import {
  USER_ROLE_LABELS,
  USER_ROLES,
  canManageNotifications,
  hasRoleAtLeast,
  roleRank,
  sessionUserSchema,
  userRoleLabel,
  userRoleSchema,
} from './user.schema';

describe('userRoleSchema', () => {
  it('has a screen label for every role', () => {
    for (const role of userRoleSchema.options) {
      expect(USER_ROLE_LABELS[role]).toBeTruthy();
    }
  });

  // triste
  it('refuses a role that does not exist, instead of guessing one', () => {
    expect(userRoleSchema.safeParse('superuser').success).toBe(false);
  });
});

describe('sessionUserSchema', () => {
  const valid = { id: '1', email: 'dev@template.local', name: 'Dev', role: 'admin' };

  // feliz
  it('accepts a complete identity', () => {
    expect(sessionUserSchema.parse(valid)).toEqual(valid);
  });

  /* Identidade pela metade não é identidade: completar o que falta com um valor padrão daria
     acesso a uma requisição que ninguém soube identificar. */
  it('refuses an identity without e-mail', () => {
    expect(sessionUserSchema.safeParse({ ...valid, email: undefined }).success).toBe(false);
  });

  it('refuses an e-mail that is not an e-mail', () => {
    expect(sessionUserSchema.safeParse({ ...valid, email: 'dev' }).success).toBe(false);
  });
});

describe('userRoleLabel', () => {
  // feliz
  it('gives the screen name of a role', () => {
    expect(userRoleLabel('admin')).toBe('Administrador');
    expect(userRoleLabel('owner')).toBe('Dono');
    expect(userRoleLabel('user')).toBe('Consulta');
  });
});

describe('the role ladder', () => {
  // feliz: em cascata, o de cima vale pelo de baixo.
  it('ranks the five roles from the lowest up', () => {
    expect(USER_ROLES).toEqual(['user', 'manager', 'operations_manager', 'owner', 'admin']);
    expect(roleRank('admin')).toBe(4);
    expect(hasRoleAtLeast('owner', 'manager')).toBe(true);
  });

  // triste
  it('does not let a lower role, or no role, pass for a higher one', () => {
    expect(hasRoleAtLeast('operations_manager', 'owner')).toBe(false);
    expect(hasRoleAtLeast(null, 'user')).toBe(false);
  });
});

describe('canManageNotifications', () => {
  // feliz
  it('o administrador escolhe o que o sistema notifica', () => {
    expect(canManageNotifications('admin')).toBe(true);
  });

  // triste
  it('quem edita ou consulta não escolhe', () => {
    expect(canManageNotifications('owner')).toBe(false);
    expect(canManageNotifications('user')).toBe(false);
  });
});
