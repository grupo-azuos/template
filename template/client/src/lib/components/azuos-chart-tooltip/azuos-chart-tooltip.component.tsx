import { type ComponentProps } from 'react';

import { cn } from '../../utils/cn.util';
import { ChartTooltipContent } from '../ui/chart';

/**
 * O BALÃO que segue o ponteiro dentro de um gráfico.
 *
 * Envolve o `ChartTooltipContent` do shadcn, com duas diferenças de propósito:
 *
 *  - **O número sai em português** (`1.240`, e não `1,240`). O original usa o idioma do navegador, e
 *    aí o mesmo painel mostra o mesmo número de dois jeitos em duas máquinas.
 *  - **A casca é a do projeto**: cartão com raio de bloco e sombra macia, sem a borda fina que
 *    brigava com o fundo. Antes cada gráfico escrevia essa mesma `className` à mão, e um deles
 *    ficava sempre um pixel diferente dos outros.
 *
 * Vai sempre dentro do `content` de um `ChartTooltip` — fora dele não há ponteiro nem série.
 */
export type AzuosChartTooltipProps = ComponentProps<typeof ChartTooltipContent>;

/** O número como a pessoa escreve. Fora disso, o valor como veio. */
export function formatChartValue(value: unknown): string {
  return typeof value === 'number' ? value.toLocaleString('pt-BR') : String(value ?? '');
}

export function AzuosChartTooltip({ className, formatter, ...rest }: AzuosChartTooltipProps) {
  return (
    <ChartTooltipContent
      {...rest}
      formatter={formatter}
      className={cn(
        'bg-card rounded-box border-none px-3 py-2.5 shadow-xl ring-1 ring-black/5',
        className,
      )}
    />
  );
}
