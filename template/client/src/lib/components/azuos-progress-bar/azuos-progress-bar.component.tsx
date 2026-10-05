import { cn } from '../../utils/cn.util';

/**
 * Quanto já foi feito, numa barra e num número.
 *
 * O número ao lado não é redundante: barra sozinha se lê "mais ou menos a metade", e quem decide
 * precisa saber se são 7 de 14 ou 7 de 15. `role="progressbar"` com os três valores é o que dá a
 * mesma informação a quem usa leitor de tela.
 */
export type AzuosProgressBarProps = {
  data: { percentage: number; done: number; total: number };
  ui?: {
    showCount?: boolean;
    /** O que está sendo contado, no plural, para o leitor de tela: "tarefas", "etapas". */
    itemLabel?: string;
    /** O texto quando não há nada a cumprir. */
    emptyLabel?: string;
    className?: string;
  };
};

type ProgressTone = 'done' | 'close' | 'halfway' | 'behind';

/* As cores de categoria dos gráficos (`lib/theme/tokens.css`), e não um verde fixo da paleta crua:
   assim a barra acompanha a troca de tema e combina com o gráfico ao lado dela no painel. */
const TONE_CLASSES: Record<ProgressTone, string> = {
  done: 'bg-chart-2',
  close: 'bg-chart-3',
  halfway: 'bg-chart-5',
  behind: 'bg-chart-4',
};

/** Cada faixa tem um tom, e é por ele que a lista é lida de relance. */
export function progressTone(percentage: number): ProgressTone {
  if (percentage >= 100) return 'done';
  if (percentage >= 70) return 'close';
  if (percentage >= 40) return 'halfway';

  return 'behind';
}

export function AzuosProgressBar({ data, ui }: AzuosProgressBarProps) {
  /* Nada a cumprir não é 0% — é outra coisa. Uma barra vazia e vermelha num item sem etapas se lê
     como atraso, e manda alguém correr atrás de trabalho que não existe. */
  if (data.total === 0) {
    return (
      <span className={cn('text-ink-500 text-xs', ui?.className)}>
        {ui?.emptyLabel ?? 'Nada a cumprir'}
      </span>
    );
  }

  /* A barra nunca passa da borda nem some para a esquerda, mesmo que a medida venha torta. */
  const percentage = Math.min(100, Math.max(0, data.percentage));
  const tone = progressTone(percentage);

  return (
    <div className={cn('flex items-center gap-2', ui?.className)}>
      <div
        className="bg-ink-100 h-2 w-full overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Concluído: ${data.done} de ${data.total} ${ui?.itemLabel ?? 'itens'}`}
      >
        <div
          className={cn('h-full rounded-full transition-[width]', TONE_CLASSES[tone])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-ink-700 w-14 shrink-0 text-right text-xs tabular-nums">
        {ui?.showCount ? `${data.done}/${data.total}` : `${percentage}%`}
      </span>
    </div>
  );
}
