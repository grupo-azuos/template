import { type ComponentProps } from 'react';

import { cn } from '../../utils/cn.util';
import { ChartContainer, type ChartConfig } from '../ui/chart';

/**
 * A MOLDURA DE TODO GRÁFICO — o que fica em volta do desenho do Recharts.
 *
 * Envolve o `ChartContainer` do shadcn (que é quem transforma o `config` em variáveis CSS
 * `--color-<chave>` e publica o contrato para o balão e a legenda) e acrescenta o que é do projeto:
 *
 *  1. **O traço no tom do sistema**: grade e eixos em `--border`, texto em `--muted-foreground`.
 *     Sem isso o Recharts desenha em cinzas fixos, que somem no tema escuro.
 *  2. **A altura como decisão de quem chama**, e não do gráfico: um painel com três blocos lado a
 *     lado só alinha se os três tiverem a mesma caixa.
 *  3. **O estado de carregando e o de vazio**, iguais em todos os gráficos — antes cada um escrevia
 *     o seu, e o mesmo painel tinha dois cinzas diferentes piscando.
 *
 * Nenhum gráfico do projeto desenha sem ela.
 */
export type AzuosChartFrameProps = {
  data: { config: ChartConfig };
  ui?: {
    className?: string;
    /** A altura da caixa de desenho. @default 'h-48' */
    heightClass?: string;
    /** O texto do vazio. @default 'Sem dados para mostrar' */
    emptyLabel?: string;
  };
  state?: { isLoading?: boolean; isEmpty?: boolean };
  /** O desenho do Recharts — um elemento só, como o `ChartContainer` exige. */
  children: ComponentProps<typeof ChartContainer>['children'];
};

/* As classes que acertam o traço do Recharts ao tema. Ficam aqui, num lugar só: repetidas em cada
   gráfico, a primeira tela nova esqueceria uma e a grade dela nasceria de outra cor. */
const CHART_THEME = cn(
  'aspect-auto h-full w-full overflow-visible text-xs',
  '[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground',
  '[&_.recharts-cartesian-grid_line]:stroke-border/50',
  '[&_.recharts-polar-grid_line]:stroke-border/60',
  '[&_.recharts-polar-angle-axis-tick_text]:fill-muted-foreground',
  '[&_.recharts-radial-bar-background-sector]:fill-muted',
  /* A régua vertical que o Recharts desenha sob o ponteiro: a grade já está lá, e ela ainda por
     cima é desenhada DEPOIS das marcas, atravessando as colunas. */
  '[&_.recharts-cartesian-axis-line]:stroke-transparent',
  '[&_.recharts-surface]:overflow-visible',
);

export function AzuosChartFrame({ data, ui, state, children }: AzuosChartFrameProps) {
  /* Os padrões saem do corpo da view, e não de uma fila de `??` antes do JSX. */
  const box = resolveBox(ui);

  if (state?.isLoading) return <ChartLoading ui={box} />;

  if (state?.isEmpty) return <ChartEmpty ui={box} />;

  return (
    <div className={cn('w-full', box.heightClass, box.className)}>
      <ChartContainer config={data.config} className={CHART_THEME}>
        {children}
      </ChartContainer>
    </div>
  );
}

/** A caixa do gráfico: altura, classe extra e a frase do vazio, já com os padrões resolvidos. */
function resolveBox(ui: AzuosChartFrameProps['ui']) {
  return {
    heightClass: ui?.heightClass ?? 'h-48',
    className: ui?.className,
    emptyLabel: ui?.emptyLabel ?? 'Sem dados para mostrar',
  };
}

/** Um bloco pulsando com a MESMA altura do gráfico: menor que ela, a tela salta quando o dado chega. */
function ChartLoading({ ui }: { ui: { heightClass: string; className?: string } }) {
  return (
    <div
      className={cn('bg-muted rounded-box w-full animate-pulse', ui.heightClass, ui.className)}
      aria-busy="true"
    />
  );
}

/**
 * Vazio é uma FRASE, não um gráfico em branco: um quadro vazio se lê como defeito, e a pessoa
 * recarrega a página em vez de entender que não há dado no período.
 */
function ChartEmpty({
  ui,
}: {
  ui: { heightClass: string; className?: string; emptyLabel: string };
}) {
  return (
    <p
      className={cn(
        'text-muted-foreground flex w-full items-center justify-center text-xs',
        ui.heightClass,
        ui.className,
      )}
    >
      {ui.emptyLabel}
    </p>
  );
}

/** Reexportado daqui para a tela não precisar importar de `components/ui`. */
export type { ChartConfig };

/**
 * O contrato de cores e rótulos a partir de uma lista de séries.
 *
 * Exportado como função porque a mesma conversão aparece no gráfico de área, no de linha e no de
 * barras agrupadas — e escrita à mão em cada um, a primeira série nova entra sem cor em um deles.
 */
export function configOfSeries(
  series: readonly { key: string; label: string; color: string }[],
): ChartConfig {
  return Object.fromEntries(
    series.map((item) => [item.key, { label: item.label, color: item.color }]),
  );
}
