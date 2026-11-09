import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './select';

function renderSelect(
  position: 'popper' | 'item-aligned' = 'popper',
  size: 'sm' | 'default' = 'default',
) {
  const onValueChange = vi.fn();
  render(
    <Select onValueChange={onValueChange}>
      <SelectTrigger aria-label="Situação" size={size}>
        <SelectValue placeholder="Escolha" />
      </SelectTrigger>
      <SelectContent position={position}>
        <SelectGroup>
          <SelectLabel>Abertas</SelectLabel>
          <SelectItem value="todo">A fazer</SelectItem>
          <SelectItem value="doing">Em andamento</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectItem value="done">Concluída</SelectItem>
      </SelectContent>
    </Select>,
  );

  return onValueChange;
}

describe('Select', () => {
  // feliz
  it('lists the groups, the labels and the items when opened', () => {
    const onValueChange = renderSelect();

    fireEvent.click(screen.getByRole('combobox', { name: 'Situação' }));
    expect(screen.getByText('Abertas')).toHaveAttribute('data-slot', 'select-label');
    expect(screen.getAllByRole('option')).toHaveLength(3);

    fireEvent.click(screen.getByRole('option', { name: 'Concluída' }));

    expect(onValueChange).toHaveBeenCalledWith('done');
  });

  it('draws the small trigger and the item-aligned list', () => {
    renderSelect('item-aligned', 'sm');

    const trigger = screen.getByRole('combobox', { name: 'Situação' });
    expect(trigger).toHaveAttribute('data-size', 'sm');
    fireEvent.click(trigger);

    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  // triste
  it('shows the placeholder while nothing is chosen', () => {
    renderSelect();

    expect(screen.getByRole('combobox', { name: 'Situação' })).toHaveTextContent('Escolha');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });
});
