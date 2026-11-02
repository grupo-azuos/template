import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '../../utils/cn.util';
import { AzuosZuzu, type AzuosZuzuPose } from '../azuos-zuzu/azuos-zuzu.component';

export type AzuosDashboardHeroCardStatTone =
  'default' | 'danger' | 'warning' | 'info' | 'success' | 'brand';

export type AzuosDashboardHeroCardStat = {
  label: string;
  value: string | number;
  hint?: string;
  tone?: AzuosDashboardHeroCardStatTone;
  icon?: LucideIcon;
  onClick?: () => void;
  /**
   * O cartão escolhido, quando os cartões trocam o que a tela mostra (uma fila, um filtro). Fica
   * com o fundo mais fechado e o rótulo e o ícone no amarelo de destaque — a cor vem do FUNDO,
   * nunca de uma borda. Com `onClick`, vira `aria-pressed`, para o leitor de tela dizer qual está
   * ligado.
   */
  isActive?: boolean;
};

export type AzuosDashboardHeroCardProps = {
  data: {
    title: string;
    description?: string;
    eyebrow?: string;
    eyebrowIcon?: LucideIcon;
    timestamp?: string;
    badge?: string;
    zuzu?: {
      pose?: AzuosZuzuPose;
      size?: number;
    };
    stats?: AzuosDashboardHeroCardStat[];
  };
  ui?: {
    className?: string;
    children?: ReactNode;
  };
  actions?: {
    onRefresh?: () => void;
  };
};

const STAT_TONE_STYLES: Record<
  AzuosDashboardHeroCardStatTone,
  {
    value: string;
    icon: string;
    label: string;
  }
> = {
  default: {
    value: 'text-on-dark',
    icon: 'text-on-dark/80',
    label: 'text-on-dark/80',
  },
  danger: {
    value: 'text-on-dark',
    icon: 'text-on-dark/80',
    label: 'text-on-dark/80',
  },
  warning: {
    value: 'text-accent-hero',
    icon: 'text-accent-hero',
    label: 'text-accent-hero',
  },
  info: {
    value: 'text-on-dark',
    icon: 'text-on-dark/80',
    label: 'text-on-dark/80',
  },
  success: {
    value: 'text-on-dark',
    icon: 'text-on-dark/80',
    label: 'text-on-dark/80',
  },
  brand: {
    value: 'text-on-dark',
    icon: 'text-on-dark/80',
    label: 'text-on-dark',
  },
};

/** O escolhido troca rótulo e ícone pelo amarelo de destaque; o valor segue o tom. */
const ACTIVE_STYLES = { icon: 'text-accent-hero', label: 'text-accent-hero' } as const;

function resolveStatStyles(stat: AzuosDashboardHeroCardStat) {
  const styles = STAT_TONE_STYLES[stat.tone ?? 'default'] ?? STAT_TONE_STYLES.default;
  if (!stat.isActive) return styles;

  return { ...styles, ...ACTIVE_STYLES };
}

function StatPill({ stat }: { stat: AzuosDashboardHeroCardStat }) {
  const styles = resolveStatStyles(stat);
  const Icon = stat.icon;

  const content = (
    <>
      <div className="flex items-center gap-3">
        {Icon ? (
          <span
            className={cn(
              'rounded-chip bg-brand-blue-900 inline-flex size-10 shrink-0 items-center justify-center',
              styles.icon,
            )}
          >
            <Icon size={22} className="block size-5.5 shrink-0 stroke-[1.8]" aria-hidden="true" />
          </span>
        ) : null}
        <span
          className={cn('text-xs leading-none font-bold tracking-wider uppercase', styles.label)}
        >
          {stat.label}
        </span>
      </div>

      <strong className={cn('mt-2.5 block text-3xl font-bold tabular-nums', styles.value)}>
        {stat.value}
      </strong>

      {stat.hint ? <span className="text-on-dark/80 mt-1 block text-xs">{stat.hint}</span> : null}
    </>
  );

  /* Cartões coloridos nunca usam borda no padrão Azuos: a cor vem do fundo sólido. O escolhido
     tem o fundo mais fechado, e o texto continua o claro de sempre — legível em qualquer estado. */
  const containerClass = cn(
    'rounded-surface p-4 text-left transition-colors',
    stat.isActive ? 'bg-brand-blue-900' : 'bg-brand-blue-800',
  );

  if (stat.onClick) {
    return (
      <button
        type="button"
        onClick={stat.onClick}
        aria-pressed={stat.isActive === undefined ? undefined : stat.isActive}
        className={cn(
          containerClass,
          'cursor-pointer',
          stat.isActive ? 'hover:bg-brand-blue-900' : 'hover:bg-brand-blue-700',
        )}
      >
        {content}
      </button>
    );
  }

  return <div className={containerClass}>{content}</div>;
}

function DashboardEyebrowHeader({
  eyebrow,
  timestamp,
  Icon,
}: {
  eyebrow?: string;
  timestamp?: string;
  Icon?: LucideIcon;
}) {
  if (!eyebrow && !timestamp) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-bold tracking-wider uppercase">
      {Icon ? <Icon size={18} className="text-accent-hero shrink-0" aria-hidden="true" /> : null}
      {eyebrow ? <span className="text-on-dark">{eyebrow}</span> : null}
      {timestamp ? (
        <span className="text-on-dark/80 font-normal tracking-normal normal-case">
          — {timestamp}
        </span>
      ) : null}
    </div>
  );
}

function DashboardHeroBody({ data }: { data: AzuosDashboardHeroCardProps['data'] }) {
  const zuzuPose = data.zuzu?.pose ?? 'alert';
  const zuzuSize = data.zuzu?.size ?? 128;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-6">
      <div data-slot="dashboard-zuzu" className="shrink-0 select-none" aria-hidden="true">
        <AzuosZuzu data={{ pose: zuzuPose }} ui={{ size: zuzuSize }} />
      </div>

      <div className="flex min-h-[120px] min-w-0 flex-1 flex-col justify-center gap-2 text-center sm:text-left">
        <h2 className="text-on-dark text-xl leading-snug font-bold tracking-tight sm:text-2xl">
          {data.title}
        </h2>
        {data.description ? (
          <p className="text-on-dark/80 text-sm leading-relaxed font-normal sm:text-base">
            {data.description}
          </p>
        ) : null}
        {data.badge ? (
          <div className="mt-1 flex items-center justify-center sm:justify-start">
            <span className="bg-accent-hero text-accent-hero-foreground rounded-chip inline-flex items-center px-2.5 py-1 text-xs font-bold shadow-xs">
              {data.badge}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DashboardStatsGrid({ stats }: { stats?: AzuosDashboardHeroCardStat[] }) {
  if (!stats || stats.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat, index) => (
        <StatPill key={`${stat.label}-${index}`} stat={stat} />
      ))}
    </div>
  );
}

export function AzuosDashboardHeroCard({ data, ui }: AzuosDashboardHeroCardProps) {
  return (
    <div
      role="region"
      aria-label={data.eyebrow ?? data.title}
      data-slot="azuos-dashboard-hero-card"
      className={cn(
        'rounded-surface shadow-card bg-brand-blue-900 text-on-dark relative flex w-full flex-col gap-6 overflow-hidden p-6 sm:p-7',
        ui?.className,
      )}
    >
      <DashboardEyebrowHeader
        eyebrow={data.eyebrow}
        timestamp={data.timestamp}
        Icon={data.eyebrowIcon}
      />

      <DashboardHeroBody data={data} />

      <DashboardStatsGrid stats={data.stats} />

      {ui?.children ? <div>{ui.children}</div> : null}
    </div>
  );
}
