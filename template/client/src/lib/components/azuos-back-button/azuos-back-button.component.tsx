import { ArrowLeft } from 'lucide-react';
import type { MouseEvent } from 'react';

import { cn } from '../../utils/cn.util';

/**
 * BOTÃO DE VOLTAR CANÔNICO DO GRUPO AZUOS.
 *
 * Regra absoluta de navegação da casa: todo retorno de página de detalhe/entidade utiliza
 * EXCLUSIVAMENTE este formato (`← Voltar para [destino]`). É um link de texto limpo, sem moldura,
 * sem caixa cinza, sem sombra e sem fundo espalhafatoso, usando a cor primária da marca
 * (`text-primary`) com seta fina à esquerda (`ArrowLeft`).
 *
 * É proibido criar botões de voltar com variantes `outline`, circulares com ícone isolado,
 * botões cinzas ou textos arbitrários fora dessa convenção.
 */
export type AzuosBackButtonProps = {
  data: {
    /** Nome amigável do destino para compor o texto "Voltar para [destination]" */
    destination?: string;
    /** Rótulo explícito opcional (se omitido, usa "Voltar para {destination}" ou "Voltar") */
    label?: string;
    /** URL/caminho de destino (se informado, renderiza como link `<a>`) */
    to?: string;
  };
  ui?: {
    className?: string;
  };
  state?: {
    isDisabled?: boolean;
  };
  actions?: {
    /** Callback de clique. Se omitido e não houver `to`, aciona `window.history.back()`. */
    onClick?: (event: MouseEvent<HTMLElement>) => void;
  };
};

export function AzuosBackButton({ data, ui, state, actions }: AzuosBackButtonProps) {
  const displayText = data.label ?? (data.destination ? `Voltar para ${data.destination}` : 'Voltar');
  const isDisabled = Boolean(state?.isDisabled);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    if (isDisabled) {
      event.preventDefault();
      return;
    }
    if (actions?.onClick) {
      actions.onClick(event);
      return;
    }
    if (!data.to && typeof window !== 'undefined') {
      window.history.back();
    }
  };

  const sharedClassName = cn(
    'group inline-flex items-center gap-1.5 py-1 text-sm font-medium text-primary transition-colors',
    'hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-control',
    isDisabled && 'pointer-events-none opacity-50',
    ui?.className,
  );

  if (data.to && !isDisabled) {
    return (
      <a
        href={data.to}
        onClick={handleClick}
        className={sharedClassName}
        data-slot="azuos-back-button"
      >
        <ArrowLeft className="size-4 shrink-0 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
        <span>{displayText}</span>
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className={sharedClassName}
      data-slot="azuos-back-button"
    >
      <ArrowLeft className="size-4 shrink-0 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
      <span>{displayText}</span>
    </button>
  );
}
