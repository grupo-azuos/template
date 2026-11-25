import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { type AzuosCardTone } from '../../../../lib/utils/card-tone.util';
import { AzuosContentCard } from '../../../../lib/components/azuos-content-card/azuos-content-card.component';
import { cn } from '../../../../lib/utils/cn.util';
import {
  AzuosZuzu,
  type AzuosZuzuPose,
} from '../../../../lib/components/azuos-zuzu/azuos-zuzu.component';

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

/** Cada indicador do destaque é o card de conteúdo de painel: o número grande, e clicável vira
    filtro (o escolhido fica no azul claro da marca). */
function StatPill({ stat }: { stat: AzuosDashboardHeroCardStat }) {
  return (
    <AzuosContentCard
      data={{
        label: stat.label,
        title: stat.label,
        highlight: { value: stat.value, hint: stat.hint },
      }}
      ui={{ icon: stat.icon, iconTone: stat.tone }}
      state={{ isSelected: stat.isActive }}
      actions={stat.onClick ? { onOpen: stat.onClick } : undefined}
    />
  );
}

function HighlightedTitle({ data }: { data: { text: string; highlight?: string | null } }) {
  const at = data.highlight ? data.text.indexOf(data.highlight) : -1;
  if (!data.highlight || at < 0) return <>{data.text}</>;

  return (
    <>
      {data.text.slice(0, at)}
      <span className="text-primary">{data.highlight}</span>
      {data.text.slice(at + data.highlight.length)}
    </>
  );
}

/** O que o Zuzu fala: a frase do dia (com o trecho que importa em destaque) e a explicação. */
function HeroMessage({ data }: { data: AzuosDashboardHeroCardProps['data'] }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <h2 className="text-foreground text-xl leading-snug font-bold tracking-tight">
        <HighlightedTitle data={{ text: data.title, highlight: data.titleHighlight }} />
      </h2>
      {data.description ? (
        <p className="text-muted-foreground text-sm leading-relaxed">{data.description}</p>
      ) : null}
      {data.badge ? (
        <span className="rounded-chip bg-muted text-foreground w-fit px-2.5 py-1 text-xs font-semibold">
          {data.badge}
        </span>
      ) : null}
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

/**
 * O DESTAQUE DO PAINEL — o Zuzu falando o alerta do dia, no card de conteúdo (o único card do
 * grupo): o Zuzu no lugar do ícone, a frase no corpo, e os números do dia em cards de painel
 * LOGO ABAIXO (nunca dentro: card não vai dentro de card).
 */
export function AzuosDashboardHeroCard({ data, ui }: AzuosDashboardHeroCardProps) {
  const name = data.eyebrow ?? data.title;

  return (
    <div
      role="region"
      aria-label={name}
      data-slot="azuos-dashboard-hero-card"
      className={cn('flex w-full flex-col gap-3', ui?.className)}
    >
      <AzuosContentCard
        data={{ label: name, title: data.eyebrow ?? 'Alerta do dia', meta: data.timestamp ?? null }}
        ui={{ leading: <HeroZuzu zuzu={data.zuzu} />, body: <HeroMessage data={data} /> }}
      />
      <DashboardStatsGrid stats={data.stats} />
      {ui?.children ? <div>{ui.children}</div> : null}
    </div>
  );
}

/** O Zuzu no lugar do ícone: estático, sem moldura, no tamanho que cabe no cabeçalho. */
function HeroZuzu({ zuzu }: { zuzu: AzuosDashboardHeroCardProps['data']['zuzu'] }) {
  return (
    <span data-slot="dashboard-zuzu" aria-hidden="true" className="shrink-0 select-none">
      <AzuosZuzu
        data={{ pose: zuzu?.pose ?? 'alert' }}
        ui={{ size: Math.min(zuzu?.size ?? 72, 72) }}
      />
    </span>
  );
}
