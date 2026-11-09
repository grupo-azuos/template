import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  EMPTY_BOARD_FILTER_VALUES,
  ME_VALUE,
} from '@template/shared/schemas/dashboard-board.schema';

import { PEOPLE_FIXTURE } from '../../../../lib/utils/dashboard-fixture.util';
import {
  AzuosBoardFilterBar,
  type AzuosBoardFilterBarProps,
  clampRange,
  fieldFilterOptions,
  presetOf,
  windowOfPreset,
} from './azuos-board-filter-bar.component';

function makeProps(
  overrides: Partial<AzuosBoardFilterBarProps['data']> = {},
  isEditing = false,
): AzuosBoardFilterBarProps {
  return {
    data: {
      filters: [
        { id: 'pessoa', kind: 'person', label: 'Pessoa' },
        { id: 'periodo', kind: 'period', label: 'Período' },
      ],
      values: EMPTY_BOARD_FILTER_VALUES,
      people: PEOPLE_FIXTURE,
      ...overrides,
    },
    state: { isEditing },
    actions: { onChange: vi.fn(), onAdd: vi.fn(), onRemove: vi.fn() },
  };
}

/* `fireEvent`, como no AzuosComboboxField: o popover do Radix abre num portal, e o `userEvent`
   fica preso esperando geometria que o jsdom não calcula. */
function open(name: string) {
  fireEvent.click(screen.getByRole('combobox', { name }));
}

describe('AzuosBoardFilterBar', () => {
  // feliz
  it('picks a person by id, "me" or everyone for the whole board', () => {
    const props = makeProps();
    render(<AzuosBoardFilterBar {...props} />);

    open('Pessoa');
    fireEvent.click(screen.getByRole('option', { name: /Bia Marques/ }));
    open('Pessoa');
    fireEvent.click(screen.getByRole('option', { name: 'Eu' }));

    expect(props.actions.onChange).toHaveBeenCalledWith({ person: 'u-bia' });
    expect(props.actions.onChange).toHaveBeenCalledWith({ person: ME_VALUE });
  });

  // feliz
  it('shows the exact dates and the window label for a custom period', () => {
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

    expect(screen.getByText('01/11/2026 a 30/11/2026')).toBeInTheDocument();
    expect(screen.getByText(/Entre \(até 90 dias\)/)).toBeInTheDocument();
  });

  // feliz
  it('offers to add the missing kinds and to remove the present ones while editing', () => {
    const props = makeProps(
      { filters: [{ id: 'periodo', kind: 'period', label: 'Período' }] },
      true,
    );
    render(<AzuosBoardFilterBar {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Pessoa' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tirar o filtro Período' }));

    expect(props.actions.onAdd).toHaveBeenCalledWith('person');
    expect(props.actions.onRemove).toHaveBeenCalledWith('periodo');
    expect(screen.queryByRole('button', { name: 'Período' })).not.toBeInTheDocument();
  });

  // triste
  it('renders nothing for a board without filters, unless it is being built', () => {
    const { container, rerender } = render(<AzuosBoardFilterBar {...makeProps({ filters: [] })} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<AzuosBoardFilterBar {...makeProps({ filters: [] }, true)} />);
    expect(screen.getByText(/Ponha um filtro/)).toBeInTheDocument();
  });

  // triste
  it('never shows the remove buttons to whoever is only viewing', () => {
    render(<AzuosBoardFilterBar {...makeProps()} />);

    expect(screen.queryByRole('button', { name: /Tirar o filtro/ })).not.toBeInTheDocument();
  });
});

describe('board field filters', () => {
  // feliz
  it('picks a task status for the whole board, or goes back to all', () => {
    const props = makeProps({
      filters: [{ id: 'taskStatus', kind: 'taskStatus', label: 'Status da tarefa' }],
    });
    render(<AzuosBoardFilterBar {...props} />);

    expect(screen.getByRole('combobox', { name: 'Status da tarefa' })).toHaveTextContent('Todos');
  });

  // feliz
  it('labels the values with the source labels, in Portuguese', () => {
    expect(fieldFilterOptions('taskStatus')).toEqual([
      { value: 'todo', label: 'A fazer' },
      { value: 'doing', label: 'Em andamento' },
      { value: 'done', label: 'Concluída' },
    ]);
  });

  // triste
  it('keeps a short list as a plain select, without a search box', () => {
    render(
      <AzuosBoardFilterBar
        {...makeProps({ filters: [{ id: 'taskStatus', kind: 'taskStatus', label: 'Status' }] })}
      />,
    );

    fireEvent.click(screen.getByRole('combobox', { name: 'Status' }));

    expect(screen.queryByPlaceholderText('Buscar...')).not.toBeInTheDocument();
  });
});

describe('board period presets', () => {
  // feliz
  it('maps windows to presets and back', () => {
    const window = windowOfPreset('last-7-day', '2026-11-08');

    expect(presetOf(window)).toBe('last-7-day');
    expect(presetOf(null)).toBe('each');
    expect(windowOfPreset('each', '2026-11-08')).toBeNull();
    expect(windowOfPreset('custom', '2026-11-08')).toEqual({
      mode: 'custom',
      from: '2026-10-10',
      to: '2026-11-08',
    });
  });

  // triste
  it('pulls a too-long or reversed range back inside 90 days', () => {
    expect(clampRange('2026-01-01', '2026-12-31')).toEqual({
      from: '2026-01-01',
      to: '2026-03-31',
    });
    expect(clampRange('2026-03-10', '2026-03-01')).toEqual({
      from: '2026-03-01',
      to: '2026-03-10',
    });
  });
});
