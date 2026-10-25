import { cn } from '../../utils/cn.util';
import { type ChartOption, type ChartTheme, resolveColor } from '../../utils/echarts.util';
import { AzuosEchart } from '../azuos-echart/azuos-echart.component';

/**
 * MEDIDOR RADIAL — um número só, contra o quanto ele poderia ser.
 *
 * É o gráfico certo para "quanto de 100", e o errado para comparar categorias: um arco não se compara
 * com outro arco de outro cartão. Serve para "84 das 96 tarefas concluídas" e não serve para "qual
 * responsável fez mais" — isso é barra.
 *
 * O arco de TRÁS (a trilha) é o que faz o gráfico ser lido: sem ele, um arco de 20% e um de 80%
 * parecem só dois riscos de tamanhos diferentes, sem escala nenhuma.
 *
 * O número no meio vem sempre ESCRITO. O arco é o reforço, nunca a única informação.
 */
export type AzuosRadialChartProps = {
  data: {
    value: number;
    /** O teto da escala — o "de quanto". @default 100 */
    max?: number;
    /** O que está sendo medido: "Tarefas concluídas". */
    label: string;
    /** O número grande no meio. Sem isto, o próprio valor. */
    display?: string;
    /** A linha pequena embaixo do número: "de 96 cadastradas". */
    hint?: string | null;
  };
  state?: { isLoading?: boolean };
  ui?: {
    /** A cor do arco. @default 'var(--chart-1)' */
    color?: string;
    className?: string;
    /** A altura da caixa de desenho. @default 'h-40' */
    heightClass?: string;
  };
};

/**
 * A fração preenchida, entre 0 e 1.
 *
 * Exportada para ter teste próprio: teto zero é divisão por zero, e valor acima do teto desenharia
 * um arco dando mais de uma volta — os dois viram um gráfico que mente.
 */
export function fractionOf(value: number, max: number): number {
  if (max <= 0) return 0;

  return Math.min(1, Math.max(0, value / max));
}

export function AzuosRadialChart({ data, state, ui }: AzuosRadialChartProps) {
  const { color, heightClass } = radialLookOf(ui);
  const percent = fractionOf(data.value, data.max ?? 100) * 100;

  return (
    <div className={cn('relative', heightClass, ui?.className)}>
      <AzuosEchart
        data={{
          option: (theme) => radialOption(percent, color, theme),
          description: `${data.label}: ${data.display ?? data.value}`,
        }}
        ui={{ heightClass }}
        state={{ isLoading: state?.isLoading }}
      />

      {state?.isLoading ? null : <RadialCenter data={data} />}
    </div>
  );
}

/**
 * O número no meio do arco. Vem sempre ESCRITO: o arco é o reforço, nunca a única informação —
 * ninguém mede um ângulo a olho.
 */
function RadialCenter({ data }: { data: AzuosRadialChartProps['data'] }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
      {/* Menor no celular: três medidores lado a lado numa tela de 360px não comportam o número
          grande sem ele encostar no arco. */}
      <span className="text-foreground text-lg leading-tight font-bold tabular-nums sm:text-2xl">
        {data.display ?? data.value.toLocaleString('pt-BR')}
      </span>
      <span className="text-muted-foreground max-w-[70%] truncate text-xs tracking-wide uppercase">
        {data.label}
      </span>
      {data.hint ? (
        <span className="text-muted-foreground mt-0.5 max-w-[70%] truncate text-xs">{data.hint}</span>
      ) : null}
    </div>
  );
}

function radialLookOf(ui: AzuosRadialChartProps['ui']) {
  return { color: ui?.color ?? 'var(--chart-1)', heightClass: ui?.heightClass ?? 'h-40' };
}

/**
 * O arco: começa no topo e anda no sentido do relógio, com a TRILHA de trás na cor apagada do tema —
 * é ela que faz o arco ser lido como "quanto de quanto". A escala é fixa em 0–100: sem isso, 20%
 * desenharia igual a 80%.
 */
export function radialOption(percent: number, color: string, theme: Pick<ChartTheme, 'track'>): ChartOption {
  return {
    series: [
      {
        type: 'gauge',
        startAngle: 90,
        endAngle: -270,
        min: 0,
        max: 100,
        radius: '100%',
        pointer: { show: false },
        progress: { show: true, roundCap: true, width: 12, itemStyle: { color: resolveColor(color) } },
        axisLine: { roundCap: true, lineStyle: { width: 12, color: [[1, theme.track]] } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: { show: false },
        title: { show: false },
        data: [{ value: percent }],
      },
    ],
  };
}
