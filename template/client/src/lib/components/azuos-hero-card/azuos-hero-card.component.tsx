import type { LucideIcon } from 'lucide-react';
import type { MouseEvent, ReactNode } from 'react';

import { cn } from '../../utils/cn.util';

export type AzuosHeroCardTone = 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

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

const TONE_STYLES: Record<
  AzuosHeroCardTone,
  {
    container: string;
    title: string;
    description: string;
    badgeBg: string;
    badgeText: string;
    iconColor: string;
  }
> = {
  brand: {
    container: 'bg-primary text-primary-foreground',
    title: 'text-primary-foreground',
    description: 'text-primary-soft',
    badgeBg: 'bg-accent-hero',
    badgeText: 'text-accent-hero-foreground',
    iconColor: 'text-primary-strong',
  },
  accent: {
    container: 'bg-accent-hero text-accent-hero-foreground',
    title: 'text-accent-hero-foreground',
    description: 'text-ink-700',
    badgeBg: 'bg-ink-900',
    badgeText: 'text-primary-foreground',
    iconColor: 'text-accent-strong',
  },
  success: {
    container: 'bg-success text-primary-foreground',
    title: 'text-primary-foreground',
    description: 'text-success-soft',
    badgeBg: 'bg-accent-hero',
    badgeText: 'text-accent-hero-foreground',
    iconColor: 'text-primary-strong',
  },
  warning: {
    container: 'bg-warning text-primary-foreground',
    title: 'text-primary-foreground',
    description: 'text-warning-soft',
    badgeBg: 'bg-ink-900',
    badgeText: 'text-primary-foreground',
    iconColor: 'text-ink-900',
  },
  danger: {
    container: 'bg-destructive text-destructive-foreground',
    title: 'text-destructive-foreground',
    description: 'text-destructive-soft',
    badgeBg: 'bg-accent-hero',
    badgeText: 'text-accent-hero-foreground',
    iconColor: 'text-ink-900',
  },
  info: {
    container: 'bg-info text-primary-foreground',
    title: 'text-primary-foreground',
    description: 'text-info-soft',
    badgeBg: 'bg-accent-hero',
    badgeText: 'text-accent-hero-foreground',
    iconColor: 'text-primary-strong',
  },
  neutral: {
    container: 'bg-card text-card-foreground border border-border',
    title: 'text-card-foreground',
    description: 'text-muted-foreground',
    badgeBg: 'bg-muted',
    badgeText: 'text-foreground',
    iconColor: 'text-muted',
  },
};

function HeroCardInner({
  data,
  styles,
  children,
}: {
  data: AzuosHeroCardProps['data'];
  styles: (typeof TONE_STYLES)[AzuosHeroCardTone];
  children?: ReactNode;
}) {
  const Icon = data.icon;

  return (
    <>
      <div
        className={cn(
          'pointer-events-none absolute -bottom-4 -right-4 size-32 select-none overflow-hidden transition-transform duration-300 group-hover:scale-105',
          styles.iconColor,
        )}
        aria-hidden="true"
      >
        <Icon className="size-full stroke-[1.4]" />
      </div>

      <div className="relative z-10 flex flex-col gap-1.5 pr-14 text-left">
        <h3 className={cn('text-lg font-bold tracking-tight leading-snug', styles.title)}>
          {data.title}
        </h3>
        {data.description ? (
          <p className={cn('text-xs font-medium leading-relaxed', styles.description)}>
            {data.description}
          </p>
        ) : null}
      </div>

      <div className="relative z-10 mt-4 flex items-center gap-2">
        {data.badge ? (
          <span
            className={cn(
              'inline-flex items-center rounded-chip px-2.5 py-1 text-xs font-bold shadow-xs',
              styles.badgeBg,
              styles.badgeText,
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
  const styles = TONE_STYLES[tone] ?? TONE_STYLES.brand;

  const containerClassName = cn(
    'relative flex min-h-[148px] w-full flex-col justify-between overflow-hidden rounded-surface p-5 shadow-card transition-transform hover:-translate-y-0.5',
    styles.container,
    ui?.className,
  );

  const inner = <HeroCardInner data={data} styles={styles}>{ui?.children}</HeroCardInner>;

  if (data.to) {
    return (
      <a
        href={data.to}
        className={cn('group block no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-surface', containerClassName)}
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
        className={cn('group block text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-surface', containerClassName)}
        data-slot="azuos-hero-card"
      >
        {inner}
      </button>
    );
  }

  return (
    <div
      role="article"
      className={containerClassName}
      data-slot="azuos-hero-card"
    >
      {inner}
    </div>
  );
}
