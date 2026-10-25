import { cn } from '../../utils/cn.util';
import {
  type ChartOption,
  type ChartTheme,
  formatCount,
  resolveColor,
  shortenLabel,
} from '../../utils/echarts.util';
import { AzuosChartLegend } from '../azuos-chart-legend/azuos-chart-legend.component';
import { AzuosEchart } from '../azuos-echart/azuos-echart.component';

/**
 * BARRA EMPILHADA DEITADA — o tamanho de cada categoria E do que ela é feita.
 *
 * É a troca da rosca quando as fatias têm quase o mesmo tamanho: doze tipos de 8% cada viram um anel
 * de doze fatias iguais que não dizem nada. Aqui cada tipo é uma linha, e a linha mostra quanto dele
 * está resolvido e quanto falta — que é a pergunta que de fato importa sobre cada tipo.
 *
 * O maior fica em cima, o nome inteiro à esquerda, o total no fim da linha. Passou da altura do
 * quadro, as linhas ROLAM dentro dele. Clicar numa linha abre o detalhamento da categoria.
 */
export type StackedBarSeries = { key: string; label: string; color: string };

export type StackedBarCategory = { label: string; values: Record<string, number> };

export type AzuosStackedBarChartProps = {
  data: {
    categories: readonly StackedBarCategory[];
    series: readonly StackedBarSeries[];
    seriesLabel: string;
  };
  state?: { isLoading?: boolean };
  ui?: { emptyLabel?: string; heightClass?: string };
  actions?: { onSelect?: (label: string) => void };
};

const ROW_HEIGHT = 30;

export function AzuosStackedBarChart({ data, state, ui, actions }: AzuosStackedBarChartProps) {
  const onSelect = actions?.onSelect;

  return (
    <div className={cn('flex flex-col gap-2', ui?.heightClass ?? 'h-72')}>
      <AzuosChartLegend data={{ series: data.series }} />
      <AzuosEchart
        data={{
          option: (theme) => stackedBarOption(data, theme),
          description: `${data.seriesLabel}: ${data.categories.length} categorias`,
        }}
        ui={{
          heightClass: 'min-h-0 flex-1',
          emptyLabel: ui?.emptyLabel,
          scrollHeight: data.categories.length * ROW_HEIGHT + 8,
        }}
        state={{ isLoading: state?.isLoading, isEmpty: data.categories.length === 0 }}
        actions={{ onSelect: onSelect ? (selection) => onSelect(selection.name) : undefined }}
      />
    </div>
  );
}

/** A soma de uma linha — o número escrito no fim dela. */
export function totalOf(category: StackedBarCategory): number {
  return Object.values(category.values).reduce((sum, value) => sum + value, 0);
}

export function stackedBarOption(
  data: AzuosStackedBarChartProps['data'],
  theme: Pick<ChartTheme, 'foreground' | 'muted'>,
): ChartOption {
  const last = data.series.length - 1;

  return {
    grid: { top: 4, right: 48, bottom: 4, left: 8, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'none' } },
    xAxis: { type: 'value', show: false },
    yAxis: {
      type: 'category',
      inverse: true,
      data: data.categories.map((category) => category.label),
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { color: theme.foreground, fontSize: 11, formatter: (label: string) => shortenLabel(label, 20) },
    },
    series: data.series.map((series, index) => ({
      type: 'bar' as const,
      name: series.label,
      stack: 'total',
      barMaxWidth: 16,
      itemStyle: { color: resolveColor(series.color), borderRadius: index === last ? [0, 6, 6, 0] : 0 },
      /* O total só na ÚLTIMA série, no fim da linha inteira: o número de cada pedaço fica no balão. */
      label:
        index === last
          ? {
              show: true,
              position: 'right' as const,
              color: theme.muted,
              fontSize: 11,
              fontWeight: 600,
              formatter: (params: unknown) =>
                formatCount(totalOf(data.categories[(params as { dataIndex: number }).dataIndex] ?? { label: '', values: {} })),
            }
          : undefined,
      data: data.categories.map((category) => category.values[series.key] ?? 0),
    })),
  };
}
