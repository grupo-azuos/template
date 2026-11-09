import { describe, expect, it } from 'vitest';

import {
  cumulativeOption,
  groupedOption,
  paretoOption,
  pieOption,
  timeLabel,
} from './widget-chart-option.util';

const THEME = { surface: '#fff', muted: '#666', border: '#ddd' };
const SLICES = [
  { label: 'Pago', value: 2 },
  { label: 'Em andamento', value: 6 },
  { label: 'Isento', value: 2 },
];

type Series = { type: string; data: unknown[] } & Record<string, unknown>;
const seriesOf = (option: { series?: unknown }) => option.series as Series[];

describe('pieOption', () => {
  // feliz
  it('draws the same slices as a pie, a rose or a half donut', () => {
    const pie = seriesOf(pieOption(SLICES, 'alvarás', 'pie', THEME))[0]!;
    const rose = seriesOf(pieOption(SLICES, 'alvarás', 'rose', THEME))[0]!;
    const half = seriesOf(pieOption(SLICES, 'alvarás', 'halfDonut', THEME))[0]!;

    expect(pie).toMatchObject({ type: 'pie', radius: ['0%', '92%'] });
    expect(pie.roseType).toBeUndefined();
    expect(rose.roseType).toBe('radius');
    expect(half).toMatchObject({ startAngle: 180, endAngle: 360 });
    expect(pie.data).toHaveLength(3);
  });

  // triste
  it('draws no slice for an empty result', () => {
    expect(seriesOf(pieOption([], 'alvarás', 'pie', THEME))[0]!.data).toEqual([]);
  });
});

describe('paretoOption', () => {
  // feliz
  it('sorts the bars from the largest and adds the running share up to 100%', () => {
    const option = paretoOption(SLICES, 'alvarás', THEME);
    const [bars, line] = seriesOf(option);

    expect((option.xAxis as { data: string[] }).data[0]).toBe('Em andamento');
    expect(bars!.data.map((item) => (item as { value: number }).value)).toEqual([6, 2, 2]);
    expect(line!.data).toEqual([60, 80, 100]);
  });

  // triste
  it('keeps the share at zero when everything is zero', () => {
    const [, line] = seriesOf(paretoOption([{ label: 'Pago', value: 0 }], 'alvarás', THEME));

    expect(line!.data).toEqual([0]);
  });
});

describe('cumulativeOption', () => {
  // feliz
  it('adds each point to the ones before it, in date order', () => {
    const option = cumulativeOption(
      [
        { key: '2026-03', value: 5 },
        { key: '2026-01', value: 2 },
        { key: '2026-02', value: 1 },
      ],
      'alvarás',
      THEME,
    );

    expect((option.xAxis as { data: string[] }).data).toEqual(['01/2026', '02/2026', '03/2026']);
    expect(seriesOf(option)[0]!.data).toEqual([2, 3, 8]);
  });

  // triste
  it('reads a key that is not a date as it came', () => {
    expect(timeLabel('2026-03-09')).toBe('09/03');
    expect(timeLabel('(sem data)')).toBe('(sem data)');
  });
});

describe('groupedOption', () => {
  // feliz
  it('puts one bar per part side by side, without stacking', () => {
    const option = groupedOption(
      {
        series: [
          { key: 'a', label: 'Ambiental', color: '#111' },
          { key: 'b', label: 'Bombeiros', color: '#222' },
        ],
        categories: [{ label: 'Pago', values: { a: 3 } }],
      },
      THEME,
    );
    const series = seriesOf(option);

    expect(series.map((item) => item.name)).toEqual(['Ambiental', 'Bombeiros']);
    expect(series[0]!.stack).toBeUndefined();
    // Parte que não aparece na categoria conta zero, e não some do eixo.
    expect(series[1]!.data).toEqual([0]);
  });
});
