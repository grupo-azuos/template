import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosSuggestionTextField } from './azuos-suggestion-text-field.component';

const options = ['Administrativo', 'Financeiro', 'Recursos Humanos'];

/** O campo é controlado: este invólucro guarda o valor, como o formulário faria. */
function Controlled({
  initial = '',
  onChange = vi.fn(),
  list = options,
}: {
  initial?: string;
  onChange?: (value: string) => void;
  list?: string[];
}) {
  const [value, setValue] = useState(initial);

  return (
    <AzuosSuggestionTextField
      data={{
        label: 'Departamento',
        name: 'department',
        value,
        options: list,
        emptyMessage: 'Nada cadastrado ainda. Use Configurações › Cadastro.',
      }}
      actions={{
        onChange: (next) => {
          setValue(next);
          onChange(next);
        },
      }}
    />
  );
}

describe('AzuosSuggestionTextField', () => {
  // feliz
  /* O motivo de não usar `<datalist>`: a pessoa precisa ver o que já existe antes de digitar. */
  it('shows every registered option as soon as the field gets focus', async () => {
    render(<Controlled initial="Financeiro" />);

    await userEvent.click(screen.getByRole('combobox', { name: 'Departamento' }));

    expect(screen.getAllByRole('option')).toHaveLength(3);
    expect(screen.getByRole('option', { name: 'Financeiro' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('filters while typing, ignoring letter case', async () => {
    render(<Controlled />);

    await userEvent.type(screen.getByRole('combobox', { name: 'Departamento' }), 'RECURSOS');

    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Recursos Humanos',
    ]);
  });

  it('picks an option with the mouse', async () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);

    await userEvent.click(screen.getByRole('combobox', { name: 'Departamento' }));
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Administrativo' }));

    expect(onChange).toHaveBeenLastCalledWith('Administrativo');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('picks an option with the keyboard and closes with Escape', async () => {
    render(<Controlled />);
    const field = screen.getByRole('combobox', { name: 'Departamento' });

    await userEvent.click(field);
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(field).toHaveValue('Financeiro');

    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  // triste
  /* Travar no que está na lista obrigaria a pessoa a sair da ficha para cadastrar um cargo. */
  it('keeps a typed value that is not in the list, and says so', async () => {
    render(<Controlled />);
    const field = screen.getByRole('combobox', { name: 'Departamento' });

    await userEvent.type(field, 'Logística');

    expect(field).toHaveValue('Logística');
    expect(screen.getByText(/O que foi digitado vale assim mesmo/)).toBeInTheDocument();
  });

  it('says where to register when nothing is registered yet', async () => {
    render(<Controlled list={[]} />);

    await userEvent.click(screen.getByRole('combobox', { name: 'Departamento' }));

    expect(
      screen.getByText('Nada cadastrado ainda. Use Configurações › Cadastro.'),
    ).toBeInTheDocument();
  });

  it('announces the error next to the field', () => {
    render(
      <AzuosSuggestionTextField
        data={{ label: 'Cargo', name: 'role', value: '', options }}
        state={{ error: 'Informe o cargo', isRequired: true }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    const field = screen.getByRole('combobox', { name: /Cargo/ });
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toBeRequired();
    expect(screen.getByRole('alert')).toHaveTextContent('Informe o cargo');
  });
});
