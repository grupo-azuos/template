import { type ChartSlice } from '../../utils/chart-slice.util';
import { type ChartOption, type ChartTheme, formatCount, resolveColor } from '../../utils/echarts.util';
import { AzuosChartValueList } from '../azuos-chart-value-list/azuos-chart-value-list.component';
import { AzuosEchart } from '../azuos-echart/azuos-echart.component';

/**
 * RADAR — o PERFIL de um conjunto de categorias, de uma vez só.
 *
 * É o gráfico para "em que este time trava", e não para "qual trava mais". A rosca responderia a
 * mesma pergunta em teoria, mas com nove ou dez categorias ela vira um anel de fatias finas que só se
 * lê pela legenda ao lado — e quem está lendo a legenda não está olhando o desenho. O radar escreve o
 * nome de cada categoria NO PRÓPRIO eixo: não há legenda para consultar, e a forma da teia é
 * reconhecível de longe.
 *
 * Onde ele NÃO serve, e por isso não é o gráfico padrão de nada:
 *
 *  - **Poucas categorias.** Com três eixos o radar vira um triângulo que não diz nada; a barra diz.
 *  - **Muitas categorias.** Passando de umas doze, os nomes em volta se encavalam.
 *  - **Ordenar.** "Quem é o maior" se lê em barra, na hora; num radar é preciso comparar distâncias
 *    até o centro.
 *
 * O valor de cada ponta continua no balão, ao passar o ponteiro, e na lista para leitor de tela: a
 * forma mostra o perfil, mas o número exato ninguém mede a olho num radar.
 */
export type AzuosRadarChartProps = {
  data: {
    slices: ChartSlice[];
    /** O nome da série no balão — "Tarefas: 8". */
    seriesLabel: string;
  };
  state?: { isLoading?: boolean };
  ui?: {
    emptyLabel?: string;
    className?: string;
    /** A cor da teia. @default 'var(--chart-1)' */
    color?: string;
    /** A altura da caixa de desenho. @default 'h-72' */
    heightClass?: string;
  };
};

/**
 * Quantas categorias o radar comporta antes de os nomes se encavalarem em volta.
 *
 * Exportado para quem monta a tela poder decidir ANTES de desenhar: passando disso, o gráfico certo é
 * a barra deitada.
 */
export const RADAR_MAX_SLICES = 12;

/** Nome longo cortado no eixo; o nome inteiro continua no balão e na lista. */
export function shortenAxis(label: string, max = 16): string {
  if (label.length <= max) return label;

  return label.slice(0, max - 1).trimEnd() + '…';
}

export function AzuosRadarChart({ data, state, ui }: AzuosRadarChartProps) {
  const color = ui?.color ?? 'var(--chart-1)';

  return (
    <div className={ui?.className}>
      <AzuosEchart
        data={{
          option: (theme) => radarOption(data.slices, data.seriesLabel, color, theme),
          description: `${data.seriesLabel}: ${data.slices.length} categorias`,
        }}
        ui={{ heightClass: ui?.heightClass ?? 'h-72', emptyLabel: ui?.emptyLabel }}
        state={{ isLoading: state?.isLoading, isEmpty: data.slices.length === 0 }}
      />

      {/* A LISTA PARA LEITOR DE TELA. A teia é uma forma, e forma não se lê em voz alta: sem esta
          lista, quem usa leitor de tela não recebe nenhum dos números do gráfico. */}
      <AzuosChartValueList data={{ slices: data.slices }} />
    </div>
  );
}

/** A teia: grade nos tons do tema, nome de cada categoria no próprio eixo e a forma preenchida. */
export function radarOption(
  slices: readonly ChartSlice[],
  seriesLabel: string,
  color: string,
  theme: Pick<ChartTheme, 'border' | 'muted'>,
): ChartOption {
  const top = Math.max(...slices.map((slice) => slice.value), 1);
  const stroke = resolveColor(color);

  return {
    tooltip: { trigger: 'item' },
    radar: {
      radius: '68%',
      indicator: slices.map((slice) => ({ name: shortenAxis(slice.label), max: top })),
      axisName: { color: theme.muted, fontSize: 11 },
      splitLine: { lineStyle: { color: theme.border } },
      splitArea: { show: false },
      axisLine: { lineStyle: { color: theme.border } },
    },
    series: [
      {
        type: 'radar',
        name: seriesLabel,
        symbol: 'none',
        lineStyle: { color: stroke, width: 2 },
        areaStyle: { color: stroke, opacity: 0.25 },
        data: [{ name: seriesLabel, value: slices.map((slice) => slice.value) }],
        tooltip: {
          formatter: () =>
            slices.map((slice) => `${slice.label}: ${formatCount(slice.value)}`).join('<br/>'),
        },
      },
    ],
  };
}
