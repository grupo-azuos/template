import type { LucideIcon } from 'lucide-react';
import type { MouseEvent, ReactNode } from 'react';

import { type AzuosCardTone, cardToneClasses } from '../../utils/card-tone.util';
import { cn } from '../../utils/cn.util';

export type AzuosHeroCardTone =
  'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/**
 * CARTÃO DE DESTAQUE SÓLIDO (HERO CARD) DO GRUPO AZUOS.
 *
 * Inspirado em painéis de serviços de alto impacto e clareza visual:
 * - Fundo de cor 100% sólida via tokens semânticos da casa (sem vidro ou gradientes).
 * - Canto gordinho de superfície (`rounded-surface`).
 * - Ícone grande estilizado no fundo à direita funcionando como marca d'água temática.
 * - Título e descrição legíveis com contraste rigoroso em modo claro e escuro.
 * - Selo/badge inferior de indicador ou benefício em contraste nítido.
 */
export type AzuosHeroCardProps = {
  data: {
    title: string;
    description?: string;
    badge?: string;
    icon: LucideIcon;
    to?: string;
  };
  ui?: {
    tone?: AzuosHeroCardTone;
    className?: string;
    children?: ReactNode;
  };
  actions?: {
    onClick?: (event: MouseEvent<HTMLElement>) => void;
  };
};

/**
 * O card fica na superfície da marca; o tom é sotaque (`lib/utils/card-tone.util.ts`): o ícone
 * grande no canto e a pastilha. `accent` usa o âmbar. Sem fundo colorido, sem opacidade.
 */
const TONE_HUE: Record<AzuosHeroCardTone, AzuosCardTone> = {
  brand: 'brand',
  accent: 'amber',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'info',
  neutral: 'neutral',
};

function stylesOf(tone: AzuosHeroCardTone) {
  const classes = cardToneClasses(TONE_HUE[tone] ?? 'brand');

  return {
    container: 'bg-card text-card-foreground hover:shadow-xl',
    title: '',
    description: 'text-muted-foreground',
    badge: classes.dot,
    iconColor: classes.text,
  };
}

function HeroCardInner({
  data,
  styles,
  children,
}: {
  data: AzuosHeroCardProps['data'];
  styles: ReturnType<typeof stylesOf>;
  children?: ReactNode;
}) {
  const Icon = data.icon;

  return (
    <>
      <div
        data-slot="hero-card-icon"
        className={cn(
          'pointer-events-none absolute -right-5 -bottom-5 size-36 overflow-hidden transition-transform duration-300 select-none group-hover:scale-105',
          styles.iconColor,
        )}
        aria-hidden="true"
      >
        <Icon className="size-full stroke-[1.2]" />
      </div>

      <div className="relative z-10 flex flex-col gap-1.5 pr-14 text-left">
        <h3 className={cn('text-lg leading-snug font-bold tracking-tight', styles.title)}>
          {data.title}
        </h3>
        {data.description ? (
          <p className={cn('text-xs leading-relaxed font-medium', styles.description)}>
            {data.description}
          </p>
        ) : null}
      </div>

      <div className="relative z-10 mt-4 flex items-center gap-2">
        {data.badge ? (
          <span
            className={cn(
              'inline-flex items-center rounded-chip px-2.5 py-1 text-xs font-bold shadow-xs',
              styles.badge,
            )}
          >
            {data.badge}
          </span>
        ) : null}
        {children}
      </div>
    </>
  );
}

export function AzuosHeroCard({ data, ui, actions }: AzuosHeroCardProps) {
  const tone = ui?.tone ?? 'brand';
  const styles = stylesOf(tone);

  const containerClassName = cn(
    'relative flex min-h-[148px] w-full flex-col justify-between overflow-hidden rounded-surface p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-xl',
    styles.container,
    ui?.className,
  );

  const inner = (
    <HeroCardInner data={data} styles={styles}>
      {ui?.children}
    </HeroCardInner>
  );

  if (data.to) {
    return (
      <a
        href={data.to}
        className={cn(
          'group block rounded-surface no-underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          containerClassName,
        )}
        data-slot="azuos-hero-card"
        onClick={actions?.onClick}
      >
        {inner}
      </a>
    );
  }

  if (actions?.onClick) {
    return (
      <button
        type="button"
        onClick={actions.onClick}
        className={cn(
          'group block cursor-pointer rounded-surface text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          containerClassName,
        )}
        data-slot="azuos-hero-card"
      >
        {inner}
      </button>
    );
  }

  return (
    <div role="article" className={containerClassName} data-slot="azuos-hero-card">
      {inner}
    </div>
  );
}
