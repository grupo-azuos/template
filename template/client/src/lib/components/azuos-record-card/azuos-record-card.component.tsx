import { ArrowRight, type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

import { type AzuosCardTone, cardToneClasses } from '../../utils/card-tone.util';
import { cn } from '../../utils/cn.util';
import {
  AzuosActionMenu,
  type AzuosActionMenuItem,
} from '../azuos-action-menu/azuos-action-menu.component';
import { AzuosCardSurface } from '../azuos-card-surface/azuos-card-surface.component';
import { AzuosPersonAvatar } from '../azuos-person-avatar/azuos-person-avatar.component';
import { AzuosTooltip } from '../azuos-tooltip/azuos-tooltip.component';

/**
 * O CARTÃO DE REGISTRO — o card PADRÃO do grupo para todo registro numa grade de cards (empresa,
 * máquina, chamado, produto, sistema), no formato do cartão de empresa do Paralegal.
 *
 * De cima para baixo:
 * - A FAIXA CINZA (`data.status`, `data.tags`, `data.alert`, `stripEnd`): a situação num olhar
 *   (bolinha + texto no tom) à esquerda; à direita o que vem junto (bolinhas cinza com texto) e o
 *   SELO VERMELHO que pisca enquanto houver pendência (`data.alert`).
 * - O CABEÇALHO: o ícone cheio do assunto (`ui.icon` no tom `ui.iconTone`) — ou a foto pequena do
 *   registro (`ui.thumbnailUrl`), ou o que vier em `leading` (o rosto da pessoa) —, o título (corta
 *   em duas linhas), o código em mono (`data.code`, link em nova aba com `data.codeHref`) e a linha
 *   de apoio (`data.meta`). O MENU de três pontinhos (`data.menu`) fica no canto.
 * - `body`: o que o registro tem de próprio logo abaixo do cabeçalho.
 * - OS NÚMEROS (`data.metrics`, ou `metrics`): as caixinhas cinza de número + rótulo. O número fica
 *   na cor do texto; a cor mora na bolinha, e zero apaga a bolinha.
 * - `notes`: a linha de situação. Cresce até o rodapé, para os cards da mesma fileira terem o
 *   rodapé na mesma altura.
 * - O RODAPÉ, separado pelo fio: o ROSTO da pessoa — sempre com a FOTO (regra do grupo; passe o
 *   `id` da pessoa, que o rosto acha a foto no diretório) —, quem/quando (`data.footer`), os botões
 *   próprios (`footerActions`) e a pílula "Abrir" (`data.openLabel`, só desenho: quem abre é o
 *   card inteiro).
 *
 * Com `actions.onOpen`, o card inteiro é o botão que abre o registro (`AzuosCardSurface`). Tudo que
 * tem ação própria (link, botões, menu) sobe acima dele (`z-20`). Ação de linha vai no menu.
 */
export type AzuosRecordCardTag = { label: string; tone?: AzuosCardTone | null };

/** Uma caixinha de número. `isOn: false` apaga a bolinha. `isText`: o valor é uma palavra. */
export type AzuosRecordCardMetric = {
  key: string;
  label: string;
  value: string;
  tone?: AzuosCardTone | null;
  isOn?: boolean;
  isText?: boolean;
};

/** A pessoa do rodapé: com o `id`, o rosto acha a foto no diretório mesmo sem `avatarUrl`. */
export type AzuosRecordCardPerson = { id?: string | null; name: string; avatarUrl?: string | null };

export type AzuosRecordCardProps = {
  data: {
    /** O nome acessível do card (o botão que abre o registro). */
    label: string;
    title: string;
    code?: string | null;
    codeHref?: string | null;
    meta?: string | null;
    status?: { label: string; tone: AzuosCardTone } | null;
    tags?: AzuosRecordCardTag[];
    alert?: { count: number; message: string } | null;
    metrics?: AzuosRecordCardMetric[];
    footer?: {
      title: string;
      subtitle?: string | null;
      person?: AzuosRecordCardPerson | null;
    } | null;
    openLabel?: string | null;
    menu?: { label: string; items: AzuosActionMenuItem[] } | null;
  };
  ui?: {
    icon?: LucideIcon;
    iconTone?: AzuosCardTone;
    /** O que o ícone quer dizer, para quem não vê. Sem ele, o ícone é enfeite. */
    iconLabel?: string;
    thumbnailUrl?: string | null;
    footerIcon?: LucideIcon;
    /** O prefixo dos `data-slot` (`company-card` → `company-card-strip`). */
    slot?: string;
    className?: string;
    stripEnd?: ReactNode;
    leading?: ReactNode;
    body?: ReactNode;
    metrics?: ReactNode;
    notes?: ReactNode;
    footerActions?: ReactNode;
  };
  state?: { isMenuDisabled?: boolean };
  actions?: { onOpen?: () => void; onMenuSelect?: (id: string) => void };
};

const METRIC_COLUMNS = ['grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4'] as const;
const ALERT_FILL = 'bg-destructive-fill text-on-dark';

/** As colunas da fileira de números: uma por número, até quatro. */
export function metricColumnsOf(count: number): string {
  return METRIC_COLUMNS[Math.min(Math.max(count, 1), 4) - 1] ?? 'grid-cols-1';
}

/** O selo corta em 99: o número inteiro está no balão. */
export function alertCountLabel(count: number): string {
  return count > 99 ? '99+' : String(count);
}

export function AzuosRecordCard({ data, ui, state, actions }: AzuosRecordCardProps) {
  const slot = ui?.slot ?? 'record-card';

  return (
    <AzuosCardSurface
      data={{ label: data.label }}
      ui={{ className: cn('flex flex-col text-left', ui?.className) }}
      actions={actions?.onOpen ? { onClick: actions.onOpen } : undefined}
    >
      <RecordCardStrip data={data} ui={ui} slot={slot} />
      <RecordCardHeader data={data} ui={ui} state={state} actions={actions} />
      {ui?.body ? <div className="flex min-w-0 flex-col gap-2 px-4 pt-3">{ui.body}</div> : null}
      <RecordCardMetrics data={data} ui={ui} slot={slot} />
      {/* A situação cresce até o rodapé: os cartões da mesma linha têm a mesma altura. */}
      {ui?.notes ? (
        <div className="flex min-w-0 flex-1 flex-col px-4 pt-3">{ui.notes}</div>
      ) : (
        <div aria-hidden="true" className="flex-1" />
      )}
      <RecordCardFooter data={data} ui={ui} actions={actions} slot={slot} />
    </AzuosCardSurface>
  );
}

type PartProps = Pick<AzuosRecordCardProps, 'data' | 'ui' | 'state' | 'actions'> & {
  slot?: string;
};

function hasStrip(data: AzuosRecordCardProps['data'], ui: AzuosRecordCardProps['ui']): boolean {
  return Boolean(data.status || data.tags?.length || pendingAlertOf(data) || ui?.stripEnd);
}

function pendingAlertOf(data: AzuosRecordCardProps['data']) {
  return data.alert && data.alert.count > 0 ? data.alert : null;
}

function RecordCardStrip({ data, ui, slot }: PartProps) {
  if (!hasStrip(data, ui)) return null;
  const alert = pendingAlertOf(data);

  return (
    <div
      data-slot={`${slot}-strip`}
      className="bg-muted flex items-center justify-between gap-2 px-4 py-1.5 text-xs font-semibold"
    >
      <RecordCardStatus status={data.status ?? null} />
      <span className="text-muted-foreground flex min-w-0 items-center gap-2">
        {(data.tags ?? []).map((tag) => (
          <RecordCardTag key={tag.label} tag={tag} />
        ))}
        {ui?.stripEnd}
        {alert ? <RecordCardAlert alert={alert} slot={slot} /> : null}
      </span>
    </div>
  );
}

function RecordCardStatus({ status }: { status: { label: string; tone: AzuosCardTone } | null }) {
  if (!status) return <span />;

  const tone = cardToneClasses(status.tone);
  return (
    <span className={cn('flex min-w-0 items-center gap-1.5', tone.text)}>
      <span aria-hidden="true" className={cn('size-1.5 shrink-0 rounded-full', tone.swatch)} />
      <span className="truncate">{status.label}</span>
    </span>
  );
}

function RecordCardTag({ tag }: { tag: AzuosRecordCardTag }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <span
        aria-hidden="true"
        className={cn(
          'size-1.5 shrink-0 rounded-full',
          tag.tone ? cardToneClasses(tag.tone).swatch : 'bg-border',
        )}
      />
      <span className="truncate">{tag.label}</span>
    </span>
  );
}

