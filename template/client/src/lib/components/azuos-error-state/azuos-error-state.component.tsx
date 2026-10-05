import { AlertTriangle, RotateCw } from 'lucide-react';

import { cn } from '../../utils/cn.util';

/**
 * A falha, com o motivo escrito — nunca um silêncio nem um "algo deu errado".
 *
 * Duas formas, e a escolha não é estética: `block` ocupa o lugar do conteúdo que não carregou (a
 * lista inteira falhou); `inline` é uma linha dentro de um formulário ou diálogo, onde o resto da
 * tela continua válido e um bloco vermelho gigante assustaria mais do que informa.
 *
 * `onRetry` só aparece quando tentar de novo pode de fato resolver. Um botão que reexecuta uma
 * recusa de permissão só ensina a pessoa a clicar duas vezes antes de pedir ajuda.
 *
 * `role="alert"` é o que faz o leitor de tela anunciar a falha na hora em que ela aparece.
 */
export type AzuosErrorStateProps = {
  data: { message: string; title?: string };
  ui?: { variant?: 'block' | 'inline'; className?: string };
  state?: { isRetrying?: boolean };
  actions?: { onRetry?: () => void };
};

export function AzuosErrorState({ data, ui, state, actions }: AzuosErrorStateProps) {
  const isInline = ui?.variant === 'inline';
  const isRetrying = Boolean(state?.isRetrying);

  return (
    <div
      role="alert"
      className={cn(
        'rounded-box border-destructive/40 bg-destructive/10 text-destructive flex gap-3 border',
        isInline ? 'items-center px-3 py-2' : 'items-start p-4',
        ui?.className,
      )}
    >
      <AlertTriangle
        className={cn('text-destructive shrink-0', isInline ? 'size-4' : 'mt-0.5 size-5')}
        aria-hidden="true"
      />

      {isInline ? (
        <p className="min-w-0 flex-1 text-sm break-words">{data.message}</p>
      ) : (
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{data.title ?? 'Algo deu errado'}</p>
          <p className="text-destructive mt-0.5 text-sm break-words">{data.message}</p>
        </div>
      )}

      {actions?.onRetry ? (
        <RetryButton state={{ isRetrying }} actions={{ onRetry: actions.onRetry }} />
      ) : null}
    </div>
  );
}

/**
 * O botão não passa pelo `AzuosActionButton` de propósito: ele é vermelho sobre fundo vermelho
 * claro, uma combinação que nenhuma variante do botão tem — e criar uma variante usada em um lugar
 * só é como a lista de variantes cresce até ninguém saber qual escolher.
 */
function RetryButton({
  state,
  actions,
}: {
  state: { isRetrying: boolean };
  actions: { onRetry: () => void };
}) {
  return (
    <button
      type="button"
      onClick={actions.onRetry}
      disabled={state.isRetrying}
      className="control-sm rounded-control border-destructive/40 bg-card text-destructive hover:bg-destructive-soft inline-flex shrink-0 items-center gap-1.5 border text-xs font-semibold disabled:opacity-60"
    >
      <RotateCw className={cn('size-3.5', state.isRetrying && 'animate-spin')} aria-hidden="true" />
      Tentar de novo
    </button>
  );
}
