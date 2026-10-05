import { Loader2 } from 'lucide-react';

import { cn } from '../../utils/cn.util';

/**
 * O botão que envia o formulário.
 *
 * Ele se desabilita enquanto envia, e isso não é enfeite: sem a trava, dois cliques viram dois
 * registros — e o segundo volta como "já existe uma conta com esse e-mail", num formulário que
 * acabou de dar certo.
 */
export type AzuosSubmitButtonProps = {
  data: { label: string; loadingLabel?: string };
  ui?: { className?: string };
  state?: { isLoading?: boolean; isDisabled?: boolean };
};

export function AzuosSubmitButton({ data, ui, state }: AzuosSubmitButtonProps) {
  const isBusy = Boolean(state?.isLoading);

  return (
    <button
      type="submit"
      disabled={isBusy || state?.isDisabled}
      /* `aria-busy` diz ao leitor de tela que a espera é esperada. Sem ele, o botão simplesmente
         para de responder. */
      aria-busy={isBusy}
      className={cn(
        /* O degrau `md` da régua de medidas (`lib/theme/tokens.css`) — o mesmo do
           `AzuosActionButton`, que é quem fica ao lado dele no rodapé do diálogo. Com a altura
           vindo só do padding, dava 4px a mais que o "Cancelar" ao lado. */
        'control-md rounded-control',
        'inline-flex w-full items-center justify-center gap-2 sm:w-auto',
        'bg-primary text-primary-foreground text-sm font-semibold shadow-xs transition-colors',
        'hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60',
        ui?.className,
      )}
    >
      {isBusy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {isBusy ? (data.loadingLabel ?? data.label) : data.label}
    </button>
  );
}
