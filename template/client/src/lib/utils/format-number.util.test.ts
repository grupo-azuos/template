import { describe, expect, it } from 'vitest';

import { formatCount, formatPercent } from './format-number.util';

describe('formatPercent', () => {
  // feliz
  /* Sem casa decimal: "87,3%" sugere uma precisão que a medida não tem, e dois painéis arredondando
     diferente passam a discordar sobre o mesmo número. */
  it('writes a whole percentage', () => {
    expect(formatPercent(87)).toBe('87%');
    expect(formatPercent(87.4)).toBe('87%');
  });

  it('shows zero as zero', () => {
    expect(formatPercent(0)).toBe('0%');
  });

  // triste
  it('shows a dash for an absent or broken value', () => {
    expect(formatPercent(null)).toBe('—');
    expect(formatPercent(undefined)).toBe('—');
    expect(formatPercent(Number.NaN)).toBe('—');
  });
});

describe('formatCount', () => {
  // feliz
  it('writes the thousands separator a Brazilian reads', () => {
    expect(formatCount(1067)).toBe('1.067');
  });

  // triste
  it('shows a dash for an absent value', () => {
    expect(formatCount(null)).toBe('—');
    expect(formatCount(Number.NaN)).toBe('—');
  });
});
