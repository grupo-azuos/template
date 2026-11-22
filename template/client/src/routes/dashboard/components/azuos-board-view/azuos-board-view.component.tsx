import {
  ChevronDown,
  LayoutDashboard,
  ListFilter,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  SquarePlus,
} from 'lucide-react';
import { useState } from 'react';

import {
  BOARD_FILTER_KIND_LABELS,
  BOARD_FILTER_KINDS,
  MAX_BOARD_WEIGHT,
  type SavedFilter,
} from '@template/shared/schemas/dashboard-board.schema';

import {
  AzuosActionButton,
  azuosActionButton,
} from '../../../../lib/components/azuos-action-button/azuos-action-button.component';
import { Button } from '../../../../lib/components/azuos-button/azuos-button';
import { AzuosErrorState } from '../../../../lib/components/azuos-error-state/azuos-error-state.component';
import { AzuosLoadingState } from '../../../../lib/components/azuos-loading-state/azuos-loading-state.component';
import { AzuosPageHeader } from '../../../../lib/components/azuos-page-header/azuos-page-header.component';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../../lib/components/azuos-popover/azuos-popover';
import { AzuosSegmentedControl } from '../../../../lib/components/azuos-segmented-control/azuos-segmented-control.component';
import { AzuosSelectField } from '../../../../lib/components/azuos-select-field/azuos-select-field.component';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../../../lib/components/azuos-sheet/azuos-sheet';
import {
  type DashboardBoardModel,
  REFRESH_OPTIONS,
} from '../../../../lib/view-models/use-dashboard-board.model';
import { AzuosBoardCanvas } from '../azuos-board-canvas/azuos-board-canvas.component';
import {
  AzuosBoardFilterBar,
  type AzuosBoardFilterBarProps,
} from '../azuos-board-filter-bar/azuos-board-filter-bar.component';
import { AzuosWidgetEditorDialog } from '../azuos-widget-editor-dialog/azuos-widget-editor-dialog.component';
import { fitGroup, followTitle } from '../azuos-widget-editor-dialog/widget-editor.util';

/**
 * O DASHBOARD, no formato do Grafana — as abas dos três painéis (Equipe, Gestor, Pessoal), o
 * seletor de tempo e o "atualizar a cada" no canto de cima, os filtros (as variáveis) numa faixa e
 * os blocos embaixo, cada um com o menu dele (Ver, Editar, Duplicar, Remover).
 *
 * Quem pode editar clica em "Editar painel" e o PRÓPRIO painel entra em montagem — sem tela por
 * cima: uma barra no alto com Adicionar, Configurações (os filtros), Descartar e Salvar; os blocos
 * se arrastam e se redimensionam ali mesmo, e cada um abre no editor de tela cheia. Tudo num
 * rascunho que só "Salvar painel" grava.
 */
export type AzuosBoardViewProps = {
  data: DashboardBoardModel['data'] & { filters: SavedFilter[] };
  /** `isFilterScreenOpen`: o montador de filtros está na frente, e o editor de bloco espera atrás. */
  state: DashboardBoardModel['state'] & { isFilterScreenOpen: boolean };
  actions: DashboardBoardModel['actions'] & { onOpenFilters: () => void };
};