function RecordCardAlert({
  alert,
  slot,
}: {
  alert: { count: number; message: string };
  slot?: string;
}) {
  /* Acima da camada clicável do card, para o balão do selo abrir no mouse. */
  return (
    <AzuosTooltip data={{ content: alert.message }}>
      <span
        role="img"
        aria-label={alert.message}
        data-slot={`${slot}-alert`}
        className="relative z-20 flex size-5 shrink-0"
      >
        <span
          aria-hidden="true"
          className={cn(
            'absolute inline-flex size-full rounded-full motion-safe:animate-ping',
            ALERT_FILL,
          )}
        />
        <span
          aria-hidden="true"
          className={cn(
            'relative inline-flex size-5 items-center justify-center rounded-full text-xs font-bold tabular-nums',
            ALERT_FILL,
          )}
        >
          {alertCountLabel(alert.count)}
        </span>
      </span>
    </AzuosTooltip>
  );
}

function RecordCardLeading({ data, ui, slot }: PartProps) {
  if (ui?.leading) return ui.leading;
  if (!ui?.thumbnailUrl) return <RecordCardIcon ui={ui} />;

  return (
    <img
      src={ui.thumbnailUrl}
      alt={`Foto de ${data.title}`}
      loading="lazy"
      data-slot={`${slot}-thumbnail`}
      className="rounded-icon bg-muted size-12 shrink-0 object-cover shadow-xs"
    />
  );
}

