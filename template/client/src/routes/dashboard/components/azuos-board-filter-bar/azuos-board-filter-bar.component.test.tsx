import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  type BoardFilter,
  EMPTY_BOARD_FILTER_VALUES,
  ME_VALUE,
} from '@template/shared/schemas/dashboard-board.schema';

import {
  AzuosBoardFilterBar,
  type AzuosBoardFilterBarProps,
} from './azuos-board-filter-bar.component';

const PERSON: BoardFilter = { id: 'pessoa', kind: 'person', label: 'Responsável' };
const PERIOD: BoardFilter = { id: 'periodo', kind: 'period', label: 'Período' };

function makeProps(
  overrides: Partial<AzuosBoardFilterBarProps['data']> = {},
  state: AzuosBoardFilterBarProps['state'] = {},
): AzuosBoardFilterBarProps {
  return {
    data: {
      filters: [PERSON, PERIOD],
      values: EMPTY_BOARD_FILTER_VALUES,
      people: [
        { id: 'u-ana', name: 'Ana Souza', photo: null },
        { id: 'u-bruno', name: 'Bruno Lima', photo: null },
      ],
      ...overrides,
    },
    state,
    actions: {
      onChange: vi.fn(),
      onClear: vi.fn(),
      onAdd: vi.fn(),
      onRemove: vi.fn(),
      onDisplayChange: vi.fn(),
      onWidthChange: vi.fn(),
      onPlaceChange: vi.fn(),
    },
  };
}

/* `fireEvent`, como no AzuosComboboxField: o popover do Radix abre num portal, e o `userEvent`
   fica preso esperando geometria que o jsdom não calcula. */
function open(name: string) {
  fireEvent.click(screen.getByRole('combobox', { name }));
}

