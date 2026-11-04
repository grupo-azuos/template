import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosFormSelectField } from './azuos-form-select-field.component';

const roles = [
  { value: '', label: 'Todos os papéis' },
  { value: 'admin', label: 'Administrador' },
  { value: 'manager', label: 'Gestor' },
];

function renderSelect(props: { value?: string; onChange?: (value: string) => void } = {}) {
  const onChange = props.onChange ?? vi.fn();

  render(
    <AzuosFormSelectField
      data={{ label: 'Papel', value: props.value ?? '', options: roles }}
      actions={{ onChange }}
    />,
  );

  return onChange;
}

/* `fireEvent`, e não `userEvent`, para abrir e escolher: o menu do Radix abre num portal, e o
   jsdom não calcula a geometria que o `userEvent` espera para considerá-lo visível. */
describe('AzuosFormSelectField', () => {
  // feliz
  it('names the trigger by the label and shows the selected option', () => {
    renderSelect({ value: 'manager' });

    expect(screen.getByRole('combobox', { name: 'Papel' })).toHaveTextContent('Gestor');
  });

  // feliz
  it('calls onChange with the chosen value', async () => {
    const onChange = renderSelect({ value: '' });

    fireEvent.click(screen.getByRole('combobox', { name: 'Papel' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Administrador' }));

    expect(onChange).toHaveBeenCalledWith('admin');
  });

  // triste
  it('returns an empty string, not the internal sentinel, for the empty option', async () => {
    const onChange = renderSelect({ value: 'admin' });

    fireEvent.click(screen.getByRole('combobox', { name: 'Papel' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Todos os papéis' }));

    expect(onChange).toHaveBeenCalledWith('');
  });

  // triste
  it('keeps the trigger disabled and shows why', () => {
    render(
      <AzuosFormSelectField
        data={{
          label: 'Papel',
          value: 'admin',
          options: roles,
          hint: 'Você não pode mudar o próprio papel.',
        }}
        state={{ isDisabled: true }}
      />,
    );

    expect(screen.getByRole('combobox', { name: 'Papel' })).toBeDisabled();
    expect(screen.getByText('Você não pode mudar o próprio papel.')).toBeInTheDocument();
  });

  // triste
  it('announces the error instead of the hint', () => {
    render(
      <AzuosFormSelectField
        data={{ label: 'Nível de acesso', value: 'admin', options: roles, hint: 'Dica' }}
        state={{ error: 'Gestor só libera o nível Usuário.' }}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Gestor só libera o nível Usuário.');
    expect(screen.queryByText('Dica')).not.toBeInTheDocument();
  });
});

describe('AzuosFormSelectField required', () => {
  // feliz
  it('paints the required mark next to the label', () => {
    render(
      <AzuosFormSelectField
        data={{ label: 'Categoria', value: '', options: [{ value: 'a', label: 'A' }] }}
        state={{ isRequired: true }}
      />,
    );

    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
  });

  // triste
  it('paints no mark when the field is optional', () => {
    render(<AzuosFormSelectField data={{ label: 'Categoria', value: '', options: [] }} />);

    expect(screen.queryByText('*')).toBeNull();
  });
});
