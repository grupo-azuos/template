import { AzuosChartValueList } from '../../../../lib/components/azuos-chart-value-list/azuos-chart-value-list.component';
import { AzuosEchart } from '../../../../lib/components/azuos-echart/azuos-echart.component';
import { type ChartSlice } from '../../../../lib/utils/chart-slice.util';
import { type ChartOption, type ChartTheme } from '../../../../lib/utils/echarts.util';
import {
  cumulativeOption,
  type GroupedData,
  groupedOption,
  paretoOption,
  pieOption,
  type PieShape,
} from './widget-chart-option.util';

/**
 * UM DOS GRÁFICOS A MAIS DO PAINEL, desenhado na moldura de todo gráfico (`AzuosEchart`: altura,
 * carregando, vazio, tema e a frase para o leitor de tela). Qual desenho é o `chart` que diz; os
 * números chegam já no formato de cada um.
 */
export type AzuosWidgetChartProps = {
  data: {
    chart:
      | { kind: PieShape; slices: ChartSlice[] }
      | { kind: 'pareto'; slices: ChartSlice[] }
      | { kind: 'cumulative'; points: { key: string; value: number }[] }
      | { kind: 'grouped'; grouped: GroupedData };
    seriesLabel: string;
  };
  state?: { isLoading?: boolean };
  ui?: { heightClass?: string };
};

export function AzuosWidgetChart({ data, state, ui }: AzuosWidgetChartProps) {
  const { chart, seriesLabel } = data;
  const isEmpty = sizeOf(chart) === 0;

  return (
    <>
      <AzuosEchart
        data={{
          option: (theme) => optionOf(chart, seriesLabel, theme),
          description: `${seriesLabel}: ${sizeOf(chart)} itens`,
        }}
        ui={{ heightClass: ui?.heightClass ?? 'h-full min-h-40' }}
        state={{ isLoading: state?.isLoading, isEmpty }}
      />
      {'slices' in chart ? <AzuosChartValueList data={{ slices: chart.slices }} /> : null}
    </>
  );
}

function sizeOf(chart: AzuosWidgetChartProps['data']['chart']): number {
  if ('slices' in chart) return chart.slices.length;
  if ('points' in chart) return chart.points.length;

  return chart.grouped.categories.length;
}

export function optionOf(
  chart: AzuosWidgetChartProps['data']['chart'],
  seriesLabel: string,
  theme: ChartTheme,
): ChartOption {
  if (chart.kind === 'pareto') return paretoOption(chart.slices, seriesLabel, theme);
  if (chart.kind === 'cumulative') return cumulativeOption(chart.points, seriesLabel, theme);
  if (chart.kind === 'grouped') return groupedOption(chart.grouped, theme);

  return pieOption(chart.slices, seriesLabel, chart.kind, theme);
}