describe('AzuosBoardFilterBar', () => {
  // feliz
  it('shows each filter as one piece, the name beside the value, and filters the whole board', () => {
    const props = makeProps();
    render(<AzuosBoardFilterBar {...props} />);

    expect(screen.getByRole('group', { name: 'Responsável' })).toBeInTheDocument();
    open('Responsável');
    fireEvent.click(screen.getByRole('option', { name: 'Bruno Lima' }));
    open('Responsável');
    fireEvent.click(screen.getByRole('option', { name: 'Eu' }));

    expect(props.actions.onChange).toHaveBeenCalledWith({ person: 'u-bruno' });
    expect(props.actions.onChange).toHaveBeenCalledWith({ person: ME_VALUE });
  });

  // feliz
  it('puts the period apart, as the time picker at the top of the board', () => {
    const { rerender } = render(<AzuosBoardFilterBar {...makeProps()} ui={{ part: 'period' }} />);

    expect(screen.getByRole('group', { name: 'Período do painel' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Responsável' })).not.toBeInTheDocument();

    rerender(<AzuosBoardFilterBar {...makeProps()} ui={{ part: 'fields' }} />);
    expect(screen.queryByRole('group', { name: 'Período' })).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Responsável' })).toBeInTheDocument();
  });

  // feliz
  it('opens the exact dates under the period when they are chosen', () => {
    render(
      <AzuosBoardFilterBar
        {...makeProps({
          values: {
            ...EMPTY_BOARD_FILTER_VALUES,
            period: { mode: 'custom', from: '2026-11-01', to: '2026-11-30' },
          },
        })}
      />,
    );

    expect(screen.getByText(/Entre \(até 90 dias\)/)).toBeInTheDocument();
  });

  // feliz
  it('shows each option as a card with its count, and filters the board on a click', () => {
    const props = makeProps({
      filters: [{ id: 'status', kind: 'taskStatus', label: 'Status da tarefa', display: 'cards' }],
      counts: {
        status: {
          total: 30,
          isLoading: false,
          series: [{ key: 'done', label: 'Concluída', value: 20 }],
        },
      },
    });
    render(<AzuosBoardFilterBar {...props} />);

    const cards = screen.getByRole('radiogroup', { name: 'Status da tarefa' });
    expect(within(cards).getByRole('radio', { name: /Todos/ })).toHaveTextContent('30');
    expect(within(cards).getByRole('radio', { name: /Todos/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    fireEvent.click(within(cards).getAllByRole('radio')[1]!);

    expect(props.actions.onChange).toHaveBeenCalledWith({ taskStatus: expect.any(String) });
  });

  // feliz
  it('offers "Limpar filtros" only once something is chosen', () => {
    const props = makeProps({ values: { ...EMPTY_BOARD_FILTER_VALUES, person: ME_VALUE } });
    render(<AzuosBoardFilterBar {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(props.actions.onClear).toHaveBeenCalled();
  });

  // triste
  it('offers no clear button while nothing is chosen', () => {
    render(<AzuosBoardFilterBar {...makeProps()} />);

    expect(screen.queryByRole('button', { name: 'Limpar filtros' })).not.toBeInTheDocument();
  });

  // triste
  it('renders nothing for a board without filters, unless it is being built', () => {
    const { container, rerender } = render(<AzuosBoardFilterBar {...makeProps({ filters: [] })} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<AzuosBoardFilterBar {...makeProps({ filters: [] }, { isEditing: true })} />);
    expect(screen.getByText(/Ponha um filtro/)).toBeInTheDocument();
  });
});

describe('building the board filters', () => {
  // feliz
  it('shows the bar as it will look and the list to adjust each filter', () => {
    const props = makeProps({}, { isEditing: true, isListOpen: true });
    render(<AzuosBoardFilterBar {...props} />);

    expect(screen.getByText('Como a barra aparece')).toBeInTheDocument();
    const list = screen.getByRole('list', { name: 'Os filtros do painel, na ordem da barra' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Descer o filtro Responsável' }));
    expect(props.actions.onPlaceChange).toHaveBeenCalledWith([
      { id: 'periodo', place: { x: 0, y: 0, w: 1, h: 1 } },
      { id: 'pessoa', place: { x: 1, y: 0, w: 1, h: 1 } },
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Tirar o filtro Período' }));
    expect(props.actions.onRemove).toHaveBeenCalledWith('periodo');
  });

  // feliz
  it('picks the design of a filter', () => {
    const props = makeProps({}, { isEditing: true, isListOpen: true });
    render(<AzuosBoardFilterBar {...props} />);

    open('Mostrar Responsável como');
    fireEvent.click(screen.getByRole('option', { name: 'Cards' }));

    expect(props.actions.onDisplayChange).toHaveBeenCalledWith('pessoa', 'cards');
  });

  // feliz
  it('puts a filter on the whole line of the bar', () => {
    const props = makeProps({}, { isEditing: true, isListOpen: true });
    render(<AzuosBoardFilterBar {...props} />);

    open('Largura de Responsável');
    fireEvent.click(screen.getByRole('option', { name: 'Linha inteira' }));

    expect(props.actions.onWidthChange).toHaveBeenCalledWith('pessoa', 'full');
  });

  // feliz
  it('adds a filter the board does not have yet', () => {
    const props = makeProps({}, { isEditing: true, isListOpen: true });
    render(<AzuosBoardFilterBar {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Status da tarefa' }));

    expect(props.actions.onAdd).toHaveBeenCalledWith('taskStatus');
  });

  // triste
  it('cannot move the first filter up nor the last one down', () => {
    render(<AzuosBoardFilterBar {...makeProps({}, { isEditing: true, isListOpen: true })} />);

    expect(screen.getByRole('button', { name: 'Subir o filtro Responsável' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Descer o filtro Período' })).toBeDisabled();
  });

  // triste
  it('never shows the list to whoever is only viewing', () => {
    render(<AzuosBoardFilterBar {...makeProps()} />);

    expect(screen.queryByRole('button', { name: /Tirar o filtro/ })).not.toBeInTheDocument();
  });
});
