import { type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

import { cardToneClasses } from '../../utils/card-tone.util';
import { cn } from '../../utils/cn.util';

/**
 * O TÍTULO DE UMA SEÇÃO de cartão: quadradinho com ícone, título e uma linha de explicação.
 *
 * Existe para as seções de perfil (Dados pessoais, Organização, Sistemas, Papel, Senha…) terem o
 * mesmo cabeçalho nas duas telas que as mostram — a da própria pessoa e a de quem administra.
 * Copiado em cada seção, o ícone já tinha saído de um tamanho diferente em cada lugar.
 *
 * O tom `danger` é só para a zona de perigo: o vermelho no título avisa antes do botão.
 * O `adornment` entra DENTRO do título, ao lado do texto — a contagem de uma lista, por exemplo.
 */
export type AzuosSectionTitleProps = {
  data: { title: string; description?: string | null };
  ui: { icon: LucideIcon; tone?: 'brand' | 'danger'; className?: string };
  adornment?: ReactNode;
};

export function AzuosSectionTitle({ data, ui, adornment }: AzuosSectionTitleProps) {
  const Icon = ui.icon;
  const isDanger = ui.tone === 'danger';

  return (
    <div className={cn('flex items-start gap-3', ui.className)}>
      <span
        className={cn(
          'rounded-chip flex size-9 shrink-0 items-center justify-center',
          isDanger ? cardToneClasses('danger').dot : cardToneClasses('brand').dot,
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <h2
          className={cn(
            'flex flex-wrap items-center gap-2 text-lg font-semibold',
            isDanger ? 'text-destructive' : 'text-foreground',
          )}
        >
          {data.title}
          {adornment}
        </h2>
        {data.description ? <p className="text-ink-500 mt-1 text-sm">{data.description}</p> : null}
      </div>
    </div>
  );
}
