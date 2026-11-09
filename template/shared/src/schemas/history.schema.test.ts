import { describe, expect, it } from 'vitest';

import { historyActionLabel, historyQuerySchema } from './history.schema';

describe('historyQuerySchema', () => {
  // feliz
  it('accepts the screen filters and fills the page', () => {
    const query = historyQuerySchema.parse({
      targetType: 'task',
      action: 'task.updated',
      actor: 'me',
      from: '2026-11-01',
      to: '2026-11-09',
      search: '  proposta ',
    });

    expect(query).toMatchObject({ page: 1, actor: 'me', search: 'proposta' });
  });

  // triste
  it('refuses a day that is not an ISO day and an unknown action', () => {
    expect(historyQuerySchema.safeParse({ from: '09/11/2026' }).success).toBe(false);
    expect(historyQuerySchema.safeParse({ action: 'task.exploded' }).success).toBe(false);
  });
});

describe('historyActionLabel', () => {
  // feliz
  it('says the action in Portuguese', () => {
    expect(historyActionLabel('task.created')).toBe('Cadastrou a tarefa');
  });

  // triste
  it('falls back to the raw text for an action from a newer version', () => {
    expect(historyActionLabel('task.exploded')).toBe('task.exploded');
  });
});
