import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from 'recharts';

import { type ChartSlice } from '../../utils/chart-slice.util';
import { AzuosChartFrame } from '../azuos-chart-frame/azuos-chart-frame.component';
import { AzuosChartTooltip } from '../azuos-chart-tooltip/azuos-chart-tooltip.component';
import { ChartTooltip } from '../ui/chart';

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

const VALUE_KEY = 'value';

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
      <AzuosChartFrame
        data={{ config: { [VALUE_KEY]: { label: data.seriesLabel, color } } }}
        ui={{ heightClass: ui?.heightClass ?? 'h-72', emptyLabel: ui?.emptyLabel }}
        state={{ isLoading: state?.isLoading, isEmpty: data.slices.length === 0 }}
      >
        <RadarChart data={data.slices} outerRadius="72%">
          <PolarGrid />
          <PolarAngleAxis dataKey="label" tickFormatter={(label: string) => shortenAxis(label)} />
          <ChartTooltip
            content={
              <AzuosChartTooltip
                nameKey={VALUE_KEY}
                labelFormatter={(_, payload) =>
                  (payload?.[0]?.payload as ChartSlice | undefined)?.label ?? ''
                }
              />
            }
          />
          <Radar
            dataKey={VALUE_KEY}
            stroke={color}
            fill={color}
            fillOpacity={0.25}
            strokeWidth={2}
          />
        </RadarChart>
      </AzuosChartFrame>

      {/* A LISTA PARA LEITOR DE TELA. A teia é uma forma, e forma não se lê em voz alta: sem esta
          lista, quem usa leitor de tela não recebe nenhum dos números do gráfico. */}
      <ul className="sr-only">
        {data.slices.map((slice) => (
          <li key={slice.label}>
            {slice.label}: {slice.value}
          </li>
        ))}
      </ul>
    </div>
  );
}