export function AzuosBoardView({ data, state, actions }: AzuosBoardViewProps) {
  /* `useState` puramente visual: as configurações do painel (os filtros) abertas na lateral. */
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const filterNames = Object.fromEntries(data.filters.map((filter) => [filter.id, filter.name]));
  const filterBarData: AzuosBoardFilterBarProps['data'] = {
    filters: data.boardFilters,
    values: data.filterValues,
    people: data.people,
    counts: data.filterCounts,
  };

  return (
    <div className="flex flex-col gap-5 p-6">
      <AzuosPageHeader
        data={{ title: 'Dashboard', description: updatedLabel(data.updatedAt) }}
        ui={{ icon: LayoutDashboard }}
      />

      <TopBar data={data} state={state} actions={actions} filterBarData={filterBarData} />

      {state.isEditing ? (
        <EditToolbar
          data={data}
          state={state}
          actions={{
            ...actions,
            onOpenSettings: () => setIsSettingsOpen(true),
            onCancelEdit: () => {
              setIsSettingsOpen(false);
              actions.onCancelEdit();
            },
          }}
        />
      ) : null}

      {state.error ? (
        <AzuosErrorState data={{ message: state.error }} ui={{ variant: 'inline' }} />
      ) : null}

      {state.isLoading ? (
        <AzuosLoadingState data={{ label: 'Carregando o painel…' }} />
      ) : (
        <>
          <AzuosBoardFilterBar
            data={filterBarData}
            ui={{ part: 'fields' }}
            actions={{
              onChange: actions.onFilterValueChange,
              onClear: actions.onClearFilterValues,
            }}
          />
          <AzuosBoardCanvas
            data={{
              widgets: data.widgets,
              layout: data.layout,
              results: data.results,
              filterNames,
            }}
            state={{ isEditing: state.isEditing, canEdit: state.canEdit }}
            actions={{
              onLayoutChange: actions.onLayoutChange,
              onEditWidget: actions.onEditWidget,
              onRemoveWidget: actions.onRemoveWidget,
              onDuplicateWidget: actions.onDuplicateWidget,
              onChangeKind: (id, kind) => {
                const widget = data.widgets.find((item) => item.id === id);
                // Trocar o tipo pelo próprio bloco acerta o agrupamento, como no editor.
                if (widget)
                  actions.onSubmitWidget(followTitle(widget, fitGroup({ ...widget, kind })));
              },
              onOpenItem: actions.onOpenItem,
            }}
          />
        </>
      )}

      {/* AS CONFIGURAÇÕES DO PAINEL, na lateral: os filtros (as variáveis do Grafana) — a ordem, o
          desenho e a largura de cada um, e os que faltam para pôr. Larga: a lista cabe numa linha
          por filtro (nome, desenho, largura, setas), sem quebrar. */}
      <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-[min(64rem,90vw)]">
          <SheetHeader>
            <SheetTitle>Configurações do painel</SheetTitle>
            <SheetDescription>
              Os filtros do painel: a ordem na barra, o desenho e a largura de cada um.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <AzuosBoardFilterBar
              data={filterBarData}
              state={{ isEditing: true, isListOpen: true }}
              actions={{
                onChange: actions.onFilterValueChange,
                onClear: actions.onClearFilterValues,
                onAdd: actions.onAddBoardFilter,
                onRemove: actions.onRemoveBoardFilter,
                onDisplayChange: actions.onBoardFilterDisplayChange,
                onWidthChange: actions.onBoardFilterWidthChange,
                onPlaceChange: actions.onBoardFilterPlaceChange,
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

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

/**
 * A BARRA DE CIMA, como a do Grafana: à esquerda, qual painel se vê; à direita, o seletor de
 * tempo, o "Atualizar" com o "atualizar a cada" e o "Editar painel".
 */
function TopBar({
  data,
  state,
  actions,
  filterBarData,
}: Pick<AzuosBoardViewProps, 'data' | 'state' | 'actions'> & {
  filterBarData: AzuosBoardFilterBarProps['data'];
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
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
      <div className="flex flex-wrap items-start justify-end gap-2">
        <AzuosBoardFilterBar
          data={filterBarData}
          ui={{ part: 'period' }}
          actions={{ onChange: actions.onFilterValueChange }}
        />
        <AzuosActionButton
          data={{ label: 'Atualizar', loadingLabel: 'Atualizando…' }}
          ui={{ variant: 'secondary', icon: RefreshCw }}
          state={{ isLoading: state.isRefreshing }}
          actions={{ onClick: actions.onRefresh }}
        />
        <AzuosSelectField
          data={{ value: data.refreshEvery, options: [...REFRESH_OPTIONS] }}
          ui={{ ariaLabel: 'Atualizar a cada', className: 'w-36' }}
          actions={{ onChange: actions.onRefreshEveryChange }}
        />
        {state.canEdit && !state.isEditing ? (
          <AzuosActionButton
            data={{ label: 'Editar painel' }}
            ui={{ icon: Pencil }}
            actions={{ onClick: actions.onStartEdit }}
          />
        ) : null}
      </div>
    </div>
  );
}

/** MONTANDO, no próprio painel: a barra presa no alto, como a do Grafana em edição. */
function EditToolbar({
  data,
  state,
  actions,
}: Pick<AzuosBoardViewProps, 'data' | 'state'> & {
  actions: AzuosBoardViewProps['actions'] & { onOpenSettings: () => void };
}) {
  const scopeLabel = data.scopes.find((option) => option.value === data.scope)?.label ?? '';

  return (
    <div
      role="toolbar"
      aria-label="Montando o painel"
      className="rounded-surface bg-card shadow-card sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 px-4 py-3"
    >
      <p className="text-sm font-semibold">
        Editando o painel {scopeLabel}
        <span className="text-muted-foreground font-normal">
          {' '}
          · {data.weight} de {MAX_BOARD_WEIGHT} pontos
        </span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <AddMenu data={data} state={state} actions={actions} />
        <AzuosActionButton
          data={{ label: 'Configurações' }}
          ui={{ variant: 'secondary', icon: Settings2 }}
          actions={{ onClick: actions.onOpenSettings }}
        />
        <AzuosActionButton
          data={{ label: 'Descartar' }}
          ui={{ variant: 'ghost' }}
          state={{ isDisabled: state.isSaving }}
          actions={{ onClick: actions.onCancelEdit }}
        />
        <AzuosActionButton
          data={{ label: 'Salvar painel', loadingLabel: 'Salvando…' }}
          ui={{ icon: Save }}
          state={{ isLoading: state.isSaving }}
          actions={{ onClick: actions.onSave }}
        />
      </div>
    </div>
  );
}

const MENU_ITEM =
  'flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-chip px-3 py-2 text-left text-sm text-foreground outline-none hover:bg-hover-veil focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0';

/** O "Adicionar": um bloco novo, ou um dos filtros que o painel ainda não tem. */
function AddMenu({
  data,
  state,
  actions,
}: Pick<AzuosBoardViewProps, 'data' | 'state' | 'actions'>) {
  /* `useState` puramente visual: o menu aberto ou fechado. */
  const [isOpen, setIsOpen] = useState(false);
  const missing = BOARD_FILTER_KINDS.filter(
    (kind) => !data.boardFilters.some((filter) => filter.kind === kind),
  );
  const pick = (action: () => void) => () => {
    setIsOpen(false);
    action();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button type="button" className={azuosActionButton({ variant: 'secondary', size: 'lg' })}>
          <Plus aria-hidden="true" />
          Adicionar
          <ChevronDown aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        role="menu"
        aria-label="Adicionar"
        className="rounded-surface bg-popover ring-foreground/8 w-64 max-w-[calc(100vw-2rem)] border-transparent p-1.5 shadow-xl ring-1"
      >
        <button
          type="button"
          role="menuitem"
          disabled={!state.canAdd}
          onClick={pick(() => actions.onNewWidget())}
          className={MENU_ITEM}
        >
          <SquarePlus aria-hidden="true" />
          Bloco
        </button>
        {missing.length > 0 ? (
          <>
            <div role="separator" className="bg-border -mx-1.5 my-1 h-px" />
            <p className="text-muted-foreground px-3 py-1 text-xs font-medium">Filtro</p>
            {missing.map((kind) => (
              <button
                key={kind}
                type="button"
                role="menuitem"
                onClick={pick(() => actions.onAddBoardFilter(kind))}
                className={MENU_ITEM}
              >
                <ListFilter aria-hidden="true" />
                {BOARD_FILTER_KIND_LABELS[kind]}
              </button>
            ))}
          </>
        ) : null}
      </PopoverContent>
    </Popover>
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
