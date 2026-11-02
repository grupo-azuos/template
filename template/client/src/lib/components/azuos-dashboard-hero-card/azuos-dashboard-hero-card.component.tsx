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
   * com o fundo na cor cheia do tom — a cor vem do FUNDO, nunca de uma borda. Com `onClick`, vira
   * `aria-pressed`, para o leitor de tela dizer qual está ligado.
   */
  isActive?: boolean;
};

export type AzuosDashboardHeroCardProps = {
  data: {
    title: string;
    /**
     * O trecho do título que importa ("47 alvarás vencidos"), pintado no amarelo de destaque. É
     * TEXTO, comparado como texto — nunca HTML montado: a frase pode trazer nome digitado por
     * alguém, e nome não pode virar marcação. Se o trecho não estiver no título, nada muda.
     */
    titleHighlight?: string | null;
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

type StatToneStyle = {
  /** Fundo sólido do cartão parado, com o texto no tom (como o `AzuosStatCard` da tela Empresas). */
  surface: string;
  /** O escolhido: o fundo na cor CHEIA do tom, com o texto de contraste dela nos dois temas. */
  active: string;
  icon: string;
  activeIcon: string;
  hint: string;
  activeHint: string;
  /**
   * O hover de um cartão clicável: a cor CHEIA do tom, a mesma do escolhido. O ícone e a dica
   * acompanham pelo `group-hover`, senão a pastilha do ícone sumia no fundo da mesma cor. Classes
   * inteiras escritas aqui, e não montadas, para o Tailwind encontrá-las.
   */
  hoverSurface: string;
  hoverIcon: string;
  hoverHint: string;
};

/*
 * A cor de cada cartão vem do FUNDO — nunca de borda. Parado, o cartão é o `*-soft` do tom com o
 * texto no tom. Escolhido, ou sob o mouse quando é clicável, vai para o PREENCHIMENTO cheio
 * (`*-fill`) com texto branco (`on-dark`): os `*-fill` são os mesmos nos dois temas e passam de
 * 4,5:1 com o branco. O tom de texto (`bg-destructive`…) não serve de fundo: no escuro ele clareia
 * e pedia texto preto (`lib/theme/tokens.css`).
 */
const STAT_TONE_STYLES: Record<AzuosDashboardHeroCardStatTone, StatToneStyle> = {
  default: {
    surface: 'bg-muted text-foreground',
    active: 'bg-foreground text-background',
    icon: 'bg-foreground text-background',
    activeIcon: 'bg-background text-foreground',
    hint: 'text-foreground/70',
    activeHint: 'text-background',
    hoverSurface: 'hover:bg-foreground hover:text-background',
    hoverIcon: 'group-hover/stat:bg-background group-hover/stat:text-foreground',
    hoverHint: 'group-hover/stat:text-background',
  },
  danger: {
    surface: 'bg-destructive-soft text-destructive',
    active: 'bg-destructive-fill text-on-dark',
    icon: 'bg-destructive-fill text-on-dark',
    activeIcon: 'bg-destructive-fill text-on-dark',
    hint: 'text-foreground/70',
    activeHint: 'text-on-dark',
    hoverSurface: 'hover:bg-destructive-fill hover:text-on-dark',
    hoverIcon: '',
    hoverHint: 'group-hover/stat:text-on-dark',
  },
  warning: {
    surface: 'bg-warning-soft text-warning',
    active: 'bg-warning-fill text-on-dark',
    icon: 'bg-warning-fill text-on-dark',
    activeIcon: 'bg-warning-fill text-on-dark',
    hint: 'text-foreground/70',
    activeHint: 'text-on-dark',
    hoverSurface: 'hover:bg-warning-fill hover:text-on-dark',
    hoverIcon: '',
    hoverHint: 'group-hover/stat:text-on-dark',
  },
  info: {
    surface: 'bg-info-soft text-info',
    active: 'bg-info-fill text-on-dark',
    icon: 'bg-info-fill text-on-dark',
    activeIcon: 'bg-info-fill text-on-dark',
    hint: 'text-foreground/70',
    activeHint: 'text-on-dark',
    hoverSurface: 'hover:bg-info-fill hover:text-on-dark',
    hoverIcon: '',
    hoverHint: 'group-hover/stat:text-on-dark',
  },
  success: {
    surface: 'bg-success-soft text-success',
    active: 'bg-success-fill text-on-dark',
    icon: 'bg-success-fill text-on-dark',
    activeIcon: 'bg-success-fill text-on-dark',
    hint: 'text-foreground/70',
    activeHint: 'text-on-dark',
    hoverSurface: 'hover:bg-success-fill hover:text-on-dark',
    hoverIcon: '',
    hoverHint: 'group-hover/stat:text-on-dark',
  },
  /* O azul da marca já é escuro: o escolhido desce ao 900, e o hover sobe um degrau (o 600). */
  brand: {
    surface: 'bg-brand-blue-800 text-on-dark',
    active: 'bg-brand-blue-900 text-on-dark',
    icon: 'bg-brand-blue-900 text-accent-hero',
    activeIcon: 'bg-brand-blue-800 text-accent-hero',
    hint: 'text-on-dark/80',
    activeHint: 'text-on-dark',
    hoverSurface: 'hover:bg-brand-blue-600',
    hoverIcon: '',
    hoverHint: 'group-hover/stat:text-on-dark',
  },
};

function resolveStatStyles(stat: AzuosDashboardHeroCardStat) {
  const tone = STAT_TONE_STYLES[stat.tone ?? 'default'] ?? STAT_TONE_STYLES.default;
  if (stat.isActive) return { surface: tone.active, icon: tone.activeIcon, hint: tone.activeHint };
  if (!stat.onClick) return { surface: tone.surface, icon: tone.icon, hint: tone.hint };

  /* Clicável e não escolhido: o hover pinta o cartão na cor cheia do tom. */
  return {
    surface: cn(tone.surface, tone.hoverSurface),
    icon: cn(tone.icon, tone.hoverIcon),
    hint: cn(tone.hint, tone.hoverHint),
  };
}

function StatPill({ stat }: { stat: AzuosDashboardHeroCardStat }) {
  const styles = resolveStatStyles(stat);
  const Icon = stat.icon;

  /* Rótulo e valor herdam a cor do cartão (`text-current`): o tom vem de um lugar só. */
  const content = (
    <>
      <div className="flex items-center gap-3">
        {Icon ? (
          <span
            className={cn(
              'rounded-chip inline-flex size-10 shrink-0 items-center justify-center',
              styles.icon,
            )}
          >
            <Icon size={22} className="block size-5.5 shrink-0 stroke-[1.8]" aria-hidden="true" />
          </span>
        ) : null}
        <span className="text-xs leading-none font-bold tracking-wider uppercase">
          {stat.label}
        </span>
      </div>

      <strong className="mt-2.5 block text-3xl font-bold tabular-nums">{stat.value}</strong>

      {stat.hint ? (
        <span className={cn('mt-1 block text-xs', styles.hint)}>{stat.hint}</span>
      ) : null}
    </>
  );

  /* Cartões coloridos nunca usam borda no padrão Azuos: a cor vem do fundo sólido. */
  const containerClass = cn('rounded-surface p-4 text-left transition-colors', styles.surface);

  if (stat.onClick) {
    /* O clique se anuncia pelo cursor e pelo hover na cor CHEIA do tom — a mesma do escolhido,
       com o texto de contraste dela (`*-foreground`), sem opacidade solta. */
    return (
      <button
        type="button"
        onClick={stat.onClick}
        aria-pressed={stat.isActive === undefined ? undefined : stat.isActive}
        className={cn(containerClass, 'group/stat cursor-pointer')}
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

function HighlightedTitle({ data }: { data: { text: string; highlight?: string | null } }) {
  const at = data.highlight ? data.text.indexOf(data.highlight) : -1;
  if (!data.highlight || at < 0) return <>{data.text}</>;

  return (
    <>
      {data.text.slice(0, at)}
      <span className="text-accent-hero">{data.highlight}</span>
      {data.text.slice(at + data.highlight.length)}
    </>
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
          <HighlightedTitle data={{ text: data.title, highlight: data.titleHighlight }} />
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
