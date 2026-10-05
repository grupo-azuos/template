import { type LucideIcon } from 'lucide-react';

import { cn } from '../../utils/cn.util';
import {
  AzuosAttachmentList,
  type AzuosAttachment,
} from '../azuos-attachment-list/azuos-attachment-list.component';
import { AzuosErrorState } from '../azuos-error-state/azuos-error-state.component';
import {
  AzuosStatusBadge,
  type AzuosStatusBadgeTone,
} from '../azuos-status-badge/azuos-status-badge.component';

/**
 * A LINHA DO TEMPO de um registro: cada acontecimento com quem, quando, o quê e de que tipo.
 *
 * Função pura de props, e sem domínio nenhum: o TIPO do acontecimento chega já com rótulo e tom
 * resolvidos (`kindLabel`, `tone`), decididos pelo domínio em `shared/src/domain`. É o que permite a
 * mesma linha do tempo servir a duas telas — a ficha no painel e uma consulta pública, a mesma
 * história lida por dois públicos.
 *
 * O acontecimento que ENCERRA algo é dito com PALAVRAS, e não só com a cor do selo: cor sozinha some
 * para quem não distingue as cores e some na impressão. É para isso que serve `meta`.
 */
export type AzuosHistoryMeta = { icon: LucideIcon; label: string; isStrong?: boolean };

export type AzuosHistoryEntry = {
  id: number | string;
  /** O tipo do acontecimento, em português: "Comentou", "Encerrou". */
  kindLabel: string;
  tone: AzuosStatusBadgeTone;
  authorName: string;
  /** O instante em ISO. */
  createdAt: string;
  description: string;
  /** As linhas de contexto: estágio, tempo gasto, visibilidade. */
  meta?: AzuosHistoryMeta[];
  attachments?: AzuosAttachment[];
};

export type AzuosHistoryTimelineProps = {
  data: { entries: AzuosHistoryEntry[] };
  ui?: { emptyLabel?: string; className?: string };
  state?: { isLoading?: boolean; error?: string | null };
};

const MINUTES_PER_HOUR = 60;

/**
 * "45 min", "2 h", "1 h 30 min".
 *
 * Exportada para quem monta a linha de contexto: tempo em minutos cru ("150 min") obriga quem lê a
 * fazer a conta de cabeça, e numa lista de vinte acontecimentos ninguém faz vinte contas.
 */
export function formatMinutesSpent(minutes: number): string {
  if (minutes < MINUTES_PER_HOUR) return `${minutes} min`;

  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;

  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

/** "02/10/2026 às 23:30" — sem os segundos, que ninguém lê numa linha do tempo. */
export function formatHistoryDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const day = date.toLocaleDateString('pt-BR');
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return `${day} às ${time}`;
}

/** A bolinha da linha, na cor do tipo — a mesma do selo ao lado. */
const DOT_TONE_CLASSES: Record<AzuosStatusBadgeTone, string> = {
  neutral: 'bg-muted-foreground',
  info: 'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-destructive',
  brand: 'bg-primary',
};

/** O halo em volta do marco: a mesma cor, quase transparente — destaca sem pesar. */
const HALO_TONE_CLASSES: Record<AzuosStatusBadgeTone, string> = {
  neutral: 'ring-muted-foreground/15',
  info: 'ring-info/20',
  success: 'ring-success/20',
  warning: 'ring-warning/20',
  danger: 'ring-destructive/20',
  brand: 'ring-primary/20',
};

export function AzuosHistoryTimeline({ data, ui, state }: AzuosHistoryTimelineProps) {
  /* Estados na frente, conteúdo por último e sem aninhamento. */
  if (state?.error) {
    return <AzuosErrorState data={{ message: state.error }} ui={{ variant: 'inline' }} />;
  }

  if (state?.isLoading) {
    return <p className="text-muted-foreground text-sm">Carregando a linha do tempo…</p>;
  }

  if (data.entries.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        {ui?.emptyLabel ?? 'Nenhum histórico registrado ainda.'}
      </p>
    );
  }

  return (
    <ol className={cn('flex flex-col', ui?.className)}>
      {data.entries.map((entry, index) => (
        <HistoryRow
          key={entry.id}
          data={{ entry }}
          ui={{ isFirst: index === 0, isLast: index === data.entries.length - 1 }}
        />
      ))}
    </ol>
  );
}

function HistoryRow({
  data,
  ui,
}: {
  data: { entry: AzuosHistoryEntry };
  ui: { isFirst: boolean; isLast: boolean };
}) {
  const { entry } = data;

  return (
    <li className="flex gap-4">
      {/* O TRILHO: um traço contínuo de cima a baixo, com o marco de cada acontecimento no meio. O
          pedaço de cima some no primeiro e o de baixo no último — a linha começa e termina num marco,
          e não solta no ar. O marco fica na altura do cabeçalho ao lado. */}
      <div className="flex w-3 shrink-0 flex-col items-center" aria-hidden="true">
        <span className={cn('h-0.5 w-px', ui.isFirst ? 'bg-transparent' : 'bg-border')} />
        <span
          className={cn(
            'my-1 size-3 shrink-0 rounded-full ring-4',
            DOT_TONE_CLASSES[entry.tone],
            HALO_TONE_CLASSES[entry.tone],
          )}
        />
        {ui.isLast ? null : <span className="bg-border w-px flex-1" />}
      </div>

      <div className={cn('flex min-w-0 flex-1 flex-col gap-2', ui.isLast ? 'pb-0' : 'pb-6')}>
        {/* Tipo e autor à esquerda, a hora à direita: três tamanhos de letra na mesma fileira só
            alinham se a fileira tiver altura fixa e cada um se centrar nela. */}
        <div className="flex min-h-6 flex-wrap items-center gap-x-2.5 gap-y-1">
          <AzuosStatusBadge
            data={{ label: entry.kindLabel }}
            ui={{ tone: entry.tone, size: 'sm' }}
          />
          <span className="text-foreground min-w-0 truncate text-sm leading-6 font-medium">
            {entry.authorName}
          </span>
          <time
            className="text-muted-foreground ml-auto text-xs leading-6 tabular-nums"
            dateTime={entry.createdAt}
          >
            {formatHistoryDateTime(entry.createdAt)}
          </time>
        </div>

        {entry.meta && entry.meta.length > 0 ? (
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            {entry.meta.map((meta) => {
              const Icon = meta.icon;

              return (
                <span
                  key={meta.label}
                  className={cn(
                    'inline-flex items-center gap-1',
                    meta.isStrong && 'text-foreground font-semibold',
                  )}
                >
                  <Icon className="size-3" aria-hidden="true" />
                  {meta.label}
                </span>
              );
            })}
          </div>
        ) : null}

        <p className="rounded-box border-border/70 bg-muted/20 text-foreground/90 border px-3.5 py-2.5 text-sm whitespace-pre-line">
          {entry.description}
        </p>

        {entry.attachments && entry.attachments.length > 0 ? (
          <AzuosAttachmentList data={{ attachments: entry.attachments }} />
        ) : null}
      </div>
    </li>
  );
}
