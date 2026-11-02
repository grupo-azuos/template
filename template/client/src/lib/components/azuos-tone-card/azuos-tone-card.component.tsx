import { type ReactNode } from 'react';

import { type AzuosCardTone, cardToneClasses } from '../../utils/card-tone.util';
import { cn } from '../../utils/cn.util';

/**
 * O CARD COLORIDO do grupo, igual nos 13 sistemas.
 *
 * A cor vem da paleta única de card (`lib/utils/card-tone.util.ts`): fundo pastel e texto escuro
 * do mesmo matiz, o mesmo nos dois temas. Nunca borda colorida, nunca opacidade, nunca cor cheia.
 *
 * - **`static`**: só o fundo do matiz. É informação.
 * - **`interactive`**: o mesmo fundo; no hover fica mais CLARO e ganha sombra. Com `onClick`, o
 *   card inteiro vira um botão de verdade.
 *
 * Selecionado (`state.isSelected`) é o pastel médio do matiz.
 */
export type AzuosToneCardTone = AzuosCardTone;

export type AzuosToneCardProps = {
  data?: { label?: string };
  ui?: {
    tone?: AzuosToneCardTone;
    mode?: 'static' | 'interactive';
    className?: string;
  };
  state?: { isSelected?: boolean };
  actions?: { onClick?: () => void };
  children: ReactNode;
};

const BASE = 'rounded-surface relative p-4 shadow-card transition-all';
const LIFT = 'hover:-translate-y-0.5 hover:shadow-xl';

/** O fundo do card: o do matiz, o do hover quando responde ao mouse, o médio quando escolhido. */
function surfaceOf(props: AzuosToneCardProps): string {
  const tone = cardToneClasses(props.ui?.tone ?? 'neutral');
  if (props.state?.isSelected) return cn(tone.selected, LIFT);
  if (props.ui?.mode === 'interactive') return cn(tone.surface, tone.hover, LIFT);

  return tone.surface;
}

export function AzuosToneCard(props: AzuosToneCardProps) {
  const { data, ui, state, actions, children } = props;

  return (
    <Surface
      data={data}
      actions={actions}
      className={cn(BASE, surfaceOf(props), ui?.className)}
      isSelected={state?.isSelected}
    >
      {children}
    </Surface>
  );
}

function Surface({
  data,
  actions,
  className,
  isSelected,
  children,
}: {
  data: AzuosToneCardProps['data'];
  actions: AzuosToneCardProps['actions'];
  className: string;
  isSelected?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      role="group"
      aria-label={data?.label}
      data-selected={isSelected ? 'true' : undefined}
      className={cn(className, actions?.onClick && 'cursor-pointer')}
    >
      {/* O clique é um BOTÃO de verdade, por cima do card inteiro: alcançável pelo teclado e
          anunciado pelo leitor de tela, sem trocar a marcação do conteúdo. */}
      {actions?.onClick ? (
        <button
          type="button"
          aria-label={data?.label}
          aria-pressed={isSelected ?? false}
          onClick={actions.onClick}
          className="rounded-surface focus-visible:ring-ring absolute inset-0 z-10 cursor-pointer focus-visible:ring-2 focus-visible:outline-none"
        />
      ) : null}
      {children}
    </div>
  );
}
