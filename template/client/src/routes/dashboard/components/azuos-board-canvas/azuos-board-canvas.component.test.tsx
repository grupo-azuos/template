import { render, screen } from '@testing-library/react';
import gsap from 'gsap';
import { describe, expect, it, vi } from 'vitest';

import { widgetFixture, widgetResultFixture } from '../../../../lib/utils/dashboard-fixture.util';
import { DRAG_HANDLE, NO_DRAG } from '../azuos-board-widget/azuos-board-widget.component';
import {
  AzuosBoardCanvas,
  type AzuosBoardCanvasProps,
  KIND_DRAG_TYPE,
  kindDragTypeOf,
  kindOf,
  slotRows,
} from './azuos-board-canvas.component';

function makeProps(isEditing = false): AzuosBoardCanvasProps {
  return {
    data: {
      widgets: [
        widgetFixture({
          id: 'a',
          kind: 'list',
          title: 'Por responsável',
          groupBy: 'owner',
          filterId: 'f1',
        }),
        widgetFixture({ id: 'b', kind: 'list', title: 'Por tipo', groupBy: 'type' }),
      ],
      layout: [
        { i: 'a', x: 0, y: 0, w: 2, h: 2 },
        { i: 'b', x: 2, y: 0, w: 2, h: 2 },
      ],
      results: {
        a: widgetResultFixture({ total: 1, series: [{ key: 'x', label: 'Leyla', value: 1 }] }),
      },
      filterNames: { f1: 'Só os meus' },
    },
    state: { isEditing },
    actions: { onLayoutChange: vi.fn(), onEditWidget: vi.fn(), onRemoveWidget: vi.fn() },
  };
}

describe('AzuosBoardCanvas', () => {
  // feliz
  it('places each block on the grid with its filter name and its result', () => {
    render(<AzuosBoardCanvas {...makeProps()} />);

    expect(screen.getByRole('region', { name: 'Por responsável' })).toHaveTextContent('Só os meus');
    expect(screen.getByRole('region', { name: 'Por tipo' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Arrastar/ })).not.toBeInTheDocument();
  });

  // feliz
  it('gives every block a drag handle while editing', () => {
    render(<AzuosBoardCanvas {...makeProps(true)} />);

    expect(screen.getAllByRole('button', { name: /^Arrastar/ })).toHaveLength(2);
  });

  // feliz
  it('makes the whole header a handle while editing, but not its buttons', () => {
    render(<AzuosBoardCanvas {...makeProps(true)} />);
    const header = screen.getByRole('heading', { name: 'Por tipo' }).closest('header');

    expect(header).toHaveClass(DRAG_HANDLE);
    expect(
      screen.getByRole('button', { name: 'Configurar Por tipo' }).closest(`.${NO_DRAG}`),
    ).not.toBeNull();
  });

  // feliz
  it('animates only the block that just landed, never the first render', () => {
    const fromTo = vi.spyOn(gsap, 'fromTo').mockReturnValue({} as gsap.core.Tween);
    const props = makeProps(true);
    const { rerender } = render(<AzuosBoardCanvas {...props} />);
    expect(fromTo).not.toHaveBeenCalled();

    const added = widgetFixture({ id: 'c', kind: 'list', title: 'Novo', groupBy: 'type' });
    rerender(
      <AzuosBoardCanvas
        {...props}
        data={{
          ...props.data,
          widgets: [...props.data.widgets, added],
          layout: [...props.data.layout, { i: 'c', x: 0, y: 2, w: 2, h: 2 }],
        }}
      />,
    );

    expect(fromTo).toHaveBeenCalledTimes(1);
    expect(fromTo.mock.calls[0]?.[0]).toBe(
      screen.getByRole('region', { name: 'Novo' }).parentElement,
    );
    fromTo.mockRestore();
  });

  // triste
  it('explains an empty board, and shows the empty grid while editing', () => {
    const props = makeProps();
    const empty = { ...props.data, widgets: [], layout: [] };
    const { rerender } = render(<AzuosBoardCanvas {...props} data={empty} />);
    expect(screen.getByText('Este painel ainda não tem blocos.')).toBeInTheDocument();

    rerender(<AzuosBoardCanvas {...makeProps(true)} data={empty} />);
    expect(screen.queryByText('Este painel ainda não tem blocos.')).not.toBeInTheDocument();
  });
});

describe('kindOf', () => {
  const dragOf = (value: string, types: string[] = []) =>
    ({
      dataTransfer: {
        getData: (type: string) => (type === KIND_DRAG_TYPE ? value : ''),
        types,
      },
    }) as unknown as DragEvent;

  // feliz
  it('reads the dragged block kind from the data on drop', () => {
    expect(kindOf(dragOf('hero'))).toBe('hero');
  });

  // feliz
  /* Passando por cima, o navegador esconde o conteúdo; o tipo vem no nome do formato — e é
     isso que deixa a casa de destino já no tamanho certo durante o arrasto. */
  it('reads the kind from the format name while dragging over', () => {
    expect(kindOf(dragOf('', [KIND_DRAG_TYPE, kindDragTypeOf('radial')]))).toBe('radial');
  });

  // triste
  it('ignores anything else being dragged (files, text)', () => {
    expect(kindOf(dragOf('pizza', ['Files', `${KIND_DRAG_TYPE}+pizza`]))).toBeNull();
    expect(kindOf({ dataTransfer: null } as DragEvent)).toBeNull();
  });
});

describe('slotRows', () => {
  // feliz
  it('draws slots down to the last block plus two spare rows', () => {
    expect(slotRows([{ i: 'a', x: 0, y: 3, w: 2, h: 4 }])).toBe(9);
  });

  // triste
  it('still shows six rows of slots on an empty board', () => {
    expect(slotRows([])).toBe(6);
  });
});
