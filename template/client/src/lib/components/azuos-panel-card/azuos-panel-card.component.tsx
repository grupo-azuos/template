import { type ReactNode, useId } from 'react';

import { cn } from '../../utils/cn.util';

/**
 * A CASCA de um bloco do painel: título, uma linha de explicação e o conteúdo.
 *
 * Existe porque o mesmo cartão estava copiado em cada seção, e cópia de casca é como uma tela fica
 * com oito blocos de cantos, sombras e espaçamentos ligeiramente diferentes.
 *
 * A borda é fina e em VOLTA, nunca colorida de um lado só: ou o cartão é colorido inteiro (é o caso
 * do `AzuosStatCard`), ou a borda é fina em volta, ou não há borda.
 *
 * O `tools` é para o que muda o que o bloco MOSTRA — uma alternância entre Dia, Semana e Mês, por
 * exemplo. Ele fica no alto, à direita do título, e não embaixo: quem lê precisa saber o recorte
 * ANTES de ler o número.
 */
export type AzuosPanelCardProps = {
  data: { title: string; hint?: string | null };
  ui?: { className?: string; bodyClassName?: string };
  /** O controle que muda o recorte do bloco. */
  tools?: ReactNode;
  children: ReactNode;
};

export function AzuosPanelCard({ data, ui, tools, children }: AzuosPanelCardProps) {
  /* O título dá nome à seção: o leitor de tela anuncia "região, Receitas por mês" e dá para
     pular de painel em painel pelos marcos da página. */
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className={cn('rounded-surface border border-border bg-card p-5 shadow-card', ui?.className)}
    >
      {/* Empilhado no celular: título e controle lado a lado a 360px espremem os dois. */}
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2
            id={titleId}
            className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
          >
            {data.title}
          </h2>
          {data.hint ? <p className="mt-0.5 text-xs text-muted-foreground">{data.hint}</p> : null}
        </div>
        {tools ? <div className="shrink-0">{tools}</div> : null}
      </div>

      <div className={ui?.bodyClassName}>{children}</div>
    </section>
  );
}
