import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import {
  assertCanDelete,
  assertCanEdit,
  assertCanManageNotifications,
  assertCanRead,
  assertCanRemoveOwnRecord,
  assertIsAdmin,
} from './policy-assert.util';

describe('policy asserts', () => {
  // feliz
  it('stays silent for what the role is allowed to do', () => {
    expect(() => assertCanRead('user', 'as tarefas')).not.toThrow();
    expect(() => assertCanEdit('manager', 'a tarefa')).not.toThrow();
    expect(() => assertCanDelete('admin', 'a tarefa')).not.toThrow();
    expect(() => assertIsAdmin('admin', 'Apagar o histórico')).not.toThrow();
    expect(() =>
      assertCanRemoveOwnRecord(
        'manager',
        'ana@empresa.com.br',
        'ana@empresa.com.br',
        'O comentário',
      ),
    ).not.toThrow();
  });

  // triste
  it('refuses with a sentence that names what is missing', () => {
    expect(() => assertCanRead(null, 'as tarefas')).toThrow(ForbiddenException);
    expect(() => assertCanEdit('user', 'a tarefa')).toThrow(/somente leitura/);
    expect(() => assertCanDelete('manager', 'a tarefa')).toThrow(
      'Excluir a tarefa é uma ação de administrador.',
    );
    expect(() => assertIsAdmin('manager', 'Apagar o histórico')).toThrow(
      'Apagar o histórico é uma ação de administrador.',
    );
    expect(() =>
      assertCanRemoveOwnRecord(
        'manager',
        'ana@empresa.com.br',
        'bia@empresa.com.br',
        'O comentário',
      ),
    ).toThrow(/quem o criou ou por um administrador/);
  });

  // feliz
  it('lets the administrator choose what the system notifies', () => {
    expect(() => assertCanManageNotifications('admin')).not.toThrow();
  });

  // triste
  it('refuses anyone else choosing what the system notifies', () => {
    expect(() => assertCanManageNotifications('manager')).toThrow(/ação de administrador/);
    expect(() => assertCanManageNotifications(null)).toThrow(ForbiddenException);
  });
});
