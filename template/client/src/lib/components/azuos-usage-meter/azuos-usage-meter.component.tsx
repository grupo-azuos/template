import { cn } from '../../utils/cn.util';
import { formatPercent } from '../../utils/format-number.util';

/**
 * Quanto de uma capacidade já foi consumido — disco, memória, cota, limite de plano.
 *
 * É O CONTRÁRIO da barra de progresso, onde cheio é bom. Aqui cheio é RUIM: 95% de disco é uma
 * máquina que vai parar. Reaproveitar o `AzuosProgressBar` daria verde justamente no pior caso,
 * então esta é uma peça própria — a diferença é de significado, não de aparência.
 */
export type AzuosUsageMeterProps = {
  data: {
    label: string;
    percentage: number;
    /** A leitura em palavras, embaixo da barra: "12,4 GB de 16 GB". */
    detail?: string;
  };
  ui?: { className?: string };
};

export type AzuosUsageTone = 'calm' | 'attention' | 'critical';

const TONE_CLASSES: Record<AzuosUsageTone, string> = {
  calm: 'bg-success',
  attention: 'bg-warning',
  critical: 'bg-destructive',
};

/**
 * Exportada para ter teste próprio: um corte trocado aqui pinta de verde justamente a capacidade
 * que está prestes a estourar, e o defeito só aparece no dia em que ela estoura.
 */
export function usageTone(percentage: number): AzuosUsageTone {
  if (percentage >= 90) return 'critical';
  if (percentage >= 75) return 'attention';

  return 'calm';
}

export function AzuosUsageMeter({ data, ui }: AzuosUsageMeterProps) {
  /* A barra nunca passa da borda nem some para a esquerda, mesmo que a medida venha torta. */
  const percentage = Math.min(100, Math.max(0, data.percentage));
  const tone = usageTone(percentage);

  return (
    <div className={cn('min-w-0', ui?.className)}>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-ink-700 truncate text-xs">{data.label}</span>
        <span className="text-ink-900 shrink-0 text-xs font-medium tabular-nums">
          {formatPercent(percentage)}
        </span>
      </div>

      <div
        className="bg-muted h-1.5 w-full overflow-hidden rounded-full"
        role="progressbar"
        aria-label={data.label}
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn('h-full rounded-full transition-all', TONE_CLASSES[tone])}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {data.detail ? <p className="text-ink-500 mt-1 truncate text-xs">{data.detail}</p> : null}
    </div>
  );
}
