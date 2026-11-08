import { CheckCheck, Maximize2, Search } from 'lucide-react';

import {
  NOTIFICATION_SEVERITIES,
  NOTIFICATION_TOPIC_KEYS,
  NOTIFICATION_TOPICS,
  type NotificationSeverity,
  type NotificationTopic,
} from '@template/shared/schemas/notification.schema';

import { AzuosActionButton } from '../../../../lib/components/azuos-action-button/azuos-action-button.component';
import { AzuosClearFiltersButton } from '../../../../lib/components/azuos-clear-filters-button/azuos-clear-filters-button.component';
import { AzuosDateRangeField } from '../../../../lib/components/azuos-date-range-field/azuos-date-range-field.component';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../../lib/components/azuos-dialog/azuos-dialog';
import { AzuosEmptyState } from '../../../../lib/components/azuos-empty-state/azuos-empty-state.component';
import { AzuosFilterField } from '../../../../lib/components/azuos-filter-field/azuos-filter-field.component';
import { Input } from '../../../../lib/components/azuos-input/azuos-input';
import { AzuosNotificationCard } from '../../../../lib/components/azuos-notification-card/azuos-notification-card.component';
import { AzuosPaginationBar } from '../../../../lib/components/azuos-pagination-bar/azuos-pagination-bar.component';
import { AzuosPanelCard } from '../../../../lib/components/azuos-panel-card/azuos-panel-card.component';
import { AzuosSegmentedControl } from '../../../../lib/components/azuos-segmented-control/azuos-segmented-control.component';
import { AzuosSelectField } from '../../../../lib/components/azuos-select-field/azuos-select-field.component';
import { notificationLook } from '../../../../lib/utils/notification-style.util';
import { type NotificationHistoryModel } from '../../../../lib/view-models/use-notification-history.model';

/**
 * O HISTÓRICO DE NOTIFICAÇÕES — uma seção da ficha do perfil com as mais recentes e o "Ver
 * todas", que abre um DIÁLOGO por cima: os filtros em cima e a lista paginada embaixo. O resumo
 * fica igual atrás dele. Clicar numa notificação abre a tela do assunto e marca como lida.
 */
export type AzuosNotificationHistoryViewProps = NotificationHistoryModel;

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'unread', label: 'Não lidas' },
  { value: 'read', label: 'Lidas' },
];

const SEVERITY_OPTIONS = [
  { value: '', label: 'Todos os níveis' },
  ...NOTIFICATION_SEVERITIES.map((severity) => ({
    value: severity,
    label: notificationLook(severity).label,
    icon: notificationLook(severity).icon,
  })),
];

const TOPIC_OPTIONS = [
  { value: '', label: 'Todos os assuntos' },
  ...NOTIFICATION_TOPIC_KEYS.map((topic) => ({
    value: topic,
    label: NOTIFICATION_TOPICS[topic].label,
  })),
];

