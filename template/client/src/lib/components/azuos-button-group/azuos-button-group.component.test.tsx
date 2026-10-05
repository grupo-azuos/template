import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AzuosButtonGroup } from './azuos-button-group.component';

const PERIODS = [
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
];

describe('AzuosButtonGroup', () => {
  // feliz
  it('shows every option and names the group for a screen reader', () => {
    render(
      <AzuosButtonGroup data={{ options: PERIODS, value: 'week' }} ui={{ ariaLabel: 'Período' }} />,
    );

    expect(screen.getByRole('group', { name: 'Período' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  /* `aria-pressed`, e não só a cor: "preenchido de azul" não é informação que um leitor de tela
     consiga passar adiante. */
  it('marks the chosen option as pressed', () => {
    render(
      <AzuosButtonGroup data={{ options: PERIODS, value: 'week' }} ui={{ ariaLabel: 'Período' }} />,
    );

    expect(screen.getByRole('button', { name: 'Semana' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Dia' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('reports the value that was clicked', async () => {
    const onChange = vi.fn();
    render(
      <AzuosButtonGroup
        data={{ options: PERIODS, value: 'week' }}
        ui={{ ariaLabel: 'Período' }}
        actions={{ onChange }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Mês' }));

    expect(onChange).toHaveBeenCalledWith('month');
  });

  // triste
  /* Um valor que não está na lista chega de uma URL colada ou de um filtro salvo antigo. Marcar o
     primeiro botão seria mentir sobre o que está filtrando a tela. */
  it('marks nothing when the value is not among the options', () => {
    render(
      <AzuosButtonGroup data={{ options: PERIODS, value: 'year' }} ui={{ ariaLabel: 'Período' }} />,
    );

    for (const button of screen.getAllByRole('button')) {
      expect(button).toHaveAttribute('aria-pressed', 'false');
    }
  });

  it('does not report a change while disabled', async () => {
    const onChange = vi.fn();
    render(
      <AzuosButtonGroup
        data={{ options: PERIODS, value: 'day' }}
        ui={{ ariaLabel: 'Período' }}
        state={{ isDisabled: true }}
        actions={{ onChange }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Mês' }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('draws an empty group when there is no option, instead of breaking', () => {
    render(<AzuosButtonGroup data={{ options: [], value: '' }} ui={{ ariaLabel: 'Período' }} />);

    expect(screen.getByRole('group', { name: 'Período' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
