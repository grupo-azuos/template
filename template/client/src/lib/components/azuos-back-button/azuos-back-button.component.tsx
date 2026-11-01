import { ArrowLeft } from 'lucide-react';
import type { MouseEvent } from 'react';

import { cn } from '../../utils/cn.util';

/**
 * BOTÃO DE VOLTAR CANÔNICO DO GRUPO AZUOS.
 *
 * Regra absoluta de navegação da casa: todo retorno de página de detalhe/entidade utiliza
 * EXCLUSIVAMENTE este formato (`← Voltar para [destino]`). É um link de texto limpo, sem moldura,
 * sem caixa cinza, sem sombra e sem fundo espalhafatoso: texto azul da marca (`text-brand-blue-700`),
 * sublinhado no hover, com seta fina de 14px à esquerda (`ArrowLeft`). É cópia fiel do voltar do
 * paralegal ("Voltar para empresas"), que é a referência do grupo — não mude o desenho aqui.
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
  const displayText =
    data.label ?? (data.destination ? `Voltar para ${data.destination}` : 'Voltar');
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
    'text-brand-blue-700 dark:text-foreground inline-flex items-center gap-1 self-start text-sm hover:underline',
    'focus-visible:ring-ring rounded-control focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
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
        <ArrowLeft className="size-3.5 shrink-0" aria-hidden="true" />
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
      <ArrowLeft className="size-3.5 shrink-0" aria-hidden="true" />
      <span>{displayText}</span>
    </button>
  );
}
