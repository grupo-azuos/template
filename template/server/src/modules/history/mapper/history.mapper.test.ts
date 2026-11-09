import { describe, expect, it } from 'vitest';

import { diffFields } from './history.mapper';

describe('diffFields', () => {
  it('records only the changed field', () => {
    expect(
      diffFields(
        { status: 'Em andamento', owner: 'Leyla' },
        { status: 'Concluído', owner: 'Leyla' },
      ),
    ).toEqual([{ field: 'status', from: 'Em andamento', to: 'Concluído' }]);
  });

  it('uses the given label instead of the field name', () => {
    expect(diffFields({ status: 'A' }, { status: 'B' }, { status: 'situação' })).toEqual([
      { field: 'situação', from: 'A', to: 'B' },
    ]);
  });

  it('looks only at fields present after — a partial edit invents no change', () => {
    expect(diffFields({ status: 'A', owner: 'Leyla' }, { status: 'A' })).toEqual([]);
  });

  /* Nulo, undefined e string vazia são a mesma coisa para quem lê: "estava em branco".
     Tratá-los como diferentes enchia o histórico de linhas que não dizem nada. */
  it('records no change between empty, null and space', () => {
    type Notes = { notes: string | null | undefined };

    expect(diffFields<Notes>({ notes: null }, { notes: '' })).toEqual([]);
    expect(diffFields<Notes>({ notes: '' }, { notes: '   ' })).toEqual([]);
    expect(diffFields<Notes>({ notes: undefined }, { notes: null })).toEqual([]);
  });

  it('records leaving blank and going back to blank', () => {
    type Notes = { notes: string | null };

    expect(diffFields<Notes>({ notes: null }, { notes: 'em análise' })).toEqual([
      { field: 'notes', from: null, to: 'em análise' },
    ]);
    expect(diffFields<Notes>({ notes: 'em análise' }, { notes: '' })).toEqual([
      { field: 'notes', from: 'em análise', to: null },
    ]);
  });

  it('describes lists by content, not by reference', () => {
    expect(diffFields({ fireProtocols: ['109150/26'] }, { fireProtocols: ['109150/26'] })).toEqual(
      [],
    );
    expect(diffFields({ fireProtocols: ['109150/26'] }, { fireProtocols: [] })).toEqual([
      { field: 'fireProtocols', from: '109150/26', to: null },
    ]);
  });

  it('compares booleans and numbers without confusing them with empty', () => {
    expect(diffFields({ isReviewed: false }, { isReviewed: true })).toEqual([
      { field: 'isReviewed', from: 'false', to: 'true' },
    ]);
    expect(diffFields({ count: 0 }, { count: 1 })).toEqual([
      { field: 'count', from: '0', to: '1' },
    ]);
  });

  it('records nothing when the after is empty', () => {
    expect(diffFields({ status: 'A' }, {})).toEqual([]);
  });
});
