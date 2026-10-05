import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { cn } from '../../utils/cn.util';
import {
  dayLabel,
  hourLabel,
  toTimeRows,
  type TimePoint,
  type TimeSeriesDef,
} from '../../utils/time-series.util';
import { AzuosChartFrame, configOfSeries } from '../azuos-chart-frame/azuos-chart-frame.component';
import { AzuosChartLegend } from '../azuos-chart-legend/azuos-chart-legend.component';
import { AzuosChartTooltip } from '../azuos-chart-tooltip/azuos-chart-tooltip.component';
import { ChartTooltip } from '../ui/chart';

/**
 * ÁREA — o volume de alguma coisa ao longo do tempo.
 *
 * Área, e não barra: aqui a pergunta é "quando subiu e por quanto tempo ficou lá", e a resposta é a
 * FORMA da curva. Trinta barras de meio pixel não desenham forma nenhuma.
 *
 * Duas formas de empilhar, e a escolha muda o que o gráfico RESPONDE:
 *
 *  - **`overlap`** (o padrão): as séries se sobrepõem, cada uma lida na própria altura. É o que se
 *    quer quando elas são a MESMA medida em coisas diferentes — três setores, todos de 0 a 100%.
 *    Empilhar daria 300% de nada.
 *  - **`stack`**: uma em cima da outra, e a altura total é a soma. É o que se quer quando elas são
 *    PARTES de um todo — quantas tarefas de cada tipo entraram no dia.
 */
export type AzuosAreaChartProps = {
  data: { points: readonly TimePoint[]; series: readonly TimeSeriesDef[] };
  state?: { isLoading?: boolean };
  ui?: {
    emptyLabel?: string;
    className?: string;
    /** @default 'overlap' */
    layout?: 'overlap' | 'stack';
    /** A régua do eixo do tempo. @default 'day' */
    tick?: 'hour' | 'day';
    /** Trava a escala em 0–100 — para quando o dado É porcentagem. */
    isPercent?: boolean;
    /** A altura da caixa de desenho. @default 'h-48' */
    heightClass?: string;
  };
};

/**
 * FOLGA EM CIMA quando o dado é porcentagem: numa escala travada em 0–100, uma leitura de 100% cai
 * exatamente na borda do desenho. Sem folga, o traço encosta no limite do quadro e o pico sai
 * ACHATADO contra a borda — quem olha não distingue "bateu no teto" de "o gráfico foi cortado".
 */
function percentScale(isPercent: boolean | undefined) {
  if (!isPercent) return {};

  return { domain: [0, 105], ticks: [0, 25, 50, 75, 100] };
}

export function AzuosAreaChart({ data, state, ui }: AzuosAreaChartProps) {
  const rows = toTimeRows(data.points, data.series);
  const config = configOfSeries(data.series);
  const formatTick = ui?.tick === 'hour' ? hourLabel : dayLabel;
  const isStacked = ui?.layout === 'stack';

  return (
    <div className={cn('flex flex-col gap-2', ui?.className)}>
      <AzuosChartLegend data={{ series: data.series }} />

      <AzuosChartFrame
        data={{ config }}
        ui={{ heightClass: ui?.heightClass, emptyLabel: ui?.emptyLabel }}
        state={{ isLoading: state?.isLoading, isEmpty: rows.length === 0 }}
      >
        <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="at"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={24}
            tickFormatter={(value: Date | string) => formatTick(value)}
          />
          <YAxis width={34} tickLine={false} axisLine={false} {...percentScale(ui?.isPercent)} />
          <ChartTooltip
            content={
              <AzuosChartTooltip
                labelFormatter={(_, payload) => {
                  const at = (payload?.[0]?.payload as { at?: Date } | undefined)?.at;

                  return at ? formatTick(at) : '';
                }}
              />
            }
          />

          {data.series.map((series) => (
            <Area
              key={series.key}
              dataKey={series.key}
              type="monotone"
              stackId={isStacked ? 'total' : undefined}
              stroke={'var(--color-' + series.key + ')'}
              fill={'var(--color-' + series.key + ')'}
              /* Sobrepostas, as áreas têm de deixar ver a de baixo; empilhadas, não há o que ver
                 atrás e a cor cheia lê melhor. */
              fillOpacity={isStacked ? 0.85 : 0.2}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </AreaChart>
      </AzuosChartFrame>
    </div>
  );
}
