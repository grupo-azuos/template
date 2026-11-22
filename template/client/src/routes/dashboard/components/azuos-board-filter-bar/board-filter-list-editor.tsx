import { ArrowDown, ArrowUp, GripVertical, X } from 'lucide-react';
import { useState } from 'react';

import {
  BOARD_FILTER_DISPLAY_LABELS,
  BOARD_FILTER_KIND_LABELS,
  BOARD_FILTER_WIDTH_LABELS,
  BOARD_FILTER_WIDTHS,
  type BoardFilter,
  type BoardFilterDisplay,
  type BoardFilterPlace,
  type BoardFilterWidth,
  FILTER_GRID_COLUMNS,
} from '@template/shared/schemas/dashboard-board.schema';

import { AzuosActionButton } from '../../../../lib/components/azuos-action-button/azuos-action-button.component';
import { AzuosSelectField } from '../../../../lib/components/azuos-select-field/azuos-select-field.component';
import { cn } from '../../../../lib/utils/cn.util';
import { type BoardFilterPlaceChange } from '../../../../lib/view-models/use-dashboard-board.model';
import {
  moveInList,
  placesInOrder,
  toolbarDisplayOf,
  toolbarDisplaysOf,
} from './board-filter.util';

/**
 * MONTANDO OS FILTROS, como as variáveis do Grafana: uma lista, na ordem em que aparecem na
 * barra. Cada linha arrasta (ou sobe e desce pelas setas, no teclado), escolhe o desenho e a
 * largura, e sai. A ordem volta em `onPlaceChange`, gravada como a ordem de leitura da grade; o
 * "Salvar painel" grava.
 */
export type BoardFilterListEditorProps = {
  data: { filters: (BoardFilter & { place: BoardFilterPlace })[] };
  actions: {
    onPlaceChange?: (places: readonly BoardFilterPlaceChange[]) => void;
    onDisplayChange?: (id: string, display: BoardFilterDisplay) => void;
    onWidthChange?: (id: string, width: BoardFilterWidth) => void;
    onRemove?: (id: string) => void;
  };
};

const WIDTH_OPTIONS = BOARD_FILTER_WIDTHS.map((width) => ({
  value: width,
  label: BOARD_FILTER_WIDTH_LABELS[width],
}));

export function BoardFilterListEditor({ data, actions }: BoardFilterListEditorProps) {
  /* `useState` puramente visual: a linha que está sendo arrastada e a linha por cima da qual ela
     passa. */
  const [dragged, setDragged] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    const ids = moveInList(
      data.filters.map((filter) => filter.id),
      from,
      to,
    );
    actions.onPlaceChange?.(placesInOrder(ids, FILTER_GRID_COLUMNS));
  };
  const finish = () => {
    setDragged(null);
    setOver(null);
  };

  return (
    <ol
      aria-label="Os filtros do painel, na ordem da barra"
      className="divide-border flex flex-col divide-y"
    >
      {data.filters.map((filter, index) => (
        <li
          key={filter.id}
          draggable
          onDragStart={(event) => {
            setDragged(index);
            event.dataTransfer.setData('text/plain', filter.id);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setOver(index);
          }}
          onDragLeave={() => setOver((current) => (current === index ? null : current))}
          onDrop={(event) => {
            event.preventDefault();
            if (dragged !== null) move(dragged, index);
            finish();
          }}
          onDragEnd={finish}
          className={cn(
            'rounded-control hover:bg-hover-veil flex flex-wrap items-center gap-2 px-2 py-1 transition-opacity',
            dragged === index && 'opacity-50',
            over === index && dragged !== index && 'bg-accent',
          )}
        >
          <FilterRow
            data={{ filter, index, count: data.filters.length }}
            actions={{ ...actions, onMove: move }}
          />
        </li>
      ))}
    </ol>
  );
}

function FilterRow({
  data,
  actions,
}: {
  data: { filter: BoardFilter; index: number; count: number };
  actions: BoardFilterListEditorProps['actions'] & { onMove: (from: number, to: number) => void };
}) {
  const { filter, index } = data;
  const { onDisplayChange, onWidthChange, onRemove } = actions;
  const displayOptions = toolbarDisplaysOf(filter.kind).map((display) => ({
    value: display,
    label: BOARD_FILTER_DISPLAY_LABELS[display],
  }));

  return (
    <>
      <GripVertical
        className="text-muted-foreground size-4 shrink-0 cursor-grab"
        aria-hidden="true"
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-foreground truncate text-sm font-semibold">{filter.label}</span>
        <span className="text-muted-foreground text-xs">
          {BOARD_FILTER_KIND_LABELS[filter.kind]}
        </span>
      </span>
      {onDisplayChange ? (
        <AzuosSelectField
          data={{ value: toolbarDisplayOf(filter), options: displayOptions }}
          ui={{ ariaLabel: `Mostrar ${filter.label} como`, className: 'w-40' }}
          actions={{
            onChange: (display) => onDisplayChange(filter.id, display as BoardFilterDisplay),
          }}
        />
      ) : null}
      {onWidthChange ? (
        <AzuosSelectField
          data={{ value: filter.width ?? 'auto', options: WIDTH_OPTIONS }}
          ui={{ ariaLabel: `Largura de ${filter.label}`, className: 'w-40' }}
          actions={{ onChange: (width) => onWidthChange(filter.id, width as BoardFilterWidth) }}
        />
      ) : null}
      <AzuosActionButton
        data={{ label: `Subir o filtro ${filter.label}` }}
        ui={{ variant: 'ghost', icon: ArrowUp, isIconOnly: true }}
        state={{ isDisabled: index === 0 }}
        actions={{ onClick: () => actions.onMove(index, index - 1) }}
      />
      <AzuosActionButton
        data={{ label: `Descer o filtro ${filter.label}` }}
        ui={{ variant: 'ghost', icon: ArrowDown, isIconOnly: true }}
        state={{ isDisabled: index === data.count - 1 }}
        actions={{ onClick: () => actions.onMove(index, index + 1) }}
      />
      {onRemove ? (
        <AzuosActionButton
          data={{ label: `Tirar o filtro ${filter.label}` }}
          ui={{ variant: 'ghost', icon: X, isIconOnly: true }}
          actions={{ onClick: () => onRemove(filter.id) }}
        />
      ) : null}
    </>
  );
}
