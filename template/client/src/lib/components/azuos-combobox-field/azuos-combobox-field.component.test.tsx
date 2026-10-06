import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosComboboxField } from './azuos-combobox-field.component';

const tags = [
  { value: 'urgente', label: 'Urgente' },
  { value: 'cliente-novo', label: 'Cliente novo' },
  { value: 'financeiro', label: 'Financeiro' },
];

/* `fireEvent`, não `userEvent`, para abrir e escolher: o jsdom não calcula layout de verdade, e o
   `userEvent.click` do Popover do Radix — que abre num portal, fora da árvore do componente —
   fica preso esperando um estado de "visível" que o jsdom nunca resolve. */
function open(name: string) {
  fireEvent.click(screen.getByRole('combobox', { name }));
}

function search(term: string) {
  fireEvent.change(screen.getByPlaceholderText('Pesquisar…'), { target: { value: term } });
}

describe('AzuosComboboxField', () => {
  // feliz
  it('shows the label of the selected option', () => {
    render(
      <AzuosComboboxField
        data={{ value: 'financeiro', options: tags }}
        ui={{ ariaLabel: 'Etiqueta' }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    expect(screen.getByRole('combobox', { name: 'Etiqueta' })).toHaveTextContent('Financeiro');
  });

  // feliz
  it('filters the list by what was typed', async () => {
    render(
      <AzuosComboboxField
        data={{ value: '', options: tags }}
        ui={{ ariaLabel: 'Etiqueta' }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    open('Etiqueta');
    search('financ');

    expect(await screen.findByRole('option', { name: /Financeiro/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Urgente/ })).not.toBeInTheDocument();
  });

  // feliz
  it('choosing an option calls onChange with its value', async () => {
    const onChange = vi.fn();

    render(
      <AzuosComboboxField
        data={{ value: '', options: tags }}
        ui={{ ariaLabel: 'Etiqueta' }}
        actions={{ onChange }}
      />,
    );

    open('Etiqueta');
    fireEvent.click(await screen.findByRole('option', { name: /Cliente novo/ }));

    expect(onChange).toHaveBeenCalledWith('cliente-novo');
  });

  // feliz
  it('offers to create what was typed and not found, and calls onCreate with it', async () => {
    const onCreate = vi.fn();

    render(
      <AzuosComboboxField
        data={{ value: '', options: tags }}
        ui={{ ariaLabel: 'Etiqueta', createLabel: 'Criar etiqueta' }}
        actions={{ onChange: vi.fn(), onCreate }}
      />,
    );

    open('Etiqueta');
    search('Pendente');
    fireEvent.click(await screen.findByRole('option', { name: /Criar etiqueta/ }));

    expect(onCreate).toHaveBeenCalledWith('Pendente');
  });

  // triste
  it('does not offer to create when the screen passed no onCreate', async () => {
    render(
      <AzuosComboboxField
        data={{ value: '', options: tags }}
        ui={{ ariaLabel: 'Etiqueta' }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    open('Etiqueta');
    search('Pendente');

    expect(await screen.findByText('Nada encontrado.')).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Criar/ })).not.toBeInTheDocument();
  });

  // triste
  it('does not offer to create an option that already exists, ignoring case', async () => {
    render(
      <AzuosComboboxField
        data={{ value: '', options: tags }}
        ui={{ ariaLabel: 'Etiqueta' }}
        actions={{ onChange: vi.fn(), onCreate: vi.fn() }}
      />,
    );

    open('Etiqueta');
    search('urgente');

    expect(await screen.findByRole('option', { name: /Urgente/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Criar/ })).not.toBeInTheDocument();
  });

  // triste
  it('does not open when disabled', () => {
    render(
      <AzuosComboboxField
        data={{ value: '', options: tags }}
        ui={{ ariaLabel: 'Etiqueta' }}
        state={{ isDisabled: true }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    open('Etiqueta');

    expect(screen.queryByPlaceholderText('Pesquisar…')).not.toBeInTheDocument();
  });
});
