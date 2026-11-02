import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  AzuosMultiSelectField,
  summarizeSelection,
  targetIndex,
} from './azuos-multi-select-field.component';

const OPTIONS = [
  { value: 'simples', label: 'Simples Nacional' },
  { value: 'presumido', label: 'Lucro Presumido' },
  { value: 'real', label: 'Lucro Real' },
];
const DATA = { values: [], options: OPTIONS, placeholder: 'Todos os regimes', noun: 'regimes' };

describe('AzuosMultiSelectField', () => {
  // feliz
  it('summarizes the choice by names and then by count', () => {
    expect(summarizeSelection(DATA)).toBe('Todos os regimes');
    expect(summarizeSelection({ ...DATA, values: ['real', 'simples'] })).toBe(
      'Simples Nacional, Lucro Real',
    );
    expect(summarizeSelection({ ...DATA, values: ['real', 'simples', 'presumido'] })).toBe(
      '3 regimes',
    );
  });

  // feliz
  it('returns the marked values in the order of the options', () => {
    const onChange = vi.fn();
    render(
      <AzuosMultiSelectField
        data={{ ...DATA, values: ['real'] }}
        ui={{ ariaLabel: 'Regime' }}
        actions={{ onChange }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Regime: Lucro Real' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Simples Nacional' }));

    expect(onChange).toHaveBeenCalledWith(['simples', 'real']);
  });

  // feliz
  it('unmarks and clears everything at once', () => {
    const onChange = vi.fn();
    render(<AzuosMultiSelectField data={{ ...DATA, values: ['real'] }} actions={{ onChange }} />);

    fireEvent.click(screen.getByRole('button', { name: /Todos os regimes: Lucro Real/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Lucro Real' }));
    fireEvent.click(screen.getByRole('button', { name: 'Limpar' }));

    expect(onChange).toHaveBeenNthCalledWith(1, []);
    expect(onChange).toHaveBeenNthCalledWith(2, []);
  });

  // feliz
  it('walks the boxes with the arrows', () => {
    render(
      <AzuosMultiSelectField
        data={DATA}
        ui={{ ariaLabel: 'Regime' }}
        actions={{ onChange: vi.fn() }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Regime/ }));
    const group = screen.getByRole('group', { name: 'Regime' });

    fireEvent.keyDown(group, { key: 'End' });
    expect(screen.getByRole('checkbox', { name: 'Lucro Real' })).toHaveFocus();
    fireEvent.keyDown(group, { key: 'ArrowDown' });
    expect(screen.getByRole('checkbox', { name: 'Simples Nacional' })).toHaveFocus();
    fireEvent.keyDown(group, { key: 'Tab' });
    expect(targetIndex('first', 2, 3)).toBe(0);
    expect(targetIndex(-1, -1, 3)).toBe(0);
    expect(targetIndex(-1, 0, 3)).toBe(2);
  });

  // triste
  it('does not open while disabled and ignores values without an option', () => {
    render(
      <AzuosMultiSelectField
        data={{ ...DATA, values: ['ghost'] }}
        state={{ isDisabled: true }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    const trigger = screen.getByRole('button', { name: 'Todos os regimes: Todos os regimes' });
    expect(trigger).toBeDisabled();
    fireEvent.click(trigger);
    expect(screen.queryByRole('checkbox')).toBeNull();
  });
});

describe('AzuosMultiSelectField with people', () => {
  const PEOPLE = [
    { value: 'ana', label: 'Ana Souza', personName: 'Ana Souza', avatarUrl: null },
    { value: 'caio', label: 'Caio Ribeiro', personName: 'Caio Ribeiro' },
  ];
  const PEOPLE_DATA = { values: ['ana'], options: PEOPLE, placeholder: 'Todos', noun: 'pessoas' };

  // feliz
  it('shows the face of who is marked on the button and of everyone in the list', () => {
    render(<AzuosMultiSelectField data={PEOPLE_DATA} actions={{ onChange: vi.fn() }} />);

    const trigger = screen.getByRole('button', { name: 'Todos: Ana Souza' });
    expect(trigger).toHaveTextContent('AS');

    fireEvent.click(trigger);

    expect(screen.getByRole('checkbox', { name: 'Caio Ribeiro' })).toBeInTheDocument();
    expect(screen.getByText('CR')).toBeInTheDocument();
  });

  // triste
  it('draws no face when the options are not people', () => {
    render(<AzuosMultiSelectField data={DATA} actions={{ onChange: vi.fn() }} />);

    expect(document.querySelector('[data-slot="avatar"]')).toBeNull();
  });
});
