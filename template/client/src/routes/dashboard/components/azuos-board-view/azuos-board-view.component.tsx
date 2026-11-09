import { LayoutDashboard, Pencil, RefreshCw } from 'lucide-react';

import { type SavedFilter } from '@template/shared/schemas/dashboard-board.schema';

import { AzuosActionButton } from '../../../../lib/components/azuos-action-button/azuos-action-button.component';
import { AzuosErrorState } from '../../../../lib/components/azuos-error-state/azuos-error-state.component';
import { AzuosLoadingState } from '../../../../lib/components/azuos-loading-state/azuos-loading-state.component';
import { AzuosPageHeader } from '../../../../lib/components/azuos-page-header/azuos-page-header.component';
import { AzuosSegmentedControl } from '../../../../lib/components/azuos-segmented-control/azuos-segmented-control.component';
import { type DashboardBoardModel } from '../../../../lib/view-models/use-dashboard-board.model';
import { AzuosBoardCanvas } from '../azuos-board-canvas/azuos-board-canvas.component';
import { AzuosBoardFilterBar } from '../azuos-board-filter-bar/azuos-board-filter-bar.component';
import { AzuosBoardStudio } from '../azuos-board-studio/azuos-board-studio.component';
import { AzuosWidgetEditorDialog } from '../azuos-widget-editor-dialog/azuos-widget-editor-dialog.component';
import { fitGroup, followTitle } from '../azuos-widget-editor-dialog/widget-editor.util';

/**
 * O DASHBOARD — as abas dos três painéis (Equipe, Gestor, Pessoal) e o painel. Quem não pode
 * editar só vê e atualiza; quem pode clica em "Editar painel" e a montagem abre em TELA CHEIA,
 * por cima do menu do sistema (`AzuosBoardStudio`), num rascunho que só "Guardar" grava.
 */
export type AzuosBoardViewProps = {
  data: DashboardBoardModel['data'] & { filters: SavedFilter[] };
  /** `isFilterScreenOpen`: o montador de filtros está na frente, e o editor de bloco espera atrás. */
  state: DashboardBoardModel['state'] & { isFilterScreenOpen: boolean };
  actions: DashboardBoardModel['actions'] & { onOpenFilters: () => void };
};

export function AzuosBoardView({ data, state, actions }: AzuosBoardViewProps) {
  const filterNames = Object.fromEntries(data.filters.map((filter) => [filter.id, filter.name]));
  const scopeLabel = data.scopes.find((option) => option.value === data.scope)?.label ?? '';

  return (
    <div className="flex flex-col gap-5 p-6">
      <AzuosPageHeader
        data={{ title: 'Dashboard', description: updatedLabel(data.updatedAt) }}
        ui={{ icon: LayoutDashboard }}
      />

      {/* Uma linha só: à esquerda, qual painel se vê (as abas no tamanho delas, não esticadas na
          largura toda); à direita, o que se faz com ele. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {data.scopes.length > 1 ? (
          <AzuosSegmentedControl
            data={{ value: data.scope, options: data.scopes }}
            ui={{ ariaLabel: 'Qual painel', className: 'w-fit' }}
            state={{ isDisabled: state.isEditing }}
            actions={{ onChange: actions.onScopeChange }}
          />
        ) : (
          <span />
        )}
        <div className="flex flex-wrap gap-2">
          <AzuosActionButton
            data={{ label: 'Atualizar', loadingLabel: 'Atualizando…' }}
            ui={{ variant: 'secondary', icon: RefreshCw }}
            state={{ isLoading: state.isRefreshing }}
            actions={{ onClick: actions.onRefresh }}
          />
          {state.canEdit ? (
            <AzuosActionButton
              data={{ label: 'Editar painel' }}
              ui={{ icon: Pencil }}
              actions={{ onClick: actions.onStartEdit }}
            />
          ) : null}
        </div>
      </div>

      {state.error && !state.isEditing ? (
        <AzuosErrorState data={{ message: state.error }} ui={{ variant: 'inline' }} />
      ) : null}

      {state.isLoading ? null : (
        <AzuosBoardFilterBar
          data={{
            filters: data.boardFilters,
            values: data.filterValues,
            people: data.people,
          }}
          actions={{ onChange: actions.onFilterValueChange }}
        />
      )}

      {state.isLoading ? (
        <AzuosLoadingState data={{ label: 'Carregando o painel…' }} />
      ) : (
        <AzuosBoardCanvas
          data={{ widgets: data.widgets, layout: data.layout, results: data.results, filterNames }}
          state={{ isEditing: false }}
          actions={{
            onLayoutChange: actions.onLayoutChange,
            onEditWidget: actions.onEditWidget,
            onRemoveWidget: actions.onRemoveWidget,
          }}
        />
      )}

      <AzuosBoardStudio
        data={{
          scopeLabel,
          widgets: data.widgets,
          layout: data.layout,
          results: data.results,
          filterNames,
          boardFilters: data.boardFilters,
          filterValues: data.filterValues,
          people: data.people,
        }}
        state={{
          isOpen: state.isEditing,
          isSaving: state.isSaving,
          canAdd: state.canAdd,
          error: state.error,
        }}
        actions={{
          onLayoutChange: actions.onLayoutChange,
          onNewWidget: actions.onNewWidget,
          onEditWidget: actions.onEditWidget,
          onRemoveWidget: actions.onRemoveWidget,
          onChangeKind: (id, kind) => {
            const widget = data.widgets.find((item) => item.id === id);
            // Trocar o tipo pelo próprio card acerta o agrupamento, como no editor.
            if (widget) actions.onSubmitWidget(followTitle(widget, fitGroup({ ...widget, kind })));
          },
          onOpenFilters: actions.onOpenFilters,
          onFilterValueChange: actions.onFilterValueChange,
          onAddBoardFilter: actions.onAddBoardFilter,
          onRemoveBoardFilter: actions.onRemoveBoardFilter,
          onCancel: actions.onCancelEdit,
          onSave: actions.onSave,
        }}
      />

      <AzuosWidgetEditorDialog
        data={{ editing: data.editing, filters: data.filters, preview: data.preview }}
        state={{ isHidden: state.isFilterScreenOpen }}
        actions={{
          onClose: actions.onCloseEditor,
          onSubmit: actions.onSubmitWidget,
          onOpenFilters: actions.onOpenFilters,
          onPreviewChange: actions.onPreviewChange,
        }}
      />
    </div>
  );
}

function updatedLabel(updatedAt: string | null): string {
  if (!updatedAt) return 'O painel padrão do sistema. Os números se renovam a cada 5 minutos.';
  const when = new Date(updatedAt).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return `Montado em ${when}. Os números se renovam a cada 5 minutos.`;
}
