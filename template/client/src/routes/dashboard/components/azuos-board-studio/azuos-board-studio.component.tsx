import { GripVertical, LayoutDashboard, ListFilter, RotateCcw, Save } from 'lucide-react';

import {
  type BoardFilter,
  type BoardFilterKind,
  type BoardFilterValues,
  MAX_WIDGETS,
  type LayoutItem,
  type Widget,
  type WidgetKind,
} from '@template/shared/schemas/dashboard-board.schema';

import { AzuosActionButton } from '../../../../lib/components/azuos-action-button/azuos-action-button.component';
import { AzuosExpandableScreen } from '../../../../lib/components/azuos-expandable-screen/azuos-expandable-screen.component';
import { type AzuosPersonPickerPerson } from '../../../../lib/components/azuos-person-picker-field/azuos-person-picker-field.component';
import { cn } from '../../../../lib/utils/cn.util';
import { type WidgetState } from '../../../../lib/view-models/use-dashboard-board.model';
import {
  AzuosBoardCanvas,
  KIND_DRAG_TYPE,
  kindDragTypeOf,
} from '../azuos-board-canvas/azuos-board-canvas.component';
import { AzuosBoardFilterBar } from '../azuos-board-filter-bar/azuos-board-filter-bar.component';
import {
  bottomPlace,
  defaultSizeOf,
  MAIN_KINDS,
  OTHER_KINDS,
  WIDGET_KIND_LOOK,
} from '../azuos-board-widget/widget-kind.util';

/**
 * MONTAR O PAINEL — a tela cheia que abre por cima de tudo (sem o menu do sistema). À esquerda o
 * tabuleiro, com as casas da grade à mostra; à direita os tipos de bloco, para ARRASTAR até a
 * casa onde ele deve nascer (ou pôr embaixo com um clique). "Guardar" é a única ação principal;
 * "Restaurar" desiste.
 */
export type AzuosBoardStudioProps = {
  data: {
    scopeLabel: string;
    widgets: Widget[];
    layout: LayoutItem[];
    results: Record<string, WidgetState>;
    filterNames: Record<string, string>;
    boardFilters: BoardFilter[];
    filterValues: BoardFilterValues;
    people: AzuosPersonPickerPerson[];
  };
  state: { isOpen: boolean; isSaving: boolean; canAdd: boolean; error: string | null };
  actions: {
    onFilterValueChange: (patch: Partial<BoardFilterValues>) => void;
    onAddBoardFilter: (kind: BoardFilterKind) => void;
    onRemoveBoardFilter: (id: string) => void;
    onLayoutChange: (layout: LayoutItem[]) => void;
    onNewWidget: (kind: WidgetKind, place: Omit<LayoutItem, 'i'>) => void;
    onEditWidget: (id: string) => void;
    onRemoveWidget: (id: string) => void;
    onChangeKind: (id: string, kind: WidgetKind) => void;
    onOpenFilters: () => void;
    onCancel: () => void;
    onSave: () => void;
  };
};

export function AzuosBoardStudio({ data, state, actions }: AzuosBoardStudioProps) {
  return (
    <AzuosExpandableScreen
      data={{
        title: `Montar o painel ${data.scopeLabel}`,
        description:
          'Arraste um bloco da lateral para uma casa da grade. Pela alça ele muda de lugar; pelos cantos, de tamanho.',
      }}
      state={{ isOpen: state.isOpen }}
      actions={{ onClose: actions.onCancel }}
      footer={
        <>
          <AzuosActionButton
            data={{ label: 'Restaurar' }}
            ui={{ variant: 'ghost', icon: RotateCcw }}
            state={{ isDisabled: state.isSaving }}
            actions={{ onClick: actions.onCancel }}
          />
          <AzuosActionButton
            data={{ label: 'Guardar', loadingLabel: 'Guardando…' }}
            ui={{ icon: Save, size: 'lg' }}
            state={{ isLoading: state.isSaving }}
            actions={{ onClick: actions.onSave }}
          />
        </>
      }
    >
      <div className="grid min-h-full lg:grid-cols-[minmax(0,1fr)_21rem]">
        <section aria-label="O painel" className="min-w-0 bg-mantle p-6">
          {state.error ? (
            <p role="alert" className="mb-4 rounded-box bg-card p-3 text-sm text-hue-red">
              {state.error}
            </p>
          ) : null}
          {/* Os filtros do painel montam aqui mesmo, no alto: é onde quem vê vai encontrá-los. */}
          <div className="mb-6">
            <AzuosBoardFilterBar
              data={{
                filters: data.boardFilters,
                values: data.filterValues,
                people: data.people,
              }}
              state={{ isEditing: true }}
              actions={{
                onChange: actions.onFilterValueChange,
                onAdd: actions.onAddBoardFilter,
                onRemove: actions.onRemoveBoardFilter,
              }}
            />
          </div>
          <AzuosBoardCanvas
            data={{
              widgets: data.widgets,
              layout: data.layout,
              results: data.results,
              filterNames: data.filterNames,
            }}
            state={{ isEditing: true, canDrop: state.canAdd }}
            actions={{
              onLayoutChange: actions.onLayoutChange,
              onEditWidget: actions.onEditWidget,
              onRemoveWidget: actions.onRemoveWidget,
              onChangeKind: actions.onChangeKind,
              onDropKind: actions.onNewWidget,
            }}
          />
        </section>
        {/* A lateral fica parada enquanto o painel rola, com a rolagem própria dos tipos. */}
        <aside className="flex flex-col gap-5 border-l border-border bg-card p-5 lg:sticky lg:top-0 lg:max-h-[calc(100dvh-9.5rem)] lg:self-start lg:overflow-y-auto">
          <AzuosActionButton
            data={{ label: 'Montar filtros' }}
            ui={{ variant: 'secondary', size: 'lg', icon: ListFilter }}
            actions={{ onClick: actions.onOpenFilters }}
          />
          <KindPalette data={data} state={state} actions={actions} />
        </aside>
      </div>
    </AzuosExpandableScreen>
  );
}

