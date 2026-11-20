import { History } from 'lucide-react';

import {
  HISTORY_ACTION_LABELS,
  HISTORY_TARGET_LABELS,
  type HistoryAction,
  type HistoryTargetType,
} from '@template/shared/schemas/history.schema';

import { AzuosClearFiltersButton } from '../../../../lib/components/azuos-clear-filters-button/azuos-clear-filters-button.component';
import { AzuosComboboxField } from '../../../../lib/components/azuos-combobox-field/azuos-combobox-field.component';
import { AzuosDateRangeField } from '../../../../lib/components/azuos-date-range-field/azuos-date-range-field.component';
import {
  type AzuosHistoryEntry,
  AzuosHistoryTimeline,
} from '../../../../lib/components/azuos-history-timeline/azuos-history-timeline.component';
import { AzuosPageHeader } from '../../../../lib/components/azuos-page-header/azuos-page-header.component';
import { AzuosPaginationBar } from '../../../../lib/components/azuos-pagination-bar/azuos-pagination-bar.component';
import { AzuosSegmentedControl } from '../../../../lib/components/azuos-segmented-control/azuos-segmented-control.component';
import { AzuosSelectField } from '../../../../lib/components/azuos-select-field/azuos-select-field.component';
import { AzuosTextField } from '../../../../lib/components/azuos-text-field/azuos-text-field.component';
import { type HistoryFilter } from '../../../../lib/view-models/use-history.model';

/**
 * O HISTÓRICO — a linha do tempo do sistema: quem cadastrou, alterou, concluiu ou arquivou o
 * quê, e quando, com o que mudou campo a campo. Filtros em cima, paginação embaixo.
 */
export type AzuosHistoryViewProps = {
  data: {
    entries: AzuosHistoryEntry[];
    filter: HistoryFilter;
    page: number;
    pageSize: number;
    total: number;
  };
  state: { isLoading: boolean; isFetching: boolean; error: string | null };
  actions: {
    onFilterChange: (patch: Partial<HistoryFilter>) => void;
    onClearFilters: () => void;
    onPageChange: (page: number) => void;
  };
};

const WHO_OPTIONS = [
  { value: 'all', label: 'De todos' },
  { value: 'mine', label: 'O que eu fiz' },
];

const TARGET_OPTIONS = [
  { value: '', label: 'Todos os tipos' },
  ...(Object.keys(HISTORY_TARGET_LABELS) as HistoryTargetType[]).map((type) => ({
    value: type,
    label: HISTORY_TARGET_LABELS[type],
  })),
];

/* Mais de 15 ações: combobox com busca, não lista para rolar. */
const ACTION_OPTIONS = [
  { value: '', label: 'Todas as ações' },
  ...(Object.keys(HISTORY_ACTION_LABELS) as HistoryAction[]).map((action) => ({
    value: action,
    label: HISTORY_ACTION_LABELS[action],
  })),
];

export function AzuosHistoryView({ data, state, actions }: AzuosHistoryViewProps) {
  return (
    <section className="flex flex-col gap-6 p-6">
      <AzuosPageHeader
        ui={{ icon: History }}
        data={{
          title: 'Histórico',
          description: 'Quem mudou o quê e quando, no sistema inteiro — com o antes e o depois.',
        }}
      />

      <Filters data={data} actions={actions} />

      <AzuosHistoryTimeline
        data={{ entries: data.entries }}
        state={{ isLoading: state.isLoading, error: state.error }}
        ui={{ emptyLabel: 'Nada no histórico com estes filtros.' }}
      />

      <AzuosPaginationBar
        data={{
          page: data.page,
          pageSize: data.pageSize,
          total: data.total,
          noun: ['registro', 'registros'],
        }}
        state={{ isLoading: state.isFetching }}
        actions={{ onPageChange: actions.onPageChange }}
      />
    </section>
  );
}

function Filters({ data, actions }: Pick<AzuosHistoryViewProps, 'data' | 'actions'>) {
  const { filter } = data;
  const hasFilter =
    filter.who !== 'all' ||
    Boolean(filter.targetType || filter.action || filter.search || filter.from || filter.to);

  return (
    <div className="grid grid-cols-1 items-end gap-3 rounded-surface bg-card p-4 shadow-xs md:grid-cols-2 xl:grid-cols-6">
      <AzuosTextField
        data={{
          label: 'Buscar',
          name: 'historySearch',
          value: filter.search,
          placeholder: 'Nome da empresa, alvará ou contrato',
        }}
        ui={{ className: 'md:col-span-2' }}
        actions={{ onChange: (search) => actions.onFilterChange({ search }) }}
      />
      <AzuosDateRangeField
        data={{
          label: 'Período',
          name: 'historyPeriod',
          value: { from: filter.from, to: filter.to },
        }}
        ui={{ placeholder: 'Qualquer dia', className: 'md:col-span-2' }}
        actions={{
          onChange: (range) => actions.onFilterChange({ from: range.from, to: range.to }),
        }}
      />
      <AzuosSelectField
        data={{ value: filter.targetType, options: TARGET_OPTIONS }}
        ui={{ ariaLabel: 'Tipo', placeholder: 'Todos os tipos' }}
        actions={{
          onChange: (targetType) =>
            actions.onFilterChange({ targetType: targetType as HistoryFilter['targetType'] }),
        }}
      />
      <AzuosComboboxField
        data={{ value: filter.action, options: ACTION_OPTIONS }}
        ui={{
          ariaLabel: 'Ação',
          placeholder: 'Todas as ações',
          searchPlaceholder: 'Buscar ação...',
        }}
        actions={{
          onChange: (action) =>
            actions.onFilterChange({ action: action as HistoryFilter['action'] }),
        }}
      />
      <div className="flex flex-wrap items-center gap-3 md:col-span-2 xl:col-span-6">
        <AzuosSegmentedControl
          data={{ value: filter.who, options: WHO_OPTIONS }}
          ui={{ ariaLabel: 'De quem' }}
          actions={{
            onChange: (who) => actions.onFilterChange({ who: who as HistoryFilter['who'] }),
          }}
        />
        {hasFilter ? (
          <AzuosClearFiltersButton
            state={{ hasFilter }}
            actions={{ onClear: actions.onClearFilters }}
          />
        ) : null}
      </div>
    </div>
  );
}
