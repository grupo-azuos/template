import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EMPTY_BOARD_FILTER_VALUES } from '@template/shared/schemas/dashboard-board.schema';

import { widgetFixture } from '../../../../lib/utils/dashboard-fixture.util';
import { KIND_DRAG_TYPE, kindDragTypeOf } from '../azuos-board-canvas/azuos-board-canvas.component';
import {
  attachDragGhost,
  AzuosBoardStudio,
  type AzuosBoardStudioProps,
} from './azuos-board-studio.component';

function makeProps(
  overrides: Partial<AzuosBoardStudioProps['state']> = {},
  widgets = [widgetFixture({ id: 'a', kind: 'list', title: 'Por responsável', groupBy: 'createdBy' })],
): AzuosBoardStudioProps {
  return {
    data: {
      scopeLabel: 'Gestor',
      widgets,
      layout: widgets.map((widget, index) => ({ i: widget.id, x: 0, y: index * 2, w: 2, h: 2 })),
      results: {},
      filterNames: {},
      boardFilters: [{ id: 'periodo', kind: 'period', label: 'Período' }],
      filterValues: EMPTY_BOARD_FILTER_VALUES,
      people: [],
    },
    state: { isOpen: true, isSaving: false, canAdd: true, error: null, ...overrides },
    actions: {
      onFilterValueChange: vi.fn(),
      onAddBoardFilter: vi.fn(),
      onRemoveBoardFilter: vi.fn(),
      onLayoutChange: vi.fn(),
      onNewWidget: vi.fn(),
      onEditWidget: vi.fn(),
      onRemoveWidget: vi.fn(),
      onChangeKind: vi.fn(),
      onOpenFilters: vi.fn(),
      onCancel: vi.fn(),
      onSave: vi.fn(),
    },
  };
}

describe('AzuosBoardStudio', () => {
  // feliz
  it('opens full screen and places a clicked kind at the bottom, at its own size', () => {
    const props = makeProps();
    render(<AzuosBoardStudio {...props} />);

    expect(screen.getByRole('dialog', { name: 'Montar o painel Gestor' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pôr bloco Calor' }));

    expect(props.actions.onNewWidget).toHaveBeenCalledWith('heatmap', { x: 0, y: 2, w: 2, h: 2 });
    // O destaque nasce na largura toda, em dois andares: o Zuzu, o total e os quatro cards.
    expect(screen.getAllByText('4 × 2 casas').length).toBeGreaterThan(0);
    // Sem o bloco de "disposição" em código: quem monta não lê coordenada, vê a grade.
    expect(screen.queryByText('Disposição')).not.toBeInTheDocument();
  });

  // feliz
  it('puts the dragged kind in the dataTransfer so the grid knows what lands', () => {
    render(<AzuosBoardStudio {...makeProps()} />);
    const setData = vi.fn();
    const setDragImage = vi.fn();

    fireEvent.dragStart(screen.getByRole('button', { name: 'Pôr bloco Colunas' }), {
      dataTransfer: { setData, setDragImage, effectAllowed: 'all' },
    });

    expect(setData).toHaveBeenCalledWith(KIND_DRAG_TYPE, 'column');
    expect(setData).toHaveBeenCalledWith(kindDragTypeOf('column'), 'column');
    expect(setDragImage).toHaveBeenCalledWith(expect.any(HTMLElement), 16, 16);
  });

  // feliz
  it('splits the common kinds from the rest, and saves, restores and closes on Esc', () => {
    const props = makeProps();
    render(<AzuosBoardStudio {...props} />);

    expect(screen.getByRole('region', { name: 'Mais usados' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Outros' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(props.actions.onSave).toHaveBeenCalled();
    expect(props.actions.onCancel).toHaveBeenCalled();
  });

  // feliz
  it('builds the board filters in place: removes one and offers the missing kind', () => {
    const props = makeProps();
    render(<AzuosBoardStudio {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Pessoa' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tirar o filtro Período' }));

    expect(props.actions.onAddBoardFilter).toHaveBeenCalledWith('person');
    expect(props.actions.onRemoveBoardFilter).toHaveBeenCalledWith('periodo');
  });

  // triste
  it('locks the kinds when the board is full, and shows the save error', () => {
    render(<AzuosBoardStudio {...makeProps({ canAdd: false, error: 'Falhou ao salvar' }, [])} />);

    expect(screen.getByText('O painel já tem o máximo de blocos.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pôr bloco Colunas' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('Falhou ao salvar');
  });

  // triste
  it('renders nothing when closed', () => {
    const { container } = render(<AzuosBoardStudio {...makeProps({ isOpen: false })} />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('attachDragGhost', () => {
  // feliz
  it('shapes the ghost like the block and removes it on the next frame', async () => {
    const setDragImage = vi.fn();
    const ghost = attachDragGhost({ setDragImage }, 'Destaque', { w: 4, h: 2 });

    expect(ghost).toHaveTextContent('Destaque · 4 × 2');
    expect(ghost.style.width).toBe('224px');
    expect(ghost.style.height).toBe('64px');
    expect(setDragImage).toHaveBeenCalledWith(ghost, 16, 16);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(document.body.contains(ghost)).toBe(false);
  });

  // triste
  it('still draws a visible ghost for the narrowest block', () => {
    const ghost = attachDragGhost({ setDragImage: vi.fn() }, 'Medidor', { w: 1, h: 2 });

    expect(ghost.style.width).toBe('56px');
  });
});
