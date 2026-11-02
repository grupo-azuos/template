import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type FormEvent } from 'react';
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

  /* `mousedown` com `preventDefault` na seta: o foco fica no campo, e o `blur` não fecha a lista
     no mesmo instante em que o clique tenta abri-la. */
  it('opens and closes the list from the arrow without losing focus', () => {
    render(<Controlled />);
    const arrow = screen.getByRole('button', { name: 'Ver as opções de Departamento' });

    fireEvent.mouseDown(arrow);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Departamento' })).toHaveFocus();

    fireEvent.mouseDown(arrow);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes the list and tells the form when the field loses focus', async () => {
    const onBlur = vi.fn();
    render(
      <AzuosSuggestionTextField
        data={{ label: 'Cargo', name: 'role', value: '', options }}
        actions={{ onChange: vi.fn(), onBlur }}
      />,
    );

    await userEvent.click(screen.getByRole('combobox', { name: 'Cargo' }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await userEvent.tab();

    expect(onBlur).toHaveBeenCalledOnce();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('walks the list upwards from the end and wraps around', async () => {
    render(<Controlled />);
    const field = screen.getByRole('combobox', { name: 'Departamento' });

    await userEvent.click(field);
    await userEvent.keyboard('{ArrowUp}');
    expect(field).toHaveAttribute('aria-activedescendant', expect.stringMatching(/-2$/));

    await userEvent.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}');
    expect(field).toHaveAttribute('aria-activedescendant', expect.stringMatching(/-2$/));
  });

  it('says it is loading while the options have not arrived', async () => {
    render(
      <AzuosSuggestionTextField
        data={{ label: 'Cargo', name: 'role', value: '', options: [] }}
        state={{ isLoading: true }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    await userEvent.click(screen.getByRole('combobox', { name: 'Cargo' }));

    expect(screen.getByText('Carregando opções…')).toBeInTheDocument();
  });

  /* Enter sem opção ativa segue para o formulário: o campo não pode engolir o envio. */
  it('lets Enter reach the form when no option is active', async () => {
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Controlled />
      </form>,
    );

    await userEvent.click(screen.getByRole('combobox', { name: 'Departamento' }));
    await userEvent.keyboard('{Enter}');

    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('does nothing on the arrows and Escape when there is nothing to walk', async () => {
    render(<Controlled list={[]} />);
    const field = screen.getByRole('combobox', { name: 'Departamento' });

    await userEvent.click(field);
    await userEvent.keyboard('{ArrowDown}');
    expect(field).not.toHaveAttribute('aria-activedescendant');

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('does not open the list from the arrow while disabled', () => {
    render(
      <AzuosSuggestionTextField
        data={{ label: 'Cargo', name: 'role', value: '', options }}
        state={{ isDisabled: true }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Ver as opções de Cargo' })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'Cargo' })).toBeDisabled();
  });
});
