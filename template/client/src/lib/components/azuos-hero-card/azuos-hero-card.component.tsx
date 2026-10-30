import type { LucideIcon } from 'lucide-react';
import type { MouseEvent, ReactNode } from 'react';

import { cn } from '../../utils/cn.util';
import {
  AzuosStatCard,
  type AzuosStatCardTone,
} from '../azuos-stat-card/azuos-stat-card.component';
import {
  AzuosZuzu,
  type AzuosZuzuPose,
} from '../azuos-zuzu/azuos-zuzu.component';

export type AzuosHeroCardTone = 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type AzuosHeroCardVariant = 'default' | 'zuzu' | 'dashboard';

export type AzuosHeroCardZuzuData = {
  pose?: AzuosZuzuPose;
  size?: number;
};

export type AzuosHeroCardStat = {
  label: string;
  value: string | number;
  hint?: string | null;
  tone?: AzuosStatCardTone;
  icon?: LucideIcon;
  onClick?: () => void;
};

/**
 * CARTÃO DE DESTAQUE SÓLIDO (HERO CARD) DO GRUPO AZUOS.
 *
 * Suporta dois formatos de alto impacto:
 * 1. Padrão (`default`): Cartão compacto com marca d'água de ícone ou mascote Zuzu.
 * 2. Painel (`dashboard`): Painel executivo com o mascote Zuzu grande à esquerda (sem molduras
 *    ou bolas), mensagem principal à direita e grade de indicadores/cards ou componentes abaixo.
 */
export type AzuosHeroCardProps = {
  data: {
    title: string;
    description?: string;
    eyebrow?: string;
    eyebrowIcon?: LucideIcon;
    timestamp?: string;
    badge?: string;
    icon?: LucideIcon;
    to?: string;
    zuzu?: AzuosHeroCardZuzuData;
    stats?: AzuosHeroCardStat[];
  };
  ui?: {
    tone?: AzuosHeroCardTone;
    variant?: AzuosHeroCardVariant;
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
    iconColor: 'text-primary-foreground',
  },
  accent: {
    container: 'bg-accent-hero text-accent-hero-foreground',
    title: 'text-accent-hero-foreground',
    description: 'text-ink-700',
    badgeBg: 'bg-ink-900',
    badgeText: 'text-primary-foreground',
    iconColor: 'text-accent-hero-foreground',
  },
  success: {
    container: 'bg-success text-primary-foreground',
    title: 'text-primary-foreground',
    description: 'text-success-soft',
    badgeBg: 'bg-accent-hero',
    badgeText: 'text-accent-hero-foreground',
    iconColor: 'text-primary-foreground',
  },
  warning: {
    container: 'bg-warning text-primary-foreground',
    title: 'text-primary-foreground',
    description: 'text-warning-soft',
    badgeBg: 'bg-ink-900',
    badgeText: 'text-primary-foreground',
    iconColor: 'text-primary-foreground',
  },
  danger: {
    container: 'bg-destructive text-destructive-foreground',
    title: 'text-destructive-foreground',
    description: 'text-destructive-soft',
    badgeBg: 'bg-accent-hero',
    badgeText: 'text-accent-hero-foreground',
    iconColor: 'text-destructive-foreground',
  },
  info: {
    container: 'bg-info text-primary-foreground',
    title: 'text-primary-foreground',
    description: 'text-info-soft',
    badgeBg: 'bg-accent-hero',
    badgeText: 'text-accent-hero-foreground',
    iconColor: 'text-primary-foreground',
  },
  neutral: {
    container: 'bg-card text-card-foreground border border-border',
    title: 'text-card-foreground',
    description: 'text-muted-foreground',
    badgeBg: 'bg-muted',
    badgeText: 'text-foreground',
    iconColor: 'text-muted-foreground',
  },
};

function getCardToneStyles(tone?: AzuosHeroCardTone) {
  return (tone && TONE_STYLES[tone]) || TONE_STYLES.brand;
}

function DefaultIllustration({
  data,
  isZuzu,
  iconColor,
}: {
  data: AzuosHeroCardProps['data'];
  isZuzu: boolean;
  iconColor: string;
}) {
  if (isZuzu) {
    return (
      <div
        data-slot="hero-card-zuzu"
        className="pointer-events-none absolute -bottom-1 -right-1 sm:right-2 select-none overflow-visible"
        aria-hidden="true"
      >
        <AzuosZuzu
          data={{
            pose: data.zuzu?.pose ?? 'thumbsup',
          }}
          ui={{
            size: data.zuzu?.size ?? 108,
          }}
        />
      </div>
    );
  }

  const Icon = data.icon;
  if (!Icon) return null;

  return (
    <div
      data-slot="hero-card-icon"
      className={cn(
        'pointer-events-none absolute -bottom-5 -right-5 size-36 select-none overflow-hidden opacity-15 transition-transform duration-300 group-hover:scale-105 group-hover:opacity-25',
        iconColor,
      )}
      aria-hidden="true"
    >
      <Icon className="size-full stroke-[1.2]" />
    </div>
  );
}

