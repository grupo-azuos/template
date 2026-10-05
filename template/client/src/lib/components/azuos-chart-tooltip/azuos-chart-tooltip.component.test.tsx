import { describe, expect, it } from 'vitest';

import { formatChartValue } from './azuos-chart-tooltip.component';

describe('formatChartValue', () => {
  // feliz
  /* O original usa o idioma do navegador, e aí o mesmo painel mostra o mesmo número de dois jeitos
     em duas máquinas da mesma sala. */
  it('writes the number with the Brazilian thousands separator', () => {
    expect(formatChartValue(1240)).toBe('1.240');
    expect(formatChartValue(1810000)).toBe('1.810.000');
  });

  it('keeps a small number as it is', () => {
    expect(formatChartValue(7)).toBe('7');
  });

  // triste
  /* Série sem valor acontece numa rosca: todas as fatias entram na lista e só a apontada tem
     número. Uma linha escrita "undefined" no balão é pior que uma linha vazia. */
  it('writes nothing for an absent value, never "undefined"', () => {
    expect(formatChartValue(undefined)).toBe('');
    expect(formatChartValue(null)).toBe('');
  });

  it('passes text through unchanged', () => {
    expect(formatChartValue('Em andamento')).toBe('Em andamento');
  });
});