/**
 * Os tipos de bloco: os seis mais usados à frente e os outros abaixo (Lei de Hick). Cada um
 * arrasta até a grade — ou, com um clique (ou Enter), entra embaixo de tudo.
 */
function KindPalette({
  data,
  state,
  actions,
}: {
  data: Pick<AzuosBoardStudioProps['data'], 'widgets' | 'layout'>;
  state: AzuosBoardStudioProps['state'];
  actions: AzuosBoardStudioProps['actions'];
}) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900">
        <LayoutDashboard className="size-4" aria-hidden="true" />
        Blocos
        <span className="ml-auto rounded-chip bg-muted px-2 py-0.5 text-xs font-medium text-ink-700">
          {data.widgets.length}/{MAX_WIDGETS}
        </span>
      </h3>
      <p className="mt-0.5 text-xs text-ink-500">
        {state.canAdd
          ? 'Arraste para a grade, ou clique para pôr no fim.'
          : 'O painel já tem o máximo de blocos.'}
      </p>
      <KindGroup
        data={{ title: 'Mais usados', kinds: MAIN_KINDS, layout: data.layout }}
        state={state}
        actions={actions}
      />
      <KindGroup
        data={{ title: 'Outros', kinds: OTHER_KINDS, layout: data.layout }}
        state={state}
        actions={actions}
      />
    </div>
  );
}

function KindGroup({
  data,
  state,
  actions,
}: {
  data: { title: string; kinds: readonly WidgetKind[]; layout: LayoutItem[] };
  state: AzuosBoardStudioProps['state'];
  actions: AzuosBoardStudioProps['actions'];
}) {
  return (
    <section aria-label={data.title} className="mt-4">
      <p className="mb-1.5 text-xs font-semibold tracking-wider text-ink-500 uppercase">
        {data.title}
      </p>
      <ul className="flex flex-col gap-1.5">
        {data.kinds.map((kind) => {
          const look = WIDGET_KIND_LOOK[kind];
          const Icon = look.icon;
          const size = defaultSizeOf(kind);

          return (
            <li key={kind}>
              <button
                type="button"
                draggable={state.canAdd}
                disabled={!state.canAdd}
                aria-label={`Pôr bloco ${look.short}`}
                onDragStart={(event) => {
                  event.dataTransfer.setData(KIND_DRAG_TYPE, kind);
                  event.dataTransfer.setData(kindDragTypeOf(kind), kind);
                  event.dataTransfer.effectAllowed = 'copy';
                  attachDragGhost(event.dataTransfer, look.short, size);
                }}
                onClick={() => actions.onNewWidget(kind, bottomPlace(data.layout, kind))}
                className={cn(
                  'group flex min-h-12 w-full cursor-grab items-center gap-3 rounded-box border border-border bg-background px-2.5 py-2 text-left transition-colors active:cursor-grabbing',
                  'hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink-900">{look.short}</span>
                  <span className="block text-xs text-ink-500">
                    {size.w} × {size.h} casas
                  </span>
                </span>
                <GripVertical
                  className="size-4 text-ink-500 group-disabled:hidden"
                  aria-hidden="true"
                />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** O tamanho de uma casa na miniatura que segue o mouse. */
const GHOST_CELL = { width: 56, height: 32 };

/**
 * A MINIATURA QUE SEGUE O MOUSE: no formato do bloco (2×2, 4×2, 1×2…), com o nome — e não a
 * "foto" do botão que o navegador tiraria. Ela só precisa existir no instante do `dragstart`;
 * o navegador copia o desenho, e o elemento sai da página no quadro seguinte.
 */
export function attachDragGhost(
  transfer: Pick<DataTransfer, 'setDragImage'>,
  label: string,
  size: { w: number; h: number },
): HTMLElement {
  const ghost = document.createElement('div');
  ghost.textContent = `${label} · ${size.w} × ${size.h}`;
  ghost.className =
    'fixed -top-[999px] left-0 flex items-center justify-center rounded-box border border-border bg-card px-2 text-center text-xs font-semibold text-ink-900 shadow-card';
  ghost.style.width = `${size.w * GHOST_CELL.width}px`;
  ghost.style.height = `${size.h * GHOST_CELL.height}px`;
  document.body.append(ghost);
  transfer.setDragImage(ghost, 16, 16);
  requestAnimationFrame(() => ghost.remove());

  return ghost;
}
