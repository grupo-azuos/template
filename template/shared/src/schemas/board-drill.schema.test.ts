import { describe, expect, it } from 'vitest';

import {
  boardDrillParamSchema,
  boardDrillSchema,
  drillParam,
  drillSummary,
} from './board-drill.schema';

const DRILL = boardDrillSchema.parse({
  source: 'tasks',
  groupBy: 'status',
  filterId: null,
  key: 'done',
  label: 'Concluída',
  title: 'Tarefas por status',
  person: '@me',
  matches: [{ field: 'status', value: 'done' }],
});

describe('board drill', () => {
  // feliz
  it('goes to the API as text and comes back as the same cut', () => {
    expect(boardDrillParamSchema.parse(drillParam(DRILL))).toEqual(DRILL);
  });

  // feliz
  it('says the cut in words: the block, the item, the person and the field filters', () => {
    expect(drillSummary(DRILL, { person: 'Eu' })).toEqual([
      'Tarefas por status',
      'Status: Concluída',
      'Responsável: Eu',
      'Status: Concluída',
    ]);
  });

  // triste
  it('refuses a broken cut with the sentence, instead of a crash', () => {
    const parsed = boardDrillParamSchema.safeParse('{nope');

    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toBe('O recorte do painel não é um JSON válido');
  });
});
