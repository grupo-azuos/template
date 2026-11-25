import { type ReactNode } from 'react';

import { cn } from '../../utils/cn.util';

/**
 * A SUPERFÍCIE do card de conteúdo (`AzuosContentCard`) — o andar de baixo do único card do grupo.
 * Não é um formato de card: tela nenhuma monta card direto sobre ela.
 *
 * - Fundo: a superfície (`bg-card`) SEM borda; o que separa o card do fundo é o fio de 1px e a
 *   sombra difusa do `--elevation-card` (padrão Apple). A cor entra no ícone cheio do assunto
 *   (`lib/utils/card-tone.util.ts`), nunca no fundo do card.
 * - Hover: NADA se mexe. O card não sobe, a sombra não cresce, nada aparece por cima — clicável,
 *   só o cursor diz que ele abre.
 * - Escolhido: o azul claro da marca (`bg-card-selected`) com texto branco. Quem está dentro lê o
 *   estado por `group-data-[selected=true]/card:` para inverter o texto.
 * - Clicável: um botão de verdade cobre o card inteiro, alcançável pelo teclado.
 *
 * Nunca borda colorida, nunca fundo pastel ou cheio no tom, nunca ícone grande no canto.
 */
export type AzuosCardSurfaceProps = {
  data?: { label?: string };
  ui?: { className?: string };
  /** `isDisabled`: o botão do card não responde (enquanto carrega, por exemplo). */
  state?: { isSelected?: boolean; isDisabled?: boolean };
  actions?: { onClick?: () => void };
  children: ReactNode;
};

/** A casca no padrão Apple: superfície sem borda, com o fio de 1px e a sombra difusa. Parada. */
function surfaceClassOf(props: { isSelected: boolean; isClickable: boolean; className?: string }) {
  return cn(
    'group/card rounded-surface shadow-card relative isolate overflow-hidden',
    props.isSelected ? 'bg-card-selected text-on-card-selected' : 'bg-card text-card-foreground',
    props.isClickable && 'cursor-pointer',
    props.className,
  );
}

/** O estado lido uma vez: escolhido, clicável (tem ação e não está desligado), desligado. */
function flagsOf(props: Pick<AzuosCardSurfaceProps, 'state' | 'actions'>) {
  const isDisabled = Boolean(props.state?.isDisabled);

  return {
    isSelected: Boolean(props.state?.isSelected),
    isDisabled,
    isClickable: Boolean(props.actions?.onClick) && !isDisabled,
  };
}

export function AzuosCardSurface({ data, ui, state, actions, children }: AzuosCardSurfaceProps) {
  const flags = flagsOf({ state, actions });

  return (
    <div
      role="group"
      aria-label={data?.label}
      data-slot="azuos-card-surface"
      data-selected={flags.isSelected ? 'true' : undefined}
      className={surfaceClassOf({ ...flags, className: ui?.className })}
    >
      <CardClickTarget data={data} state={flags} actions={actions} />
      {children}
    </div>
  );
}

/** O clique é um BOTÃO de verdade por cima do card inteiro: alcançável pelo teclado. */
function CardClickTarget({
  data,
  state,
  actions,
}: {
  data: AzuosCardSurfaceProps['data'];
  state: { isSelected: boolean; isDisabled: boolean };
  actions: AzuosCardSurfaceProps['actions'];
}) {
  if (!actions?.onClick) return null;

  return (
    <button
      type="button"
      aria-label={data?.label}
      aria-pressed={state.isSelected}
      disabled={state.isDisabled}
      onClick={actions.onClick}
      className="rounded-surface focus-visible:ring-ring absolute inset-0 z-10 cursor-pointer focus-visible:ring-2 focus-visible:outline-none disabled:cursor-default"
    />
  );
}
