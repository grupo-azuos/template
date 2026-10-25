import { type ChartSlice, colorOfSlice } from '../../utils/chart-slice.util';
import { type ChartOption, type ChartTheme, formatCount, shareOf } from '../../utils/echarts.util';
import { AzuosChartValueList } from '../azuos-chart-value-list/azuos-chart-value-list.component';
import { AzuosEchart } from '../azuos-echart/azuos-echart.component';

/**
 * TREEMAP — muitas categorias de tamanhos muito diferentes, num quadro só.
 *
 * É o gráfico da CAUDA LONGA: uma cidade com 3.000 alvarás e oitenta com dois ou três. Em colunas,
 * as oitenta viram riscos ilegíveis com os nomes encavalados; aqui cada uma é um bloco do tamanho do
 * que pesa, a grande domina o quadro como domina o dado, e as pequenas ficam pequenas sem poluir.
 *
 * Passando de `maxItems`, o resto vira um bloco "Outros" — que não abre detalhamento, porque não é
 * uma categoria. Clicar num bloco abre o detalhamento dele.
 */
export type AzuosTreemapChartProps = {
  data: { slices: ChartSlice[]; seriesLabel: string };
  state?: { isLoading?: boolean };
  ui?: {
    emptyLabel?: string;
    heightClass?: string;
    /** Quantos blocos antes de agrupar o resto em "Outros". @default 30 */
    maxItems?: number;
  };
  actions?: { onSelect?: (label: string) => void };
};

/** O id do bloco que junta a cauda — não é uma categoria, então não detalha. */
export const OTHERS_ID = '__others__';

export function AzuosTreemapChart({ data, state, ui, actions }: AzuosTreemapChartProps) {
  const onSelect = actions?.onSelect;
  const slices = withOthers(data.slices, ui?.maxItems ?? 30);

  return (
    <>
      <AzuosEchart
        data={{
          option: (theme) => treemapOption(slices, data.seriesLabel, theme),
          description: `${data.seriesLabel}: ${data.slices.length} categorias`,
        }}
        ui={{ heightClass: ui?.heightClass ?? 'h-full', emptyLabel: ui?.emptyLabel }}
        state={{ isLoading: state?.isLoading, isEmpty: data.slices.length === 0 }}
        actions={{
          onSelect: onSelect
            ? (selection) => {
                if (selection.name !== OTHERS_ID) onSelect(selection.name);
              }
            : undefined,
        }}
      />
      <AzuosChartValueList data={{ slices: data.slices }} />
    </>
  );
}

/** As `max` maiores, do maior para o menor, e o resto somado num bloco "Outros". */
export function withOthers(slices: readonly ChartSlice[], max: number): (ChartSlice & { id: string })[] {
  const sorted = [...slices].sort((a, b) => b.value - a.value);
  const head = sorted.slice(0, max).map((slice) => ({ ...slice, id: slice.label }));
  const rest = sorted.slice(max);
  if (rest.length === 0) return head;

  const others = rest.reduce((sum, slice) => sum + slice.value, 0);

  return [...head, { id: OTHERS_ID, label: `Outros (${rest.length})`, value: others }];
}

export function treemapOption(
  slices: readonly (ChartSlice & { id: string })[],
  seriesLabel: string,
  theme: Pick<ChartTheme, 'surface' | 'muted'>,
): ChartOption {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        const { name, value } = params as { name: string; value: number };

        return `<b>${name}</b><br/>${seriesLabel}: ${formatCount(value)} (${shareOf(value, total)}%)`;
      },
    },
    series: [
      {
        type: 'treemap',
        name: seriesLabel,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        itemStyle: { borderColor: theme.surface, borderWidth: 2, gapWidth: 2, borderRadius: 6 },
        label: {
          show: true,
          fontSize: 11,
          color: '#ffffff',
          overflow: 'truncate',
          formatter: (params: unknown) => {
            const { name, value } = params as { name: string; value: number };

            return `${name}\n${formatCount(value)}`;
          },
        },
        data: slices.map((slice, index) => ({
          id: slice.id,
          name: slice.label,
          value: slice.value,
          itemStyle: { color: slice.id === OTHERS_ID ? theme.muted : colorOfSlice(slice.label, index) },
        })),
      },
    ],
  };
}
