import { PolarAngleAxis, RadialBar, RadialBarChart } from 'recharts';

import { cn } from '../../utils/cn.util';
import { AzuosChartFrame } from '../azuos-chart-frame/azuos-chart-frame.component';

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

const VALUE_KEY = 'value';

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
  const max = data.max ?? 100;
  const color = ui?.color ?? 'var(--chart-1)';
  const percent = fractionOf(data.value, max) * 100;
  const heightClass = ui?.heightClass ?? 'h-40';

  return (
    <div className={cn('relative', heightClass, ui?.className)}>
      <AzuosChartFrame
        data={{ config: { [VALUE_KEY]: { label: data.label, color } } }}
        ui={{ heightClass }}
        state={{ isLoading: state?.isLoading }}
      >
        <RadialBarChart
          data={[{ [VALUE_KEY]: percent }]}
          startAngle={90}
          endAngle={-270}
          innerRadius="72%"
          outerRadius="100%"
        >
          {/* `PolarAngleAxis` com domínio fixo é o que dá ESCALA ao arco: sem ele o Recharts estica a
              única barra até a volta completa, e 20% desenha igual a 80%. */}
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
          <RadialBar
            dataKey={VALUE_KEY}
            cornerRadius={999}
            fill={color}
            /* A trilha de trás: é ela que faz o arco ser lido como "quanto de quanto". */
            background
          />
        </RadialBarChart>
      </AzuosChartFrame>

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
      <span className="text-foreground text-2xl leading-tight font-bold tabular-nums">
        {data.display ?? data.value.toLocaleString('pt-BR')}
      </span>
      <span className="text-muted-foreground text-xs tracking-wide uppercase">{data.label}</span>
      {data.hint ? <span className="text-muted-foreground mt-0.5 text-xs">{data.hint}</span> : null}
    </div>
  );
}
