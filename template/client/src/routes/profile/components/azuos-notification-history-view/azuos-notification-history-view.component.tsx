import { CheckCheck, Search } from 'lucide-react';

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
 * O HISTÓRICO DE NOTIFICAÇÕES — tudo o que a pessoa recebeu, com os filtros em cima e a lista
 * paginada embaixo. Clicar abre a tela do assunto e marca como lida.
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
  const { filters } = data;

  return (
    <AzuosPanelCard
      data={{ title: 'Histórico de notificações', hint: 'Tudo o que o sistema avisou a você.' }}
      ui={{ bodyClassName: 'flex flex-col gap-4' }}
      tools={
        <AzuosActionButton
          data={{ label: 'Marcar todas como lidas' }}
          ui={{ variant: 'secondary', size: 'sm', icon: CheckCheck }}
          actions={{ onClick: actions.onMarkAllRead }}
        />
      }
    >
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

      <HistoryList data={data} state={state} actions={actions} />

      <AzuosPaginationBar
        data={{ ...data.pagination, noun: ['notificação', 'notificações'], gender: 'feminine' }}
        state={{ isLoading: state.isFetching }}
        actions={{ onPageChange: actions.onPageChange }}
      />
    </AzuosPanelCard>
  );
}

function HistoryList({ data, state, actions }: AzuosNotificationHistoryViewProps) {
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
