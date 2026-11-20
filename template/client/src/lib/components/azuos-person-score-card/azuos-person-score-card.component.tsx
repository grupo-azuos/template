import { ArrowRight, type LucideIcon } from 'lucide-react';

import { cn } from '../../utils/cn.util';
import { AzuosCardSurface } from '../azuos-card-surface/azuos-card-surface.component';
import { AzuosPersonAvatar } from '../azuos-person-avatar/azuos-person-avatar.component';

/**
 * O CARD DE UMA PESSOA COM PLACAR: o rosto, o anel de uma porcentagem e as contagens que pedem
 * ação, em selos. É a carteira de alguém num relance — "quem está bem, quem precisa de ajuda".
 *
 * - A foto vem do admin-console (`avatarUrl`); sem ela, as iniciais. Para a linha que não é uma
 *   pessoa ("Sem responsável"), `ui.placeholderIcon` troca o rosto por um ícone.
 * - O anel é verde a partir de `good`, amarelo a partir de `fair` e vermelho abaixo — a mesma
 *   régua de `personScoreTone`, para o resumo da equipe pintar igual.
 * - Selo com contagem fica no vermelho; zerado fica neutro, para o olho cair no que pede ação.
 * - Com `actions.onOpen` o card inteiro é o botão, e `data.actionLabel` aparece embaixo.
 */
export type AzuosPersonScoreMetric = {
  key: string;
  label: string;
  count: number;
  icon: LucideIcon;
};

export type AzuosPersonScoreThresholds = { good: number; fair: number };

export type AzuosPersonScoreCardProps = {
  data: {
    name: string;
    avatarUrl?: string | null;
    /** A linha embaixo do nome ("342 alvarás ativos"). */
    subtitle?: string;
    /** A porcentagem do anel, de 0 a 100. */
    score: number;
    /** O que o anel mede, lido pelo leitor de tela antes do número ("Saúde 93%"). */
    scoreLabel?: string;
    metrics: AzuosPersonScoreMetric[];
    /** O convite embaixo do card clicável ("Ver alvarás"). */
    actionLabel?: string;
  };
  ui?: {
    placeholderIcon?: LucideIcon;
    thresholds?: AzuosPersonScoreThresholds;
    className?: string;
  };
  actions?: { onOpen?: () => void };
};

export type AzuosPersonScoreTone = 'success' | 'warning' | 'danger';

const DEFAULT_THRESHOLDS: AzuosPersonScoreThresholds = { good: 95, fair: 85 };

/** A faixa de uma porcentagem: verde, amarelo ou vermelho. */
export function personScoreTone(
  score: number,
  thresholds: AzuosPersonScoreThresholds = DEFAULT_THRESHOLDS,
): AzuosPersonScoreTone {
  if (score >= thresholds.good) return 'success';
  if (score >= thresholds.fair) return 'warning';

  return 'danger';
}

/* O traço do anel usa o amarelo do grupo; o número, o `-ink` — amarelo puro como texto some. */
const RING_STROKE: Record<AzuosPersonScoreTone, string> = {
  success: 'stroke-success',
  warning: 'stroke-warning',
  danger: 'stroke-destructive',
};

const RING_TEXT: Record<AzuosPersonScoreTone, string> = {
  success: 'text-success',
  warning: 'text-warning-ink',
  danger: 'text-destructive',
};

export function AzuosPersonScoreCard({ data, ui, actions }: AzuosPersonScoreCardProps) {
  const onOpen = actions?.onOpen;

  return (
    <AzuosCardSurface
      data={{ label: onOpen ? `${data.actionLabel ?? 'Abrir'}: ${data.name}` : data.name }}
      ui={{ className: cn('flex h-full flex-col gap-4 rounded-surface p-5', ui?.className) }}
      actions={onOpen ? { onClick: onOpen } : undefined}
    >
      <PersonHeader data={data} ui={ui} />
      {data.metrics.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Pendências">
          {data.metrics.map((metric) => (
            <MetricChip key={metric.key} data={{ metric }} />
          ))}
        </ul>
      ) : null}
      {onOpen && data.actionLabel ? (
        <span className="mt-auto flex items-center gap-1 text-sm font-semibold text-primary">
          {data.actionLabel}
          <ArrowRight className="size-4" aria-hidden="true" />
        </span>
      ) : null}
    </AzuosCardSurface>
  );
}

/** O rosto, o nome com a linha de baixo e o anel — a primeira linha do card. */
function PersonHeader({ data, ui }: Pick<AzuosPersonScoreCardProps, 'data' | 'ui'>) {
  return (
    <div className="flex items-center gap-3">
      <PersonFace data={data} ui={ui} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-foreground">{data.name}</p>
        {data.subtitle ? (
          <p className="truncate text-sm text-muted-foreground">{data.subtitle}</p>
        ) : null}
      </div>
      <ScoreRing
        data={{ score: data.score, label: data.scoreLabel }}
        ui={{ thresholds: ui?.thresholds }}
      />
    </div>
  );
}

function PersonFace({ data, ui }: Pick<AzuosPersonScoreCardProps, 'data' | 'ui'>) {
  const Placeholder = ui?.placeholderIcon;
  if (!Placeholder) {
    return <AzuosPersonAvatar name={data.name} avatarUrl={data.avatarUrl} ui={{ size: 'lg' }} />;
  }

  return (
    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <Placeholder className="size-6" aria-hidden="true" />
    </span>
  );
}

function ScoreRing({
  data,
  ui,
}: {
  data: { score: number; label?: string };
  ui: { thresholds?: AzuosPersonScoreThresholds };
}) {
  const radius = 22;
  const length = 2 * Math.PI * radius;
  const score = Math.round(Math.max(0, Math.min(100, data.score)));
  const tone = personScoreTone(score, ui.thresholds);

  return (
    <span
      role="img"
      className="relative flex size-14 shrink-0 items-center justify-center"
      aria-label={data.label ? `${data.label} ${score}%` : `${score}%`}
    >
      <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="28" cy="28" r={radius} className="stroke-muted" strokeWidth="6" fill="none" />
        <circle
          cx="28"
          cy="28"
          r={radius}
          className={RING_STROKE[tone]}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={length}
          strokeDashoffset={length * (1 - score / 100)}
        />
      </svg>
      <span className={cn('text-xs font-bold tabular-nums', RING_TEXT[tone])}>{score}%</span>
    </span>
  );
}

function MetricChip({ data }: { data: { metric: AzuosPersonScoreMetric } }) {
  const { metric } = data;
  const Icon = metric.icon;
  const hasWork = metric.count > 0;

  return (
    <li
      className={cn(
        'flex items-center gap-1.5 rounded-chip px-2.5 py-1 text-xs font-semibold',
        hasWork ? 'bg-destructive-soft text-foreground' : 'bg-muted text-muted-foreground',
      )}
    >
      <Icon className={cn('size-3.5', hasWork && 'text-destructive')} aria-hidden="true" />
      <span className="tabular-nums">{metric.count}</span>
      {metric.label}
    </li>
  );
}
