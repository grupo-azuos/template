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
import { Skeleton } from '../ui/skeleton';

/**
 * O CARD DE CONTEÚDO — o ÚNICO card do grupo. Todo card é este: o de um registro numa grade
 * (empresa, máquina, chamado, produto, sistema), o de número do painel e o bloco de conteúdo de
 * uma tela. Não existe outro formato.
 *
 * De cima para baixo:
 * - A FAIXA CINZA (`data.status`, `data.tags`, `data.alert`, `ui.stripEnd`): a situação num olhar
 *   (bolinha + texto no tom) à esquerda; à direita o que vem junto (bolinhas cinza com texto) e o
 *   SELO VERMELHO que pisca enquanto houver pendência (`data.alert`).
 * - O CABEÇALHO: o ícone cheio do assunto À ESQUERDA (`ui.icon` no tom `ui.iconTone`) — ou a foto
 *   pequena do registro (`ui.thumbnailUrl`), ou o que vier em `ui.leading` (o rosto da pessoa) —,
 *   o título (corta em duas linhas), o código em mono (`data.code`, link em nova aba com
 *   `data.codeHref`) e a linha de apoio (`data.meta`). No canto, o MENU de três pontinhos
 *   (`data.menu`) ou o controle que muda o recorte do bloco (`ui.tools`).
 * - O NÚMERO GRANDE (`data.highlight`): o card de painel — o número que se lê de relance, com a
 *   ressalva miúda ao lado ("exclui 12 arquivados"). Carregando (`state.isLoading`), o esqueleto.
 * - `ui.body`: o que o card tem de próprio logo abaixo do cabeçalho (o bloco de conteúdo). Sem
 *   `data.title`, não há cabeçalho e o conteúdo ocupa o card inteiro (um bloco que abre e fecha).
 * - OS NÚMEROS (`data.metrics`, ou `ui.metrics`): as caixinhas cinza de número + rótulo. O número
 *   fica na cor do texto; a cor mora na bolinha, e zero apaga a bolinha.
 * - `ui.notes`: a linha de situação. Cresce até o rodapé, para os cards da mesma fileira terem o
 *   rodapé na mesma altura.
 * - O RODAPÉ, separado pelo fio: o ROSTO da pessoa — sempre com a FOTO (regra do grupo; passe o
 *   `id` da pessoa, que o rosto acha a foto no diretório) —, quem/quando (`data.footer`), os botões
 *   próprios (`ui.footerActions`) e a pílula "Abrir" (`data.openLabel`, só desenho: quem abre é o
 *   card inteiro).
 *
 * Com `actions.onOpen`, o card inteiro é o botão que abre o registro — ou liga o filtro, no card
 * de painel (`state.isSelected` pinta o escolhido). Tudo que tem ação própria (link, botões, menu)
 * sobe acima dele (`z-20`). O card NÃO se mexe no hover: nem sobe, nem muda a sombra.
 */
export type AzuosContentCardTag = { label: string; tone?: AzuosCardTone | null };

/** Uma caixinha de número. `isOn: false` apaga a bolinha. `isText`: o valor é uma palavra. */
export type AzuosContentCardMetric = {
  key: string;
  label: string;
  value: string;
  tone?: AzuosCardTone | null;
  isOn?: boolean;
  isText?: boolean;
};

/** A pessoa do rodapé: com o `id`, o rosto acha a foto no diretório mesmo sem `avatarUrl`. */
export type AzuosContentCardPerson = {
  id?: string | null;
  name: string;
  avatarUrl?: string | null;
};

