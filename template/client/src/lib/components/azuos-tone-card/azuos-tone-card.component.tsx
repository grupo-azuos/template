import { type CSSProperties, type ReactNode } from 'react';

import { type FillTone, useHoverFill } from '../../motion/use-hover-fill';
import { cn } from '../../utils/cn.util';

/**
 * O CARD COLORIDO do grupo — o padrão do Chamados, igual nos 13 sistemas.
 *
 * A cor vem do FUNDO, nunca da borda: borda colorida (faixa na lateral, contorno no tom) é
 * proibida em qualquer componente. Dois modos:
 *
 * - **`static`** — o fundo suave do tom, parado. Sem hover, sem nada: é informação.
 * - **`interactive`** — neutro em repouso; no hover, a cor do tom entra em círculo a partir de
 *   onde o mouse entrou (a utilidade `hover-fill` + `useHoverFill`, as mesmas do Chamados, que já
 *   respeitam o modo leve e quem pediu menos movimento). Com `onClick`, o card inteiro vira um
 *   botão de verdade.
 *
 * Selecionado (`state.isSelected`) é o fundo na cor CHEIA do tom — nunca um contorno.
 */
export type AzuosToneCardTone = 'brand' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';

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

const SOFT: Record<AzuosToneCardTone, string> = {
  brand: 'bg-primary-soft text-ink-900',
  neutral: 'bg-card text-card-foreground border border-border',
  success: 'bg-success-soft text-ink-900',
  warning: 'bg-warning-soft text-ink-900',
  danger: 'bg-destructive-soft text-ink-900',
  info: 'bg-info-soft text-ink-900',
};

const SOLID: Record<AzuosToneCardTone, string> = {
  brand: 'bg-primary text-primary-foreground',
  neutral: 'bg-ink-700 text-primary-foreground',
  success: 'bg-success text-primary-foreground',
  warning: 'bg-warning text-primary-foreground',
  danger: 'bg-destructive text-primary-foreground',
  info: 'bg-info text-primary-foreground',
};

const BASE = 'rounded-surface relative p-4 shadow-xs';

export function AzuosToneCard({ data, ui, state, actions, children }: AzuosToneCardProps) {
  const tone = ui?.tone ?? 'neutral';

  if (state?.isSelected) {
    return (
      <Surface data={data} actions={actions} className={cn(BASE, SOLID[tone], ui?.className)} isSelected>
        {children}
      </Surface>
    );
  }
  if (ui?.mode === 'interactive') {
    return (
      <InteractiveCard data={data} tone={tone} actions={actions} className={ui.className}>
        {children}
      </InteractiveCard>
    );
  }

  return (
    <Surface data={data} actions={actions} className={cn(BASE, SOFT[tone], ui?.className)}>
      {children}
    </Surface>
  );
}

function InteractiveCard({
  data,
  tone,
  actions,
  className,
  children,
}: {
  data: AzuosToneCardProps['data'];
  tone: FillTone;
  actions: AzuosToneCardProps['actions'];
  className?: string;
  children: ReactNode;
}) {
  const fill = useHoverFill(tone);

  return (
    <Surface
      data={data}
      actions={actions}
      className={cn(BASE, 'hover-fill bg-card text-card-foreground border-border border', className)}
      handlers={fill.handlers}
      style={fill.style}
    >
      {children}
    </Surface>
  );
}

function Surface({
  data,
  actions,
  className,
  handlers,
  style,
  isSelected,
  children,
}: {
  data: AzuosToneCardProps['data'];
  actions: AzuosToneCardProps['actions'];
  className: string;
  handlers?: ReturnType<typeof useHoverFill>['handlers'];
  style?: CSSProperties;
  isSelected?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      role="group"
      aria-label={data?.label}
      data-selected={isSelected ? 'true' : undefined}
      className={cn(className, actions?.onClick && 'cursor-pointer')}
      style={style}
      {...handlers}
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
