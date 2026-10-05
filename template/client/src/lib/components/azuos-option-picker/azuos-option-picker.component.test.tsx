import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AzuosOptionPicker } from './azuos-option-picker.component';

const STATUS = [
  { value: 'todo', label: 'A fazer', tone: 'neutral' as const },
  { value: 'in_progress', label: 'Em andamento', tone: 'info' as const },
  { value: 'done', label: 'Concluída', tone: 'success' as const },
];

const MANY = Array.from({ length: 10 }, (_, index) => ({
  value: 'dept-' + index,
  label: 'Departamento ' + (index + 1),
}));

describe('AzuosOptionPicker com poucas opções', () => {
  // feliz
  it('draws a pill per option, so the person compares without opening anything', () => {
    render(
      <AzuosOptionPicker
        data={{ value: 'todo', options: STATUS }}
        ui={{ ariaLabel: 'Situação' }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    expect(screen.getByRole('group', { name: 'Situação' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('marks the chosen pill as pressed, not only coloured', () => {
    render(
      <AzuosOptionPicker
        data={{ value: 'done', options: STATUS }}
        ui={{ ariaLabel: 'Situação' }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Concluída' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('prefixes the "all" option, which stands for the empty value', async () => {
    const onChange = vi.fn();
    render(
      <AzuosOptionPicker
        data={{ value: 'todo', options: STATUS }}
        ui={{ ariaLabel: 'Situação', allLabel: 'Todas' }}
        actions={{ onChange }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Todas' }));

    expect(onChange).toHaveBeenCalledWith('');
  });

  // triste
  it('does not report a change while disabled', async () => {
    const onChange = vi.fn();
    render(
      <AzuosOptionPicker
        data={{ value: 'todo', options: STATUS }}
        ui={{ ariaLabel: 'Situação' }}
        state={{ isDisabled: true }}
        actions={{ onChange }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Concluída' }));

    expect(onChange).not.toHaveBeenCalled();
  });

  /* Um valor que não está na lista chega de uma URL colada ou de um filtro salvo antigo. */
  it('marks nothing when the value is not among the options', () => {
    render(
      <AzuosOptionPicker
        data={{ value: 'archived', options: STATUS }}
        ui={{ ariaLabel: 'Situação' }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    for (const button of screen.getAllByRole('button')) {
      expect(button).toHaveAttribute('aria-pressed', 'false');
    }
  });
});

describe('AzuosOptionPicker com muitas opções', () => {
  // feliz
  /* Acima do limite, pastilha lado a lado viraria uma parede de botões: vira a lista com busca. */
  it('becomes a single button that opens a list', () => {
    render(
      <AzuosOptionPicker
        data={{ value: 'dept-0', options: MANY }}
        ui={{ ariaLabel: 'Departamento' }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Departamento/ })).toBeInTheDocument();
  });

  it('filters the list by what was typed', async () => {
    render(
      <AzuosOptionPicker
        data={{ value: 'dept-0', options: MANY }}
        ui={{ ariaLabel: 'Departamento' }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /Departamento/ }));
    await userEvent.type(screen.getByLabelText('Buscar nas opções'), '10');

    expect(screen.getByRole('button', { name: 'Departamento 10' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Departamento 3' })).not.toBeInTheDocument();
  });

  it('reports the option that was picked', async () => {
    const onChange = vi.fn();
    render(
      <AzuosOptionPicker
        data={{ value: 'dept-0', options: MANY }}
        ui={{ ariaLabel: 'Departamento' }}
        actions={{ onChange }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /Departamento/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Departamento 4' }));

    expect(onChange).toHaveBeenCalledWith('dept-3');
  });

  // triste
  /* Busca sem resultado tem de dizer isso: uma lista vazia e silenciosa parece defeito. */
  it('says nothing was found instead of showing an empty list', async () => {
    render(
      <AzuosOptionPicker
        data={{ value: 'dept-0', options: MANY }}
        ui={{ ariaLabel: 'Departamento' }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /Departamento/ }));
    await userEvent.type(screen.getByLabelText('Buscar nas opções'), 'jurídico');

    expect(screen.getByText('Nada encontrado.')).toBeInTheDocument();
  });
});
