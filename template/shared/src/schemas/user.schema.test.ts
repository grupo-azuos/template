import { describe, expect, it } from 'vitest';

import {
  USER_ROLE_LABELS,
  canManageNotifications,
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
    expect(userRoleLabel('viewer')).toBe('Consulta');
  });
});

describe('canManageNotifications', () => {
  // feliz
  it('o administrador escolhe o que o sistema notifica', () => {
    expect(canManageNotifications('admin')).toBe(true);
  });

  // triste
  it('quem edita ou consulta não escolhe', () => {
    expect(canManageNotifications('editor')).toBe(false);
    expect(canManageNotifications('viewer')).toBe(false);
  });
});
