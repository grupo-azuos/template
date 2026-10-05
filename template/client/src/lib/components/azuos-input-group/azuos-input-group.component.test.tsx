import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AzuosInputGroup } from './azuos-input-group.component';

describe('AzuosInputGroup', () => {
  // feliz
  it('ties the label to the input, so clicking the label focuses the field', async () => {
    render(<AzuosInputGroup data={{ label: 'Orçamento', name: 'budget', value: '' }} />);

    await userEvent.click(screen.getByText('Orçamento'));

    expect(screen.getByLabelText('Orçamento')).toHaveFocus();
  });

  it('reports what was typed', async () => {
    const onChange = vi.fn();
    render(
      <AzuosInputGroup
        data={{ label: 'Peso', name: 'weight', value: '' }}
        actions={{ onChange }}
      />,
    );

    await userEvent.type(screen.getByLabelText('Peso'), '7');

    expect(onChange).toHaveBeenCalledWith('7');
  });

  it('shows the prefix and the suffix around the field', () => {
    render(
      <AzuosInputGroup
        data={{ label: 'Meta', name: 'goal', value: '10' }}
        prefix={<span>R$</span>}
        suffix={<span>/mês</span>}
      />,
    );

    expect(screen.getByText('R$')).toBeInTheDocument();
    expect(screen.getByText('/mês')).toBeInTheDocument();
  });

  // triste
  /* O erro tem de ser ANUNCIADO, e não só pintado: sem `role="alert"` e `aria-describedby`, a
     mensagem existe na tela e não existe para quem não a vê. */
  it('announces the error and points the field at it', () => {
    render(
      <AzuosInputGroup
        data={{ label: 'Orçamento', name: 'budget', value: 'abc' }}
        state={{ error: 'Informe um número.' }}
      />,
    );

    const field = screen.getByLabelText('Orçamento');

    expect(screen.getByRole('alert')).toHaveTextContent('Informe um número.');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAttribute('aria-describedby', screen.getByRole('alert').id);
  });

  it('draws no error line when there is no error', () => {
    render(<AzuosInputGroup data={{ label: 'Peso', name: 'weight', value: '12' }} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Peso')).toHaveAttribute('aria-invalid', 'false');
  });

  it('does not report a change while disabled', async () => {
    const onChange = vi.fn();
    render(
      <AzuosInputGroup
        data={{ label: 'Peso', name: 'weight', value: '' }}
        state={{ isDisabled: true }}
        actions={{ onChange }}
      />,
    );

    await userEvent.type(screen.getByLabelText('Peso'), '7');

    expect(onChange).not.toHaveBeenCalled();
  });
});