export type AzuosContentCardProps = {
  data: {
    /** O nome acessível do card (o botão que abre o registro). */
    label: string;
    title: string;
    code?: string | null;
    codeHref?: string | null;
    meta?: string | null;
    status?: { label: string; tone: AzuosCardTone } | null;
    tags?: AzuosContentCardTag[];
    alert?: { count: number; message: string } | null;
    metrics?: AzuosContentCardMetric[];
    /** O card de painel: o número grande e a ressalva ao lado dele. */
    highlight?: { value: number | string; hint?: string | null } | null;
    footer?: {
      title: string;
      subtitle?: string | null;
      person?: AzuosContentCardPerson | null;
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
    /** O controle que muda o recorte do bloco (Dia, Semana, Mês), no canto do cabeçalho. */
    tools?: ReactNode;
    /** O conteúdo cresce e ocupa a altura que sobra do card (o gráfico de um bloco do painel). */
    isBodyFilling?: boolean;
    /** Classe extra do cabeçalho (a alça de arrastar do bloco, montando o painel). */
    headerClassName?: string;
  };
  state?: {
    isMenuDisabled?: boolean;
    /** O filtro que este card liga já está valendo (o card de painel clicável). */
    isSelected?: boolean;
    /** O número ainda não chegou: o esqueleto no lugar dele. */
    isLoading?: boolean;
  };
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

export function AzuosContentCard({ data, ui, state, actions }: AzuosContentCardProps) {
  const slot = ui?.slot ?? 'content-card';

  return (
    <AzuosCardSurface
      data={{ label: accessibleNameOf(data, state, actions) }}
      ui={{ className: cn('flex flex-col text-left', ui?.className) }}
      state={{ isSelected: state?.isSelected, isDisabled: state?.isLoading }}
      actions={openActionOf(actions)}
    >
      <ContentCardStrip data={data} ui={ui} slot={slot} />
      <ContentCardHeader data={data} ui={ui} state={state} actions={actions} />
      <ContentCardHighlight data={data} state={state} slot={slot} />
      <ContentCardBody data={data} ui={ui} />
      <ContentCardMetrics data={data} ui={ui} slot={slot} />
      <ContentCardNotes ui={ui} />
      <ContentCardFooter data={data} ui={ui} actions={actions} slot={slot} />
    </AzuosCardSurface>
  );
}

/**
 * O nome lido do card. No card de painel que filtra, o número entra no nome e o nome diz o que o
 * próximo clique faz: "Hoje 2: filtrar a lista", "Hoje 2: tirar o filtro".
 */
export function accessibleNameOf(
  data: AzuosContentCardProps['data'],
  state: AzuosContentCardProps['state'],
  actions: AzuosContentCardProps['actions'],
): string {
  if (!data.highlight || !actions?.onOpen) return data.label;
  const named = `${data.label} ${data.highlight.value}`;

  return state?.isSelected ? `${named}: tirar o filtro` : `${named}: filtrar a lista`;
}

function openActionOf(actions: AzuosContentCardProps['actions']) {
  return actions?.onOpen ? { onClick: actions.onOpen } : undefined;
}

/** A situação cresce até o rodapé: os cartões da mesma linha têm a mesma altura. */
function ContentCardNotes({ ui }: Pick<AzuosContentCardProps, 'ui'>) {
  if (ui?.notes) return <div className="flex min-w-0 flex-1 flex-col px-4 pt-3">{ui.notes}</div>;
  if (ui?.isBodyFilling) return null;

  return <div aria-hidden="true" className="flex-1" />;
}

type PartProps = Pick<AzuosContentCardProps, 'data' | 'ui' | 'state' | 'actions'> & {
  slot?: string;
};

function hasStrip(data: AzuosContentCardProps['data'], ui: AzuosContentCardProps['ui']): boolean {
  return Boolean(data.status || data.tags?.length || pendingAlertOf(data) || ui?.stripEnd);
}

function pendingAlertOf(data: AzuosContentCardProps['data']) {
  return data.alert && data.alert.count > 0 ? data.alert : null;
}

function ContentCardStrip({ data, ui, slot }: PartProps) {
  if (!hasStrip(data, ui)) return null;
  const alert = pendingAlertOf(data);

  return (
    <div
      data-slot={`${slot}-strip`}
      className="flex items-center justify-between gap-2 bg-muted px-4 py-1.5 text-xs font-semibold"
    >
      <ContentCardStatus status={data.status ?? null} />
      <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
        {(data.tags ?? []).map((tag) => (
          <ContentCardTag key={tag.label} tag={tag} />
        ))}
        {ui?.stripEnd}
        {alert ? <ContentCardAlert alert={alert} slot={slot} /> : null}
      </span>
    </div>
  );
}

function ContentCardStatus({ status }: { status: { label: string; tone: AzuosCardTone } | null }) {
  if (!status) return <span />;

  const tone = cardToneClasses(status.tone);
  return (
    <span className={cn('flex min-w-0 items-center gap-1.5', tone.text)}>
      <span aria-hidden="true" className={cn('size-1.5 shrink-0 rounded-full', tone.swatch)} />
      <span className="truncate">{status.label}</span>
    </span>
  );
}

function ContentCardTag({ tag }: { tag: AzuosContentCardTag }) {
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

function ContentCardAlert({
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

function ContentCardLeading({ data, ui, slot }: PartProps) {
  if (ui?.leading) return ui.leading;
  if (!ui?.thumbnailUrl) return <ContentCardIcon ui={ui} />;

  return (
    <img
      src={ui.thumbnailUrl}
      alt={`Foto de ${data.title}`}
      loading="lazy"
      data-slot={`${slot}-thumbnail`}
      className="size-12 shrink-0 rounded-icon bg-muted object-cover shadow-xs"
    />
  );
}

function ContentCardIcon({ ui }: Pick<AzuosContentCardProps, 'ui'>) {
  const Icon = ui?.icon;
  if (!Icon) return null;
  const label = ui?.iconLabel;

  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-icon shadow-xs',
        cardToneClasses(ui?.iconTone).dot,
      )}
    >
      <Icon aria-hidden="true" className="block size-4.5 shrink-0 stroke-[1.8]" />
    </span>
  );
}

function ContentCardHeader({ data, ui, state, actions }: PartProps) {
  /* Sem título, não há cabeçalho: o conteúdo é o card inteiro. */
  if (!data.title) return null;

  return (
    <div
      data-slot={`${ui?.slot ?? 'content-card'}-header`}
      className={cn(
        'flex items-start gap-3 px-4',
        hasStrip(data, ui) ? 'pt-3' : 'pt-4',
        ui?.headerClassName,
      )}
    >
      <ContentCardLeading data={data} ui={ui} slot={ui?.slot ?? 'content-card'} />
      <div className="flex min-w-0 flex-1 flex-col">
        <ContentCardTitle data={data} actions={actions} />
        <ContentCardCode data={data} />
        <ContentCardMeta meta={data.meta} />
      </div>
      {ui?.tools ? <span className="relative z-20 shrink-0">{ui.tools}</span> : null}
      <ContentCardMenu data={data} state={state} actions={actions} />
    </div>
  );
}

/**
 * O título. Cortado, mostra o inteiro no balão do projeto, nunca no `title` do navegador. O balão
 * fica acima do botão do card (`z-20`), e o clique no título abre o registro igual.
 */
function ContentCardTitle({ data, actions }: Pick<PartProps, 'data' | 'actions'>) {
  return (
    <AzuosTooltip data={{ content: data.title }}>
      <h3
        className="relative z-20 line-clamp-2 w-fit text-sm leading-tight font-semibold break-words group-data-[selected=true]/card:text-on-card-selected"
        onClick={actions?.onOpen}
      >
        {data.title}
      </h3>
    </AzuosTooltip>
  );
}

function ContentCardMeta({ meta }: { meta?: string | null }) {
  if (!meta) return null;

  return <span className="truncate text-xs text-muted-foreground">{meta}</span>;
}

/** O menu de três pontinhos mora no canto do cabeçalho, acima do botão do card. */
function ContentCardMenu({ data, state, actions }: Pick<PartProps, 'data' | 'state' | 'actions'>) {
  const menu = data.menu && data.menu.items.length > 0 ? data.menu : null;
  if (!menu) return null;

  return (
    <span className="relative z-20 -mt-1 -mr-2 shrink-0">
      <AzuosActionMenu
        data={menu}
        ui={{ isIconOnly: true }}
        state={{ isDisabled: state?.isMenuDisabled }}
        actions={{ onSelect: (id) => actions?.onMenuSelect?.(id) }}
      />
    </span>
  );
}

/**
 * O conteúdo próprio do card. Com cabeçalho, abaixo dele no respiro do card; sem título, o
 * conteúdo É o card (um bloco que abre e fecha, com o cabeçalho dele mesmo) e ocupa tudo.
 */
function ContentCardBody({ data, ui }: Pick<AzuosContentCardProps, 'data' | 'ui'>) {
  if (!ui?.body) return null;
  const fill = ui.isBodyFilling ? 'min-h-0 flex-1' : '';
  if (!data.title) return <div className={cn('flex min-w-0 flex-col', fill)}>{ui.body}</div>;

  return <div className={cn('flex min-w-0 flex-col gap-2 px-4 pt-3', fill)}>{ui.body}</div>;
}

/** O número do card de painel: grande, na cor do texto, com a ressalva miúda ao lado. */
function ContentCardHighlight({
  data,
  state,
  slot,
}: Pick<AzuosContentCardProps, 'data' | 'state'> & { slot: string }) {
  if (!data.highlight) return null;
  if (state?.isLoading) return <Skeleton className="mx-4 mt-3 h-8 w-20" />;

  return (
    <div
      data-slot={`${slot}-highlight`}
      className="flex flex-wrap items-baseline gap-x-2 px-4 pt-3"
    >
      <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums group-data-[selected=true]/card:text-on-card-selected">
        {data.highlight.value}
      </p>
      {data.highlight.hint ? (
        <p className="text-xs text-muted-foreground group-data-[selected=true]/card:text-on-card-selected">
          {data.highlight.hint}
        </p>
      ) : null}
    </div>
  );
}

function ContentCardCode({ data }: Pick<AzuosContentCardProps, 'data'>) {
  if (!data.code) return null;
  if (!data.codeHref)
    return (
      <span className="mt-0.5 truncate font-mono text-xs text-muted-foreground">{data.code}</span>
    );

  return (
    <a
      href={data.codeHref}
      target="_blank"
      rel="noopener noreferrer"
      className="relative z-20 mt-0.5 truncate font-mono text-xs text-muted-foreground hover:text-foreground hover:underline"
    >
      {data.code}
    </a>
  );
}

function ContentCardMetrics({ data, ui, slot }: PartProps) {
  if (ui?.metrics) return <div className="px-4 pt-3">{ui.metrics}</div>;
  const cells = data.metrics ?? [];
  if (cells.length === 0) return null;

  return (
    <div className={cn('grid gap-1.5 px-4 pt-3', metricColumnsOf(cells.length))}>
      {cells.map((cell) => (
        <span
          key={cell.key}
          data-slot={`${slot}-${cell.key}`}
          className="flex min-w-0 flex-col items-center rounded-control bg-muted py-1.5"
        >
          {cell.isText ? (
            /* A palavra quebra em até duas linhas (com hífen) em vez de virar "Infraestr…". */
            <span className="flex min-h-8 max-w-full items-center px-1">
              <span className="line-clamp-2 text-center text-xs leading-tight font-semibold break-words hyphens-auto text-foreground">
                {cell.value}
              </span>
            </span>
          ) : (
            <span className="max-w-full truncate px-1 text-base font-bold text-foreground tabular-nums">
              {cell.value}
            </span>
          )}
          <span className="flex max-w-full items-center gap-1 px-1 text-xs text-muted-foreground">
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

function ContentCardFace({ person }: { person: AzuosContentCardPerson }) {
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
  data: AzuosContentCardProps['data'],
  actions: AzuosContentCardProps['actions'],
): boolean {
  return Boolean(data.openLabel && actions?.onOpen);
}

function hasFooter(
  data: AzuosContentCardProps['data'],
  ui: AzuosContentCardProps['ui'],
  showsPill: boolean,
) {
  return Boolean(data.footer || ui?.footerActions || showsPill);
}

function ContentCardFooter({ data, ui, actions, slot }: PartProps) {
  const showsPill = showsOpenPill(data, actions);
  if (!hasFooter(data, ui, showsPill)) return <ContentCardBottomSpace data={data} />;

  const footer = data.footer ?? null;
  const person = footer?.person ?? null;
  const icon = ui?.footerIcon;

  return (
    <div
      data-slot={`${slot}-footer`}
      className="mt-3 flex items-center gap-2.5 border-t border-border px-4 py-3"
    >
      {/* Sem ícone, o rosto abre o rodapé; com ícone, o rosto fica depois do texto. */}
      <ContentCardFooterLead icon={icon} person={person} />
      <ContentCardFooterText footer={footer} />
      {icon && person ? <ContentCardFace person={person} /> : null}
      <ContentCardFooterEnd
        actions={ui?.footerActions}
        pillLabel={showsPill ? data.openLabel : null}
      />
    </div>
  );
}

/** Sem rodapé, o respiro de baixo é o mesmo dos lados (sem título, o conteúdo cuida do dele). */
function ContentCardBottomSpace({ data }: Pick<AzuosContentCardProps, 'data'>) {
  if (!data.title) return null;

  return <div aria-hidden="true" className="pb-4" />;
}

function ContentCardFooterLead({
  icon: Icon,
  person,
}: {
  icon?: LucideIcon;
  person: AzuosContentCardPerson | null;
}) {
  if (Icon) return <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />;
  if (!person) return null;

  return <ContentCardFace person={person} />;
}

function ContentCardFooterEnd({
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
      {pillLabel ? <ContentCardPill label={pillLabel} /> : null}
    </>
  );
}

function ContentCardFooterText({
  footer,
}: {
  footer: NonNullable<AzuosContentCardProps['data']['footer']> | null;
}) {
  if (!footer) return <span className="flex min-w-0 flex-1 flex-col" />;

  return (
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="truncate text-xs font-semibold">{footer.title}</span>
      {/* Quebra em vez de cortar: no cartão estreito a data perdia o ano. */}
      {footer.subtitle ? (
        <span className="text-xs leading-tight break-words text-muted-foreground">
          {footer.subtitle}
        </span>
      ) : null}
    </span>
  );
}

/** Só desenho: quem abre o registro é o card inteiro, que já é o botão. */
function ContentCardPill({ label }: { label: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex control-sm shrink-0 items-center gap-1 rounded-button bg-muted px-2.5 text-xs font-medium text-muted-foreground"
    >
      {label}
      <ArrowRight className="size-3.5" />
    </span>
  );
}