function RecordCardIcon({ ui }: Pick<AzuosRecordCardProps, 'ui'>) {
  const Icon = ui?.icon;
  if (!Icon) return null;
  const label = ui?.iconLabel;

  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        'rounded-icon inline-flex size-9 shrink-0 items-center justify-center shadow-xs',
        cardToneClasses(ui?.iconTone).dot,
      )}
    >
      <Icon aria-hidden="true" className="block size-4.5 shrink-0 stroke-[1.8]" />
    </span>
  );
}

function RecordCardHeader({ data, ui, state, actions }: PartProps) {
  const menu = data.menu && data.menu.items.length > 0 ? data.menu : null;

  return (
    <div className="flex items-start gap-3 px-4 pt-3">
      <RecordCardLeading data={data} ui={ui} slot={ui?.slot ?? 'record-card'} />
      <div className="flex min-w-0 flex-1 flex-col">
        <h3
          className="line-clamp-2 text-sm leading-tight font-semibold break-words"
          title={data.title}
        >
          {data.title}
        </h3>
        <RecordCardCode data={data} />
        {data.meta ? (
          <span className="text-muted-foreground truncate text-xs" title={data.meta}>
            {data.meta}
          </span>
        ) : null}
      </div>
      {/* O menu de três pontinhos mora no canto do cabeçalho, acima do botão do card. */}
      {menu ? (
        <span className="relative z-20 -mt-1 -mr-2 shrink-0">
          <AzuosActionMenu
            data={menu}
            ui={{ isIconOnly: true }}
            state={{ isDisabled: state?.isMenuDisabled }}
            actions={{ onSelect: (id) => actions?.onMenuSelect?.(id) }}
          />
        </span>
      ) : null}
    </div>
  );
}

function RecordCardCode({ data }: Pick<AzuosRecordCardProps, 'data'>) {
  if (!data.code) return null;
  if (!data.codeHref)
    return (
      <span className="text-muted-foreground mt-0.5 truncate font-mono text-xs">{data.code}</span>
    );

  return (
    <a
      href={data.codeHref}
      target="_blank"
      rel="noopener noreferrer"
      className="text-muted-foreground hover:text-foreground relative z-20 mt-0.5 truncate font-mono text-xs hover:underline"
    >
      {data.code}
    </a>
  );
}