export function AzuosNotificationHistoryView({
  data,
  state,
  actions,
}: AzuosNotificationHistoryViewProps) {
  return (
    <>
      <RecentNotifications data={data} state={state} actions={actions} />
      <Dialog
        open={state.isExpanded}
        onOpenChange={(open) => (open ? actions.onExpand() : actions.onCollapse())}
      >
        <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(94vw,64rem)]">
          <DialogHeader className="border-border flex-row items-center justify-between gap-3 border-b px-6 py-4">
            <span className="min-w-0">
              <DialogTitle>Todas as notificações</DialogTitle>
              <DialogDescription>Tudo o que o sistema avisou a você.</DialogDescription>
            </span>
            <AzuosActionButton
              data={{ label: 'Marcar todas como lidas' }}
              ui={{ variant: 'secondary', size: 'sm', icon: CheckCheck, className: 'mr-8' }}
              actions={{ onClick: actions.onMarkAllRead }}
            />
          </DialogHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
            <HistoryFilters data={data} state={state} actions={actions} />
            <HistoryList data={data} state={state} actions={actions} />
          </div>
          <div className="border-border border-t px-6 py-3">
            <AzuosPaginationBar
              data={{
                ...data.pagination,
                noun: ['notificação', 'notificações'],
                gender: 'feminine',
              }}
              state={{ isLoading: state.isFetching }}
              actions={{ onPageChange: actions.onPageChange }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * A seção do perfil: as mais recentes, sem filtro nem páginas — o perfil é a ficha da pessoa,
 * não a tela das notificações. O "Ver todas" diz quantas há, para a pessoa saber o tamanho do que
 * vai abrir.
 */
function RecentNotifications({ data, state, actions }: AzuosNotificationHistoryViewProps) {
  const { items, total } = data.recent;

  return (
    <AzuosPanelCard
      data={{ title: 'Notificações', hint: 'As mais recentes.' }}
      ui={{ bodyClassName: 'flex flex-col gap-3' }}
    >
      <NotificationList
        data={{ items }}
        state={{ isLoading: state.isRecentLoading, error: null, hasFilters: false }}
        actions={actions}
      />
      {total > items.length ? (
        <AzuosActionButton
          data={{ label: `Ver todas (${total})` }}
          ui={{ variant: 'secondary', icon: Maximize2, className: 'self-start' }}
          actions={{ onClick: actions.onExpand }}
        />
      ) : null}
    </AzuosPanelCard>
  );
}

function HistoryFilters({ data, state, actions }: AzuosNotificationHistoryViewProps) {
  const { filters } = data;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <AzuosFilterField data={{ label: 'Situação' }}>
        <AzuosSegmentedControl
          data={{ value: filters.status, options: STATUS_OPTIONS }}
          ui={{ ariaLabel: 'Situação da notificação' }}
          actions={{
            onChange: (status) =>
              actions.onFiltersChange({ status: status as typeof filters.status }),
          }}
        />
      </AzuosFilterField>
      <AzuosFilterField data={{ label: 'Nível' }}>
        <AzuosSelectField
          data={{ value: filters.severity ?? '', options: SEVERITY_OPTIONS }}
          ui={{ ariaLabel: 'Nível' }}
          actions={{
            onChange: (value) =>
              actions.onFiltersChange({
                severity: (value || undefined) as NotificationSeverity | undefined,
              }),
          }}
        />
      </AzuosFilterField>
      <AzuosFilterField data={{ label: 'Assunto' }}>
        <AzuosSelectField
          data={{ value: filters.topic ?? '', options: TOPIC_OPTIONS }}
          ui={{ ariaLabel: 'Assunto' }}
          actions={{
            onChange: (value) =>
              actions.onFiltersChange({
                topic: (value || undefined) as NotificationTopic | undefined,
              }),
          }}
        />
      </AzuosFilterField>
      <AzuosFilterField data={{ label: 'Buscar' }} ui={{ className: 'min-w-56 flex-1' }}>
        <div className="relative">
          <Search
            className="text-ink-500 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label="Buscar no título e no texto"
            placeholder="Título ou texto"
            value={filters.search ?? ''}
            onChange={(event) =>
              actions.onFiltersChange({ search: event.target.value || undefined })
            }
            className="pl-9"
          />
        </div>
      </AzuosFilterField>
      <AzuosDateRangeField
        data={{
          label: 'Período',
          name: 'notificationPeriod',
          value: { from: filters.from ?? null, to: filters.to ?? null },
        }}
        actions={{
          onChange: (range) =>
            actions.onFiltersChange({ from: range.from ?? undefined, to: range.to ?? undefined }),
        }}
      />
      <AzuosClearFiltersButton
        state={{ hasFilter: state.hasFilters }}
        actions={{ onClear: actions.onClearFilters }}
      />
    </div>
  );
}

/** A lista do diálogo: a página escolhida, com os filtros. */
function HistoryList({ data, state, actions }: AzuosNotificationHistoryViewProps) {
  return (
    <NotificationList
      data={{ items: data.items }}
      state={{ isLoading: state.isLoading, error: state.error, hasFilters: state.hasFilters }}
      actions={actions}
    />
  );
}

/** Uma lista de notificações com os três estados: falhou, carregando e vazia. */
function NotificationList({
  data,
  state,
  actions,
}: {
  data: { items: AzuosNotificationHistoryViewProps['data']['items'] };
  state: { isLoading: boolean; error: string | null; hasFilters: boolean };
  actions: Pick<AzuosNotificationHistoryViewProps['actions'], 'onOpen'>;
}) {
  if (state.error) {
    return (
      <p role="alert" className="text-hue-red text-sm font-medium">
        {state.error}
      </p>
    );
  }
  if (state.isLoading) return <p className="text-ink-500 text-sm">Carregando o histórico…</p>;
  if (data.items.length === 0) {
    return (
      <AzuosEmptyState
        data={{
          title: state.hasFilters
            ? 'Nenhuma notificação neste recorte'
            : 'Nenhuma notificação ainda',
          description: state.hasFilters
            ? 'Tente tirar algum filtro.'
            : 'O que o sistema avisar a você fica guardado aqui.',
        }}
      />
    );
  }

  return (
    <ul className="divide-border/60 divide-y">
      {data.items.map((item) => (
        <li key={item.id}>
          <AzuosNotificationCard
            data={{ notification: item }}
            actions={{ onOpen: actions.onOpen }}
          />
        </li>
      ))}
    </ul>
  );
}
