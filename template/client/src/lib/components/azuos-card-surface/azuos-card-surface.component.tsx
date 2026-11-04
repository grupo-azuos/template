import { type LucideIcon } from 'lucide-react';
import { type CSSProperties, type ReactNode } from 'react';

import { useCardWash, WASH_SIZE } from '../../motion/use-card-wash';
import { type AzuosCardTone, cardToneClasses } from '../../utils/card-tone.util';
import { cn } from '../../utils/cn.util';

/**
 * A SUPERFÍCIE de todo card do grupo — o andar de baixo dos quatro formatos (card de painel,
 * filtro pequeno, filtro grande com ícone e card de conteúdo).
 *
 * - Fundo: sempre a superfície da marca (`bg-card`), com a borda neutra. Cor de card entra só como
 *   sotaque, em quem usa esta superfície: bolinha do ícone, número, marca d'água
 *   (`lib/utils/card-tone.util.ts`).
 * - Hover: a mancha do GSAP (`lib/motion/use-card-wash.ts`) entra a partir do mouse. Neutra por
 *   padrão; colorida só quando a tela pede, com `ui.isHoverColored` + `ui.hoverTone`.
 * - Marca d'água: `ui.mark` desenha o ícone grande no canto, no sotaque de `ui.markTone`, como no
 *   hero card. Fica atrás do texto.
 * - Escolhido: o azul claro da marca (`bg-card-selected`) com texto branco. Quem está dentro lê o
 *   estado por `group-data-[selected=true]/card:` para inverter a bolinha do ícone.
 * - Clicável: um botão de verdade cobre o card inteiro, alcançável pelo teclado.
 *
 * Nunca borda colorida, nunca fundo pastel ou cheio no tom.
 */
export type AzuosCardSurfaceProps = {
  data?: { label?: string };
  ui?: {
    className?: string;
    /** O hover pinta a mancha na cor de `hoverTone`. Sem a flag, a mancha é neutra. */
    isHoverColored?: boolean;
    hoverTone?: AzuosCardTone;
    /** O ícone grande no canto, como marca d'água. */
    mark?: LucideIcon;
    markTone?: AzuosCardTone;
  };
  /** `isDisabled`: o botão do card não responde (enquanto carrega, por exemplo). */
  state?: { isSelected?: boolean; isDisabled?: boolean };
  actions?: { onClick?: () => void };
  children: ReactNode;
};

/** A cor da mancha: o sotaque com transparência, ou um véu neutro do texto do tema. */
function washColorOf(ui: AzuosCardSurfaceProps['ui']): string {
  if (ui?.isHoverColored && ui.hoverTone) {
    return `color-mix(in srgb, ${cardToneClasses(ui.hoverTone).color} 16%, transparent)`;
  }

  return 'color-mix(in srgb, var(--foreground) 6%, transparent)';
}

/** A mancha do hover: começa encolhida pelo `transform`, o mesmo que o GSAP anima. */
function washStyleOf(ui: AzuosCardSurfaceProps['ui']): CSSProperties {
  /* A classe `scale-0` do Tailwind usa a propriedade `scale`, que se multiplica ao `transform` e
     prendia a mancha em zero; por isso o encolhido vem aqui, no `transform`. */
  return {
    width: WASH_SIZE,
    height: WASH_SIZE,
    marginLeft: -WASH_SIZE / 2,
    marginTop: -WASH_SIZE / 2,
    backgroundColor: washColorOf(ui),
    transform: 'scale(0)',
  };
}

/** A casca: superfície da marca, ou o azul claro do escolhido; sobe no hover quando é clicável. */
function surfaceClassOf(props: { isSelected: boolean; isClickable: boolean; className?: string }) {
  return cn(
    'group/card rounded-surface shadow-card relative isolate overflow-hidden transition-[box-shadow,transform,background-color] duration-150',
    /* A borda NEUTRA separa o card do fundo da página, que no claro é quase do mesmo branco. */
    props.isSelected
      ? 'bg-card-selected text-on-card-selected border border-transparent'
      : 'bg-card text-card-foreground border-border border',
    props.isClickable && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-xl',
    props.isSelected && props.isClickable && 'hover:bg-card-selected-hover',
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
  const { washRef, handlers } = useCardWash();
  const flags = flagsOf({ state, actions });

  return (
    <div
      role="group"
      aria-label={data?.label}
      data-slot="azuos-card-surface"
      data-selected={flags.isSelected ? 'true' : undefined}
      className={surfaceClassOf({ ...flags, className: ui?.className })}
      {...handlers}
    >
      <span
        ref={washRef}
        aria-hidden="true"
        data-slot="card-wash"
        className="pointer-events-none absolute top-0 left-0 -z-10 rounded-full"
        style={washStyleOf(ui)}
      />
      <CardMark ui={ui} />
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

/** O ícone grande no canto, no sotaque, atrás do texto. Traço fino para não pesar. */
function CardMark({ ui }: { ui: AzuosCardSurfaceProps['ui'] }) {
  const Icon = ui?.mark;
  if (!Icon) return null;

  return (
    <span
      aria-hidden="true"
      data-slot="card-mark"
      className={cn(
        'pointer-events-none absolute -right-5 -bottom-5 -z-10 size-31 transition-transform duration-200 group-hover/card:scale-105 group-data-[selected=true]/card:text-on-card-selected',
        cardToneClasses(ui.markTone).text,
      )}
    >
      <Icon className="block size-full stroke-1" />
    </span>
  );
}
