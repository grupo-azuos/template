import { type ChartSlice, colorOfSlice } from '../../../../lib/utils/chart-slice.util';
import {
  type ChartOption,
  type ChartTheme,
  formatCount,
  shareOf,
} from '../../../../lib/utils/echarts.util';
import { themeColor } from '../../../../lib/utils/theme-color.util';

/**
 * OS GRÁFICOS A MAIS DO PAINEL — pizza, rosa, meia-rosca, Pareto, acumulado e colunas lado a
 * lado. Todos no mesmo desenho dos que já existiam (as cores da marca, o balão, a borda da cor do
 * fundo), e só com o que o ECharts do projeto já carrega: pizza, barra e linha. Nada novo para
 * baixar, nada em 3D.
 */
export type PieShape = 'pie' | 'rose' | 'halfDonut';

type Theme = Pick<ChartTheme, 'surface' | 'muted' | 'border'>;

const AXIS_LABEL = { fontSize: 11 };

/** O rótulo de categoria embaixo das colunas: inclinado, e cortado antes de invadir o vizinho. */
function categoryLabel(theme: Theme) {
  return {
    ...AXIS_LABEL,
    interval: 0,
    rotate: 30,
    color: theme.muted,
    width: 90,
    overflow: 'truncate' as const,
  };
}

function sliceTooltip(seriesLabel: string, total: number) {
  return (params: unknown) => {
    const { name, value } = params as { name: string; value: number };

    return `<b>${name}</b><br/>${seriesLabel}: ${formatCount(value)} (${shareOf(value, total)}%)`;
  };
}

const PIE_SHAPES: Record<
  PieShape,
  { radius: [string, string]; center: [string, string]; start: number; end?: number }
> = {
  pie: { radius: ['0%', '92%'], center: ['50%', '50%'], start: 90 },
  rose: { radius: ['12%', '92%'], center: ['50%', '50%'], start: 90 },
  /* Meia-rosca: o arco de cima, de 180° a 360°, com o centro baixado para o arco encher o quadro. */
  halfDonut: { radius: ['58%', '100%'], center: ['50%', '80%'], start: 180, end: 360 },
};

/** Pizza, rosa (o raio é o valor) ou meia-rosca — a mesma fatia, três desenhos. */
export function pieOption(
  slices: readonly ChartSlice[],
  seriesLabel: string,
  shape: PieShape,
  theme: Theme,
): ChartOption {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const look = PIE_SHAPES[shape];

  return {
    tooltip: { trigger: 'item', formatter: sliceTooltip(seriesLabel, total) },
    series: [
      {
        type: 'pie',
        name: seriesLabel,
        radius: look.radius,
        center: look.center,
        startAngle: look.start,
        ...(look.end === undefined ? {} : { endAngle: look.end }),
        ...(shape === 'rose' ? { roseType: 'radius' } : {}),
        avoidLabelOverlap: true,
        label: { show: false },
        itemStyle: { borderColor: theme.surface, borderWidth: 2, borderRadius: 4 },
        data: slices.map((slice, index) => ({
          name: slice.label,
          value: slice.value,
          itemStyle: { color: colorOfSlice(slice.label, index) },
        })),
      },
    ],
  };
}

/** As barras do maior para o menor e o percentual acumulado — "quais poucos fazem o grosso". */
export function paretoOption(
  slices: readonly ChartSlice[],
  seriesLabel: string,
  theme: Theme,
): ChartOption {
  const sorted = [...slices].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((sum, slice) => sum + slice.value, 0);
  let running = 0;
  const shares = sorted.map((slice) => {
    running += slice.value;

    return total === 0 ? 0 : Math.round((running / total) * 1000) / 10;
  });

  return {
    grid: { top: 24, right: 12, bottom: 4, left: 12, containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: sorted.map((slice) => slice.label),
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: categoryLabel(theme),
    },
    yAxis: [
      { type: 'value', show: false },
      {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: { ...AXIS_LABEL, color: theme.muted, formatter: '{value}%' },
        splitLine: { lineStyle: { color: theme.border } },
      },
    ],
    series: [
      {
        type: 'bar',
        name: seriesLabel,
        barMaxWidth: 36,
        itemStyle: { borderRadius: [4, 4, 0, 0] },
        data: sorted.map((slice, index) => ({
          value: slice.value,
          itemStyle: { color: colorOfSlice(slice.label, index) },
        })),
      },
      {
        type: 'line',
        name: 'Acumulado (%)',
        yAxisIndex: 1,
        symbolSize: 6,
        lineStyle: { width: 2, color: themeColor('--chart-1') },
        itemStyle: { color: themeColor('--chart-1') },
        data: shares,
      },
    ],
  };
}

/** "2026-03" vira "03/2026"; "2026-03-09" vira "09/03" — a data como se lê no Brasil. */
export function timeLabel(key: string): string {
  const [year, month, day] = key.split('-');
  if (day) return `${day}/${month}`;
  if (month) return `${month}/${year}`;

  return key;
}

/** O total somando no tempo: cada ponto é tudo o que veio até ali. */
export function cumulativeOption(
  points: readonly { key: string; value: number }[],
  seriesLabel: string,
  theme: Theme,
): ChartOption {
  const sorted = [...points].sort((a, b) => a.key.localeCompare(b.key));
  let running = 0;
  const totals = sorted.map((point) => {
    running += point.value;

    return running;
  });

  return {
    grid: { top: 16, right: 16, bottom: 4, left: 12, containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: sorted.map((point) => timeLabel(point.key)),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: theme.border } },
      axisLabel: { ...AXIS_LABEL, color: theme.muted },
    },
    yAxis: {
      type: 'value',
      axisLabel: { ...AXIS_LABEL, color: theme.muted },
      splitLine: { lineStyle: { color: theme.border } },
    },
    series: [
      {
        type: 'line',
        name: `${seriesLabel} (acumulado)`,
        step: false,
        symbolSize: 6,
        lineStyle: { width: 2, color: themeColor('--chart-1') },
        itemStyle: { color: themeColor('--chart-1') },
        data: totals,
      },
    ],
  };
}

export type GroupedData = {
  series: { key: string; label: string; color: string }[];
  categories: { label: string; values: Record<string, number> }[];
};

/** Colunas lado a lado: o mesmo cruzamento do empilhado, para comparar cada parte com a outra. */
export function groupedOption(data: GroupedData, theme: Theme): ChartOption {
  return {
    grid: { top: 32, right: 12, bottom: 4, left: 12, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      top: 0,
      textStyle: { ...AXIS_LABEL, color: theme.muted },
      itemWidth: 10,
      itemHeight: 10,
    },
    xAxis: {
      type: 'category',
      data: data.categories.map((category) => category.label),
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: categoryLabel(theme),
    },
    yAxis: {
      type: 'value',
      axisLabel: { ...AXIS_LABEL, color: theme.muted },
      splitLine: { lineStyle: { color: theme.border } },
    },
    series: data.series.map((serie) => ({
      type: 'bar',
      name: serie.label,
      barMaxWidth: 18,
      itemStyle: { color: serie.color, borderRadius: [3, 3, 0, 0] },
      data: data.categories.map((category) => category.values[serie.key] ?? 0),
    })),
  };
}
