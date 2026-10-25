import { type ChartSlice, colorOfSlice } from '../../utils/chart-slice.util';
import {
  type ChartOption,
  formatCount,
  resolveColor,
  shortenLabel,
} from '../../utils/echarts.util';
import { AzuosChartValueList } from '../azuos-chart-value-list/azuos-chart-value-list.component';
import { AzuosEchart } from '../azuos-echart/azuos-echart.component';

/**
 * Coluna — para comparar quantidades entre categorias (por responsável, por status).
 *
 * **Sem legenda** (uma série só; legenda de uma série é ruído), **o valor escrito em cada coluna**
 * (no lugar de obrigar a estimar pela altura) e **clique na coluna abrindo o detalhamento**. Sem
 * eixo de valores: com o número em cada coluna, a escala não acrescenta nada e come largura.
 *
 * **Deitada** (`orientation: 'horizontal'`) quando há muitas categorias ou nomes compridos: o nome
 * fica inteiro, na horizontal, à esquerda da barra — em vez de vinte rótulos girados a -30° que
 * ninguém lê. Passou da altura do quadro, a lista ROLA dentro dele, uma barra por linha.
 */
export type AzuosColumnChartProps = {
  data: {
    slices: ChartSlice[];
    /** O nome da série no balão — "Status: 8". */
    seriesLabel: string;
  };
  state?: { isLoading?: boolean };
  ui?: {
    emptyLabel?: string;
    heightClass?: string;
    /** @default 'vertical' */
    orientation?: 'vertical' | 'horizontal';
    /**
     * UMA cor para todas as colunas — para a série no tempo (dias de um mês), em que cada coluna
     * é a mesma medida e cor por coluna inventaria categorias que não existem.
     */
    color?: string;
  };
  actions?: { onSelect?: (label: string) => void };
};

/** A altura de cada linha da barra deitada — o bastante para o nome caber sem encostar no vizinho. */
const ROW_HEIGHT = 28;

export function AzuosColumnChart({ data, state, ui, actions }: AzuosColumnChartProps) {
  const isHorizontal = ui?.orientation === 'horizontal';
  const onSelect = actions?.onSelect;

  return (
    <>
      <AzuosEchart
        data={{
          option: (isHorizontal ? barOption : columnOption)(
            data.slices,
            data.seriesLabel,
            ui?.color,
          ),
          description: `${data.seriesLabel}: ${data.slices.length} categorias`,
        }}
        ui={boxOf(ui, isHorizontal ? data.slices.length : 0)}
        state={{ isLoading: state?.isLoading, isEmpty: data.slices.length === 0 }}
        actions={{ onSelect: onSelect ? (selection) => onSelect(selection.name) : undefined }}
      />
      <AzuosChartValueList data={{ slices: data.slices }} />
    </>
  );
}

/** A caixa: deitada, o desenho cresce uma linha por categoria e rola dentro dela. */
function boxOf(ui: AzuosColumnChartProps['ui'], rows: number) {
  return {
    heightClass: ui?.heightClass ?? 'h-full',
    emptyLabel: ui?.emptyLabel,
    scrollHeight: rows > 0 ? rows * ROW_HEIGHT + 8 : undefined,
  };
}

/** As colunas em pé: nome girado embaixo, valor num selo da cor da coluna em cima. */
export function columnOption(
  slices: readonly ChartSlice[],
  seriesLabel: string,
  color?: string,
): ChartOption {
  return {
    grid: { top: 28, right: 12, bottom: 4, left: 12, containLabel: true },
    tooltip: { trigger: 'item', formatter: tooltipOf(seriesLabel) },
    xAxis: {
      type: 'category',
      data: slices.map((slice) => slice.label),
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: {
        interval: 0,
        rotate: 30,
        fontSize: 11,
        formatter: (label: string) => shortenLabel(label, AXIS_LABEL_MAX),
      },
    },
    yAxis: { type: 'value', show: false },
    series: [
      {
        type: 'bar',
        name: seriesLabel,
        barMaxWidth: 36,
        itemStyle: { borderRadius: [4, 4, 0, 0] },
        data: slices.map((slice, index) => ({
          value: slice.value,
          itemStyle: { color: colorOf(slice, index, color) },
          label: { backgroundColor: colorOf(slice, index, color) },
        })),
        label: {
          show: true,
          position: 'top',
          color: '#ffffff',
          fontSize: 11,
          fontWeight: 600,
          padding: [2, 6],
          borderRadius: 8,
          formatter: ({ value }) => formatCount(Number(value)),
        },
      },
    ],
  };
}

/** As barras deitadas: o maior em cima, o nome à esquerda, o valor no fim da barra. */
export function barOption(
  slices: readonly ChartSlice[],
  seriesLabel: string,
  color?: string,
): ChartOption {
  return {
    grid: { top: 4, right: 48, bottom: 4, left: 8, containLabel: true },
    tooltip: { trigger: 'item', formatter: tooltipOf(seriesLabel) },
    xAxis: { type: 'value', show: false },
    yAxis: {
      type: 'category',
      inverse: true,
      data: slices.map((slice) => slice.label),
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { fontSize: 11, formatter: (label: string) => shortenLabel(label, 22) },
    },
    series: [
      {
        type: 'bar',
        name: seriesLabel,
        barMaxWidth: 16,
        itemStyle: { borderRadius: [0, 6, 6, 0] },
        data: slices.map((slice, index) => ({
          value: slice.value,
          itemStyle: { color: colorOf(slice, index, color) },
        })),
        label: {
          show: true,
          position: 'right',
          fontSize: 11,
          fontWeight: 600,
          formatter: ({ value }) => formatCount(Number(value)),
        },
      },
    ],
  };
}

/** Quantas letras do nome cabem no eixo, inclinadas; o nome inteiro continua no balão. */
const AXIS_LABEL_MAX = 20;

/** A cor única, quando quem chama pediu uma; senão a cor da categoria. */
function colorOf(slice: ChartSlice, index: number, color: string | undefined): string {
  return color ? resolveColor(color) : colorOfSlice(slice.label, index);
}

function tooltipOf(seriesLabel: string) {
  return (params: unknown) => {
    const { name, value } = params as { name: string; value: number };

    return `<b>${name}</b><br/>${seriesLabel}: ${formatCount(value)}`;
  };
}
