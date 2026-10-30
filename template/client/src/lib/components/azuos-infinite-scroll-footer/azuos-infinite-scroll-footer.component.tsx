import { Loader2 } from 'lucide-react';

import { useOnVisible } from '../../hooks/use-on-visible/use-on-visible';
import { cn } from '../../utils/cn.util';
import { Button } from '../ui/button';

/**
 * O FIM DA LISTA QUE ROLA — pede a próxima página ao chegar perto dele.
 *
 * É o rodapé das listagens em TABELA. Cartão pagina com botão (`AzuosPaginationBar`); tabela rola.
 * A divisão é da tela: no modo cartão a pessoa varre visualmente e quer saber onde está; na
 * tabela ela procura uma linha e rolar é o gesto natural.
 *
 * O botão "Carregar mais" continua aqui, e não é redundância: o `IntersectionObserver` não
 * existe em todo ambiente (jsdom, por exemplo), rolagem com teclado nem sempre chega ao
 * sentinela, e leitor de tela não "rola até ver". Sem o botão, quem não dispara o observador
 * fica sem caminho nenhum para o resto da lista.
 *
 * Compositor puro: recebe tudo por props e não busca nada.
 */
export type AzuosInfiniteScrollFooterProps = {
  data: { loaded: number; totalItems: number };
  ui?: {
    /** O que está sendo contado: "de 566 empresas" em vez de "de 566". */
    itemNoun?: { singular: string; plural: string };
    className?: string;
  };
  state: { isLoading: boolean; hasMore: boolean };
  actions: { onLoadMore: () => void };
};

export function AzuosInfiniteScrollFooter({
  data,
  ui,
  state,
  actions,
}: AzuosInfiniteScrollFooterProps) {
  /* Desligado quando não há mais o que buscar OU enquanto a busca corre: sem isso, uma
     rolagem rápida dispara a mesma página várias vezes. */
  const { ref } = useOnVisible(actions.onLoadMore, {
    isEnabled: state.hasMore && !state.isLoading,
  });

  const word = nounFor(data.totalItems, ui?.itemNoun);

  return (
    <div className={cn('mt-4 flex flex-col items-center gap-3', ui?.className)}>
      <p className="text-sm text-ink-500" aria-live="polite">
        {state.hasMore
          ? `${data.loaded} de ${data.totalItems}${word ? ` ${word}` : ''}`
          : `${data.totalItems}${word ? ` ${word}` : ''} — fim da lista`}
      </p>

      {state.hasMore ? (
        <Button variant="outline" size="sm" disabled={state.isLoading} onClick={actions.onLoadMore}>
          {state.isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              Carregando…
            </>
          ) : (
            'Carregar mais'
          )}
        </Button>
      ) : null}

      {/* O sentinela: entrar na tela é o que pede a próxima página. Fica DEPOIS do botão para
          que o `rootMargin` conte a partir do fim real do conteúdo. */}
      <div ref={ref} aria-hidden="true" className="h-px w-full" />
    </div>
  );
}

/** "empresa" ou "empresas", ou nada quando quem chama não disse o que está contando. */
function nounFor(total: number, noun?: { singular: string; plural: string }): string {
  if (!noun) return '';

  return total === 1 ? noun.singular : noun.plural;
}
