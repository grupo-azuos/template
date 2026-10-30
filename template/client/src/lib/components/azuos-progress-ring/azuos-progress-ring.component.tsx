import { cn } from '../../utils/cn.util';

/**
 * O andamento GERAL num anel, com o percentual no meio — é o número que a pessoa procura
 * primeiro ao bater o olho num card ("quanto já chegou?"). As barras por departamento ficam
 * para o detalhe.
 *
 * As cores seguem as faixas da `AzuosProgressBar` (vermelho, laranja, amarelo, verde), para o
 * mesmo percentual ter a mesma cor nos dois lugares. Concluído é verde cheio.
 *
 * Nada a cumprir não é 0% vermelho: o anel fica cinza e diz "—".
 */
export type AzuosProgressRingProps = {
  data: { done: number; total: number };
  ui?: { size?: 'md' | 'lg'; className?: string };
};

const SIZES = { md: 52, lg: 64 } as const;
const STROKE = 6;

type RingTone = 'success' | 'warning' | 'alert' | 'danger' | 'empty';

const TONE_CLASSES: Record<RingTone, string> = {
  success: 'stroke-success',
  warning: 'stroke-warning',
  alert: 'stroke-chart-5',
  danger: 'stroke-destructive',
  empty: 'stroke-transparent',
};

function ringTone(total: number, percentage: number): RingTone {
  if (total === 0) return 'empty';
  if (percentage >= 100) return 'success';
  if (percentage >= 70) return 'warning';
  if (percentage >= 40) return 'alert';

  return 'danger';
}

export function AzuosProgressRing({ data, ui }: AzuosProgressRingProps) {
  const size = SIZES[ui?.size ?? 'md'];
  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = data.total === 0 ? 0 : Math.round((data.done / data.total) * 100);
  const clamped = Math.min(100, Math.max(0, percentage));

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Entregue: ${data.done} de ${data.total} itens`}
      className={cn('relative inline-flex shrink-0 items-center justify-center', ui?.className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-ink-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          className={cn(
            'transition-[stroke-dashoffset]',
            TONE_CLASSES[ringTone(data.total, clamped)],
          )}
        />
      </svg>
      <span className="text-ink-900 absolute text-xs font-bold tabular-nums">
        {data.total === 0 ? '—' : `${clamped}%`}
      </span>
    </div>
  );
}
