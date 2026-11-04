import { describe, expect, it } from 'vitest';

import {
  formatMoney,
  formatMoneyCents,
  formatMoneyRange,
  formatSignedMoneyCents,
} from './format-money.util';

const plain = (text: string) => text.replace(/\s/g, ' ');

describe('formatMoney', () => {
  // feliz
  /* Sem centavos de propósito: "R$ 1.840,00" tem cara de cotação fechada, e todo valor que passa por
     aqui é estimativa. */
  it('writes reais the way a Brazilian reads them, without cents', () => {
    expect(formatMoney(1840)).toMatch(/^R\$\s?1\.840$/);
  });

  it('rounds to the nearest real', () => {
    expect(formatMoney(1840.6)).toMatch(/1\.841/);
  });

  it('shows zero as zero, since it is an answer', () => {
    expect(formatMoney(0)).toMatch(/0/);
  });

  // triste
  /* Ausência e zero são informações diferentes: "R$ 0" se lê como "não custa nada", e travessão se lê
     como "ninguém preencheu". */
  it('shows a dash for an absent value, never "R$ 0"', () => {
    expect(formatMoney(null)).toBe('—');
    expect(formatMoney(undefined)).toBe('—');
  });

  it('shows a dash for a broken number, never "R$ NaN"', () => {
    expect(formatMoney(Number.NaN)).toBe('—');
  });
});

describe('formatMoneyRange', () => {
  // feliz
  it('writes a price range in one sentence', () => {
    expect(formatMoneyRange(920, 1720)).toMatch(/920.+a.+1\.720/);
  });

  // triste
  it('still writes a range when both ends are the same', () => {
    expect(formatMoneyRange(500, 500)).toMatch(/500.+a.+500/);
  });
});

describe('formatMoneyCents', () => {
  // feliz
  it('keeps the cents and writes the sign when asked', () => {
    expect(plain(formatMoneyCents(123_456))).toBe('R$ 1.234,56');
    expect(plain(formatSignedMoneyCents(500))).toBe('+R$ 5,00');
    expect(plain(formatSignedMoneyCents(-500))).toBe('−R$ 5,00');
    expect(plain(formatSignedMoneyCents(0))).toBe('R$ 0,00');
  });

  // triste
  it('shows a dash for an absent or broken value', () => {
    expect(formatMoneyCents(null)).toBe('—');
    expect(formatSignedMoneyCents(Number.NaN)).toBe('—');
  });
});
