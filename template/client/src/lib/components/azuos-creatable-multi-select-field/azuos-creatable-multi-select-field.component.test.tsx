import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  AzuosCreatableMultiSelectField,
  canCreateOption,
  optionKey,
  toggleValue,
} from './azuos-creatable-multi-select-field.component';

const OPTIONS = [
  { value: '1', label: 'Alteração' },
  { value: '2', label: 'Assinatura de documentos' },
];

function open() {
  fireEvent.click(screen.getByRole('combobox', { name: 'Tipos' }));
}

describe('AzuosCreatableMultiSelectField', () => {
  // feliz
  it('shows the chosen options by name and toggles one without closing', () => {
    const onChange = vi.fn();
    render(
      <AzuosCreatableMultiSelectField
        data={{ value: ['1'], options: OPTIONS }}
        ui={{ ariaLabel: 'Tipos' }}
        actions={{ onChange, onCreate: vi.fn() }}
      />,
    );

    expect(screen.getByRole('combobox', { name: 'Tipos' })).toHaveTextContent('Alteração');
    open();
    fireEvent.click(screen.getByRole('option', { name: /Assinatura/ }));

    expect(onChange).toHaveBeenCalledWith(['1', '2']);
    expect(screen.getByRole('option', { name: /Assinatura/ })).toBeInTheDocument();
  });

  // feliz
  it('offers to register what was typed and was not found', () => {
    const onCreate = vi.fn();
    render(
      <AzuosCreatableMultiSelectField
        data={{ value: [], options: OPTIONS }}
        ui={{ ariaLabel: 'Tipos' }}
        actions={{ onChange: vi.fn(), onCreate }}
      />,
    );

    open();
    fireEvent.change(screen.getByPlaceholderText('Buscar ou cadastrar'), {
      target: { value: 'Baixa' },
    });
    fireEvent.click(screen.getByRole('option', { name: /Cadastrar “Baixa”/ }));

    expect(onCreate).toHaveBeenCalledWith('Baixa');
  });

  // triste
  it('does not offer to register an option that exists, written another way', () => {
    expect(canCreateOption('alteracao', OPTIONS)).toBe(false);
    expect(canCreateOption('A', OPTIONS)).toBe(false);
    expect(canCreateOption('Baixa', OPTIONS)).toBe(true);
    expect(optionKey(' ALTERAÇÃO ')).toBe('alteracao');
    expect(toggleValue(['1', '2'], '1')).toEqual(['2']);
  });

  // triste
  it('says nothing is chosen yet, and locks when disabled', () => {
    render(
      <AzuosCreatableMultiSelectField
        data={{ value: [], options: [] }}
        ui={{ ariaLabel: 'Tipos', placeholder: 'Escolha ou cadastre os tipos' }}
        state={{ isDisabled: true }}
        actions={{ onChange: vi.fn(), onCreate: vi.fn() }}
      />,
    );

    expect(screen.getByRole('combobox', { name: 'Tipos' })).toHaveTextContent(
      'Escolha ou cadastre os tipos',
    );
    expect(screen.getByRole('combobox', { name: 'Tipos' })).toBeDisabled();
  });
});