function RecordCardMetrics({ data, ui, slot }: PartProps) {
  if (ui?.metrics) return <div className="px-4 pt-3">{ui.metrics}</div>;
  const cells = data.metrics ?? [];
  if (cells.length === 0) return null;

  return (
    <div className={cn('grid gap-1.5 px-4 pt-3', metricColumnsOf(cells.length))}>
      {cells.map((cell) => (
        <span
          key={cell.key}
          data-slot={`${slot}-${cell.key}`}
          className="rounded-control bg-muted flex min-w-0 flex-col items-center py-1.5"
        >
          {cell.isText ? (
            /* A palavra quebra em até duas linhas (com hífen) em vez de virar "Infraestr…". */
            <span className="flex min-h-8 max-w-full items-center px-1" title={cell.value}>
              <span className="text-foreground line-clamp-2 text-center text-xs leading-tight font-semibold break-words hyphens-auto">
                {cell.value}
              </span>
            </span>
          ) : (
            <span className="text-foreground max-w-full truncate px-1 text-base font-bold tabular-nums">
              {cell.value}
            </span>
          )}
          <span className="text-muted-foreground flex max-w-full items-center gap-1 px-1 text-xs">
            <span
              aria-hidden="true"
              className={cn(
                'size-1.5 shrink-0 rounded-full',
                cell.tone && cell.isOn !== false ? cardToneClasses(cell.tone).swatch : 'bg-border',
              )}
            />
            <span className="truncate">{cell.label}</span>
          </span>
        </span>
      ))}
    </div>
  );
}

function RecordCardFace({ person }: { person: AzuosRecordCardPerson }) {
  /* O rosto acha a foto no diretório pelo id (ou pelo nome); as iniciais só sem foto nenhuma. */
  return (
    <AzuosPersonAvatar
      name={person.name}
      avatarUrl={person.avatarUrl}
      personId={person.id}
      ui={{ size: 'sm' }}
    />
  );
}

function showsOpenPill(
  data: AzuosRecordCardProps['data'],
  actions: AzuosRecordCardProps['actions'],
): boolean {
  return Boolean(data.openLabel && actions?.onOpen);
}

function hasFooter(
  data: AzuosRecordCardProps['data'],
  ui: AzuosRecordCardProps['ui'],
  showsPill: boolean,
) {
  return Boolean(data.footer || ui?.footerActions || showsPill);
}

function RecordCardFooter({ data, ui, actions, slot }: PartProps) {
  const showsPill = showsOpenPill(data, actions);
  if (!hasFooter(data, ui, showsPill)) return null;

  const footer = data.footer ?? null;
  const person = footer?.person ?? null;
  const icon = ui?.footerIcon;

  return (
    <div
      data-slot={`${slot}-footer`}
      className="border-border mt-3 flex items-center gap-2.5 border-t px-4 py-3"
    >
      {/* Sem ícone, o rosto abre o rodapé; com ícone, o rosto fica depois do texto. */}
      <RecordCardFooterLead icon={icon} person={person} />
      <RecordCardFooterText footer={footer} />
      {icon && person ? <RecordCardFace person={person} /> : null}
      <RecordCardFooterEnd
        actions={ui?.footerActions}
        pillLabel={showsPill ? data.openLabel : null}
      />
    </div>
  );
}

function RecordCardFooterLead({
  icon: Icon,
  person,
}: {
  icon?: LucideIcon;
  person: AzuosRecordCardPerson | null;
}) {
  if (Icon) return <Icon aria-hidden="true" className="text-muted-foreground size-4 shrink-0" />;
  if (!person) return null;

  return <RecordCardFace person={person} />;
}

function RecordCardFooterEnd({
  actions,
  pillLabel,
}: {
  actions?: ReactNode;
  pillLabel?: string | null;
}) {
  return (
    <>
      {actions ? (
        <span className="relative z-20 flex shrink-0 items-center gap-1.5">{actions}</span>
      ) : null}
      {pillLabel ? <RecordCardPill label={pillLabel} /> : null}
    </>
  );
}

function RecordCardFooterText({
  footer,
}: {
  footer: NonNullable<AzuosRecordCardProps['data']['footer']> | null;
}) {
  if (!footer) return <span className="flex min-w-0 flex-1 flex-col" />;

  return (
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="truncate text-xs font-semibold" title={footer.title}>
        {footer.title}
      </span>
      {/* Quebra em vez de cortar: no cartão estreito a data perdia o ano. */}
      {footer.subtitle ? (
        <span className="text-muted-foreground text-xs leading-tight break-words">
          {footer.subtitle}
        </span>
      ) : null}
    </span>
  );
}

/** Só desenho: quem abre o registro é o card inteiro, que já é o botão. */
function RecordCardPill({ label }: { label: string }) {
  return (
    <span
      aria-hidden="true"
      className="control-sm rounded-button bg-muted text-muted-foreground group-hover/card:bg-foreground group-hover/card:text-background inline-flex shrink-0 items-center gap-1 px-2.5 text-xs font-medium transition-colors"
    >
      {label}
      <ArrowRight className="size-3.5" />
    </span>
  );
}
