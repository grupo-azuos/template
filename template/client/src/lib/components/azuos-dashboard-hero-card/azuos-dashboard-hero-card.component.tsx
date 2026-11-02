import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { type AzuosCardTone, cardToneClasses } from '../../utils/card-tone.util';
import { cn } from '../../utils/cn.util';
import { AzuosZuzu, type AzuosZuzuPose } from '../azuos-zuzu/azuos-zuzu.component';

/** O nome de estado (`danger`, `info`…) ou o matiz direto (`violet`, `pink`…) da paleta de card. */
export type AzuosDashboardHeroCardStatTone = AzuosCardTone;

export type AzuosDashboardHeroCardStat = {
  label: string;
  value: string | number;
  hint?: string;
  tone?: AzuosDashboardHeroCardStatTone;
  icon?: LucideIcon;
  onClick?: () => void;
  /**
   * O cartão escolhido, quando os cartões trocam o que a tela mostra (uma fila, um filtro). Fica
   * com o pastel médio do matiz e a bolinha do ícone invertida — a cor vem do FUNDO, nunca de uma
   * borda. Com `onClick`, vira `aria-pressed`, para o leitor de tela dizer qual está ligado.
   */
  isActive?: boolean;
};

export type AzuosDashboardHeroCardProps = {
  data: {
    title: string;
    /**
     * O trecho do título que importa ("47 alvarás vencidos"), pintado na cor de destaque do hero. É
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

/*
 * A cor de cada cartão vem da paleta única de card (`lib/utils/card-tone.util.ts`): pastel do
 * matiz parado, mais CLARO e com sombra no hover, pastel médio quando escolhido. Igual nos dois
 * temas, sem opacidade e sem cor cheia. A bolinha do ícone é o pastel médio; no escolhido, inverte.
 */
function resolveStatStyles(stat: AzuosDashboardHeroCardStat) {
  const tone = cardToneClasses(stat.tone ?? 'default');
  if (stat.isActive) return { surface: cn(tone.selected, 'shadow-xl'), icon: tone.chipSelected };
  if (!stat.onClick) return { surface: tone.surface, icon: tone.chip };

  return {
    surface: cn(tone.surface, tone.hover, 'hover:-translate-y-0.5 hover:shadow-xl'),
    icon: tone.chip,
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

      {stat.hint ? <span className="mt-1 block text-xs font-medium">{stat.hint}</span> : null}
    </>
  );

  /* Cartões coloridos nunca usam borda no padrão Azuos: a cor vem do fundo sólido. */
  const containerClass = cn('rounded-surface p-4 text-left transition-all', styles.surface);

  if (stat.onClick) {
    /* O clique se anuncia pelo cursor e pelo hover mais claro, que sobe e ganha sombra. */
    return (
      <button
        type="button"
        onClick={stat.onClick}
        aria-pressed={stat.isActive === undefined ? undefined : stat.isActive}
        className={cn(containerClass, 'cursor-pointer')}
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
      {Icon ? <Icon size={18} className="text-hero-accent shrink-0" aria-hidden="true" /> : null}
      {eyebrow ? <span>{eyebrow}</span> : null}
      {timestamp ? (
        <span className="text-hero-muted font-normal tracking-normal normal-case">
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
      <span className="text-hero-accent">{data.highlight}</span>
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
        <h2 className="text-xl leading-snug font-bold tracking-tight sm:text-2xl">
          <HighlightedTitle data={{ text: data.title, highlight: data.titleHighlight }} />
        </h2>
        {data.description ? (
          <p className="text-hero-muted text-sm leading-relaxed font-normal sm:text-base">
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
        'rounded-surface shadow-card bg-hero-surface text-hero-foreground relative flex w-full flex-col gap-6 overflow-hidden p-6 sm:p-7',
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
