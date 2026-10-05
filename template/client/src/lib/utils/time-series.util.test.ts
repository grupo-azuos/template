import { describe, expect, it } from 'vitest';

import { dayLabel, hourLabel, toTimeRows } from './time-series.util';

const SERIES = [
  { key: 'created', label: 'Criadas', color: 'var(--chart-1)' },
  { key: 'done', label: 'Concluídas', color: 'var(--chart-2)' },
];

describe('toTimeRows', () => {
  // feliz
  it('flattens every reading into one row per instant', () => {
    const rows = toTimeRows(
      [{ at: '2026-09-14T12:00:00.000Z', values: { created: 6, done: 3 } }],
      SERIES,
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]?.created).toBe(6);
    expect(rows[0]?.at).toBeInstanceOf(Date);
  });

  /* Série sem valor na leitura vira ZERO, e não buraco: buraco na linha se lê como "o sistema estava
     fora do ar", que é outra coisa. */
  it('turns a missing series into zero, not into a hole', () => {
    const rows = toTimeRows([{ at: '2026-09-14T12:00:00.000Z', values: { created: 6 } }], SERIES);

    expect(rows[0]?.done).toBe(0);
  });

  // triste
  /* Uma data inválida virando `Invalid Date` no eixo do tempo quebra a escala inteira, e o gráfico
     some da tela sem dizer por quê. */
  it('drops a reading with a broken date instead of breaking the scale', () => {
    const rows = toTimeRows(
      [
        { at: 'a definir', values: { created: 1, done: 1 } },
        { at: '2026-09-14T12:00:00.000Z', values: { created: 6, done: 3 } },
      ],
      SERIES,
    );

    expect(rows).toHaveLength(1);
  });

  it('gives back nothing when there is no reading', () => {
    expect(toTimeRows([], SERIES)).toEqual([]);
  });
});

describe('hourLabel', () => {
  // feliz
  it('writes the hour with two digits', () => {
    expect(hourLabel(new Date(2026, 8, 14, 9))).toBe('09h');
  });

  // triste
  it('writes a dash for a broken instant', () => {
    expect(hourLabel('ontem')).toBe('—');
  });
});

describe('dayLabel', () => {
  // feliz
  it('writes day and month, both with two digits', () => {
    expect(dayLabel(new Date(2026, 8, 3))).toBe('03/09');
  });

  // triste
  it('writes a dash for a broken instant', () => {
    expect(dayLabel('amanhã')).toBe('—');
  });
});
