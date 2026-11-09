import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import {
  canDelete,
  canEdit,
  canRead,
  canRemoveOwnRecord,
  isAdmin,
  isOwnRecord,
} from './access.policy';
import { assertCanDelete, assertCanEdit, assertCanRemoveOwnRecord } from './policy-assert.util';

describe('access.policy', () => {
  // feliz
  it('lets every known role read', () => {
    expect(canRead('admin')).toBe(true);
    expect(canRead('manager')).toBe(true);
    expect(canRead('user')).toBe(true);
  });

  /* Em cascata: do gestor para cima, todo papel escreve — dono e gestor da operação também. */
  it('lets the manager and every role above it write', () => {
    expect(canEdit('admin')).toBe(true);
    expect(canEdit('owner')).toBe(true);
    expect(canEdit('operations_manager')).toBe(true);
    expect(canEdit('manager')).toBe(true);
  });

  // triste
  /* Fechado por padrão: sem papel, nada passa. */
  it('closes everything when there is no role', () => {
    expect(canRead(null)).toBe(false);
    expect(canEdit(undefined)).toBe(false);
    expect(canDelete(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });

  it('keeps the user read-only', () => {
    expect(canEdit('user')).toBe(false);
    expect(canDelete('user')).toBe(false);
  });

  it('keeps deleting as an admin decision, even for an owner', () => {
    expect(canDelete('manager')).toBe(false);
    expect(canDelete('owner')).toBe(false);
    expect(canDelete('admin')).toBe(true);
  });
});

describe('isOwnRecord', () => {
  // feliz
  it('matches e-mails ignoring case and surrounding spaces', () => {
    expect(isOwnRecord('Ana@Empresa.com.br', ' ana@empresa.com.br ')).toBe(true);
  });

  // triste
  it('never matches when one side is missing', () => {
    expect(isOwnRecord(null, 'ana@empresa.com.br')).toBe(false);
    expect(isOwnRecord('ana@empresa.com.br', null)).toBe(false);
  });
});

describe('canRemoveOwnRecord', () => {
  it('lets a manager remove what they created', () => {
    expect(canRemoveOwnRecord('manager', 'ana@empresa.com.br', 'ana@empresa.com.br')).toBe(true);
  });

  it('lets an admin remove what someone else created', () => {
    expect(canRemoveOwnRecord('admin', 'chefe@empresa.com.br', 'ana@empresa.com.br')).toBe(true);
  });

  // triste
  it('does not let a manager remove what someone else created', () => {
    expect(canRemoveOwnRecord('manager', 'bia@empresa.com.br', 'ana@empresa.com.br')).toBe(false);
  });

  /* Escalada de privilégio: quem só consulta não escreve, nem no que "é dele". */
  it('does not let a user remove even their own record', () => {
    expect(canRemoveOwnRecord('user', 'ana@empresa.com.br', 'ana@empresa.com.br')).toBe(false);
  });
});

describe('policy-assert.util', () => {
  it('passes silently when allowed', () => {
    expect(() => assertCanEdit('manager', 'a tarefa')).not.toThrow();
  });

  // triste
  it('refuses with 403 and says what was being attempted', () => {
    expect(() => assertCanEdit('user', 'a tarefa')).toThrow(ForbiddenException);
    expect(() => assertCanEdit('user', 'a tarefa')).toThrow(/a tarefa/);
  });

  it('says deleting is an admin action', () => {
    expect(() => assertCanDelete('manager', 'a tarefa')).toThrow(/administrador/);
  });

  it('says who can remove a record that belongs to someone else', () => {
    expect(() =>
      assertCanRemoveOwnRecord('manager', 'bia@empresa.com.br', 'ana@empresa.com.br', 'A tarefa'),
    ).toThrow(/quem o criou/);
  });
});
