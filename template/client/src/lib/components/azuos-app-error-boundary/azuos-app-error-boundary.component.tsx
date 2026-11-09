import { Component, type ErrorInfo, type ReactNode } from 'react';

import { cn } from '../../utils/cn.util';

/**
 * Nenhum erro derruba a tela em silêncio.
 *
 * Sem isto, um erro durante a montagem esvazia o `#root` e o navegador mostra uma página
 * em branco — ou preta, quando o sistema está em tema escuro. É o pior resultado possível:
 * não há mensagem, não há o que relatar, e quem abriu não sabe nem se o sistema carregou.
 *
 * Classe porque o React só oferece captura de erro de render por `componentDidCatch`; não
 * existe equivalente em hook.
 */
export type AzuosAppErrorBoundaryProps = {
  children: ReactNode;
};

type AzuosAppErrorBoundaryState = {
  error: Error | null;
};

export class AzuosAppErrorBoundary extends Component<
  AzuosAppErrorBoundaryProps,
  AzuosAppErrorBoundaryState
> {
  override state: AzuosAppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AzuosAppErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[template] a tela quebrou ao montar', error, info.componentStack);
  }

  override render(): ReactNode {
    const error = this.state.error;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-100 p-6">
        <div
          role="alert"
          className={cn(
            'border border-border bg-card text-destructive',
            'w-full max-w-lg rounded-surface p-6 shadow-xl',
          )}
        >
          <h1 className="text-lg font-bold text-destructive">A tela não carregou</h1>
          <p className="mt-2 text-sm text-ink-700">
            O sistema encontrou um erro ao montar esta página. Nada do que você fez foi perdido —
            esta tela simplesmente não chegou a abrir.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-box bg-ink-100 p-3 text-xs text-ink-900">
            {error.message}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 control-md rounded-control bg-primary text-sm font-semibold text-primary-foreground"
          >
            Recarregar
          </button>
        </div>
      </div>
    );
  }
}
