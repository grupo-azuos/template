import { z } from 'zod';
import { describe, expect, it } from 'vitest';

import {
  fieldParser,
  isFlag,
  isText,
  matches,
  oneOf,
  readIf,
  sectionParser,
} from './filter-fields.util';

/*
 * Os guardas que leem o que ficou salvo no navegador. O que está em prova é que valor fora
 * do formato é IGNORADO — e o padrão fica — em vez de quebrar a tela na volta.
 */
describe('guards', () => {
  // feliz/triste: cada guarda aceita o seu tipo e recusa o resto.
  it('tells text, flags, enumerations and schemas apart', () => {
    expect(isText('a')).toBe(true);
    expect(isText(1)).toBe(false);
    expect(isFlag(true)).toBe(true);
    expect(isFlag('true')).toBe(false);

    const status = oneOf('ATIVO', 'INATIVO');
    expect(status('ATIVO')).toBe(true);
    expect(status('OUTRO')).toBe(false);
    expect(status(1)).toBe(false);

    const positive = matches<number>(z.number().positive());
    expect(positive(3)).toBe(true);
    expect(positive(-1)).toBe(false);
  });
});

describe('fieldParser', () => {
  const parse = fieldParser(
    { owner: '', onlyPending: false },
    { owner: isText, onlyPending: isFlag },
  );

  // feliz: só o que passa no guarda substitui o padrão.
  it('keeps the defaults for fields that fail their guard', () => {
    expect(parse({ owner: 'Ana', onlyPending: 'yes', extra: 1 })).toEqual({
      owner: 'Ana',
      onlyPending: false,
    });
    expect(parse({})).toEqual({ owner: '', onlyPending: false });
  });

  // triste: o que não é objeto não é filtro salvo.
  it('answers null for anything that is not a plain object', () => {
    expect(parse(null)).toBeNull();
    expect(parse('x')).toBeNull();
    expect(parse([1])).toBeNull();
  });
});

describe('sectionParser and readIf', () => {
  const parse = sectionParser(
    { month: '', range: { from: '', to: '' } },
    {
      month: readIf(isText),
      range: fieldParser({ from: '', to: '' }, { from: isText, to: isText }),
    },
  );

  // feliz: cada seção é lida pelo seu parser; a que não passa fica no padrão.
  it('parses each section with its own parser', () => {
    expect(parse({ month: '2026-01', range: { from: '2026-01-01', to: 7 } })).toEqual({
      month: '2026-01',
      range: { from: '2026-01-01', to: '' },
    });
    expect(parse({ month: 7, range: 'x' })).toEqual({ month: '', range: { from: '', to: '' } });
  });

  // triste: fora de objeto, nulo.
  it('answers null for non-objects', () => {
    expect(parse(undefined)).toBeNull();
    expect(parse([])).toBeNull();
  });
});