function DefaultHeroInner({
  data,
  styles,
  variant,
  children,
}: {
  data: AzuosHeroCardProps['data'];
  styles: (typeof TONE_STYLES)[AzuosHeroCardTone];
  variant?: AzuosHeroCardVariant;
  children?: ReactNode;
}) {
  const isZuzu = variant === 'zuzu' || Boolean(data.zuzu);

  return (
    <>
      <DefaultIllustration data={data} isZuzu={isZuzu} iconColor={styles.iconColor} />

      <div
        className={cn(
          'relative z-10 flex flex-col gap-1.5 text-left',
          isZuzu ? 'pr-24 sm:pr-28' : 'pr-14',
        )}
      >
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

function DashboardHeader({
  eyebrow,
  timestamp,
  Icon,
  styles,
}: {
  eyebrow?: string;
  timestamp?: string;
  Icon?: LucideIcon;
  styles: (typeof TONE_STYLES)[AzuosHeroCardTone];
}) {
  if (!eyebrow && !timestamp) return null;

  return (
    <div className="border-border flex flex-wrap items-center gap-2 border-b pb-3.5 text-xs font-bold uppercase tracking-wider">
      {Icon ? <Icon size={18} className="text-accent-hero shrink-0" aria-hidden="true" /> : null}
      {eyebrow ? <span className={styles.title}>{eyebrow}</span> : null}
      {timestamp ? (
        <span className="text-muted-foreground font-normal tracking-normal normal-case">
          — {timestamp}
        </span>
      ) : null}
    </div>
  );
}

function DashboardStatsGrid({ stats }: { stats: AzuosHeroCardStat[] }) {
  if (stats.length === 0) return null;

  return (
    <div className="border-border mt-6 border-t pt-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, idx) => (
          <AzuosStatCard
            key={idx}
            data={{
              label: stat.label,
              value: stat.value,
              hint: stat.hint,
            }}
            ui={{
              tone: stat.tone ?? 'neutral',
              icon: stat.icon,
            }}
            actions={stat.onClick ? { onClick: stat.onClick } : undefined}
          />
        ))}
      </div>
    </div>
  );
}

function DashboardHeroInner({
  data,
  styles,
  children,
}: {
  data: AzuosHeroCardProps['data'];
  styles: (typeof TONE_STYLES)[AzuosHeroCardTone];
  children?: ReactNode;
}) {
  const zuzuPose = data.zuzu?.pose ?? 'alert';
  const zuzuSize = data.zuzu?.size ?? 128;

  return (
    <>
      <DashboardHeader
        eyebrow={data.eyebrow}
        timestamp={data.timestamp}
        Icon={data.eyebrowIcon}
        styles={styles}
      />

      <div className="flex flex-col items-center gap-5 pt-3 sm:flex-row sm:items-start sm:gap-6">
        <div data-slot="hero-card-zuzu" className="shrink-0 select-none" aria-hidden="true">
          <AzuosZuzu data={{ pose: zuzuPose }} ui={{ size: zuzuSize }} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 text-center sm:text-left">
          <h2 className={cn('text-xl font-bold tracking-tight leading-snug sm:text-2xl', styles.title)}>
            {data.title}
          </h2>
          {data.description ? (
            <p className={cn('text-sm font-normal leading-relaxed sm:text-base', styles.description)}>
              {data.description}
            </p>
          ) : null}
          {data.badge ? (
            <div className="mt-1 flex items-center justify-center sm:justify-start">
              <span
                className={cn(
                  'inline-flex items-center rounded-chip px-2.5 py-1 text-xs font-bold shadow-xs',
                  styles.badgeBg,
                  styles.badgeText,
                )}
              >
                {data.badge}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {data.stats ? <DashboardStatsGrid stats={data.stats} /> : null}

      {children ? <div className="mt-6 border-border border-t pt-5">{children}</div> : null}
    </>
  );
}

function renderHeroCardInner(
  data: AzuosHeroCardProps['data'],
  styles: (typeof TONE_STYLES)[AzuosHeroCardTone],
  ui?: AzuosHeroCardProps['ui'],
) {
  if (ui?.variant === 'dashboard') {
    return <DashboardHeroInner data={data} styles={styles}>{ui?.children}</DashboardHeroInner>;
  }
  return <DefaultHeroInner data={data} styles={styles} variant={ui?.variant}>{ui?.children}</DefaultHeroInner>;
}

function getCardContainerClassName(
  styles: (typeof TONE_STYLES)[AzuosHeroCardTone],
  variant?: AzuosHeroCardVariant,
  customClassName?: string,
) {
  const isDashboard = variant === 'dashboard';
  return cn(
    'rounded-surface shadow-card relative flex w-full flex-col justify-between overflow-hidden',
    isDashboard ? 'p-6 sm:p-7' : 'min-h-[148px] p-5 transition-transform hover:-translate-y-0.5',
    styles.container,
    customClassName,
  );
}

export function AzuosHeroCard({ data, ui, actions }: AzuosHeroCardProps) {
  const styles = getCardToneStyles(ui?.tone);
  const containerClassName = getCardContainerClassName(styles, ui?.variant, ui?.className);
  const inner = renderHeroCardInner(data, styles, ui);

  if (data.to) {
    return (
      <a
        href={data.to}
        className={cn(
          'rounded-surface group block no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
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
          'rounded-surface group block cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          containerClassName,
        )}
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
