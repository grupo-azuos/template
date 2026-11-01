import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AzuosSegmentedControl } from './azuos-segmented-control.component';

const options = [
  { value: 'all', label: 'Todas as empresas' },
  { value: 'concluded', label: 'Ano em dia' },
];

describe('AzuosSegmentedControl', () => {
  // feliz
  it('tells which option is on', () => {
    render(
      <AzuosSegmentedControl
        data={{ value: 'all', options }}
        ui={{ ariaLabel: 'Recorte' }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    expect(screen.getByRole('group', { name: 'Recorte' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Todas as empresas' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Ano em dia' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('reports the chosen option', async () => {
    const onChange = vi.fn();
    render(
      <AzuosSegmentedControl
        data={{ value: 'all', options }}
        ui={{ ariaLabel: 'Recorte' }}
        actions={{ onChange }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Ano em dia' }));

    expect(onChange).toHaveBeenCalledWith('concluded');
  });

  // triste
  it('does not report the option that is already on', async () => {
    const onChange = vi.fn();
    render(
      <AzuosSegmentedControl
        data={{ value: 'all', options }}
        ui={{ ariaLabel: 'Recorte' }}
        actions={{ onChange }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Todas as empresas' }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not change when disabled', async () => {
    const onChange = vi.fn();
    render(
      <AzuosSegmentedControl
        data={{ value: 'all', options }}
        ui={{ ariaLabel: 'Recorte' }}
        state={{ isDisabled: true }}
        actions={{ onChange }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Ano em dia' }));

    expect(onChange).not.toHaveBeenCalled();
  });

  // feliz
  /* A variante grande dos painéis: pílulas cheias, lado a lado, sem a bandeja cinza por trás. */
  it('draws the prominent variant with filled pills', () => {
    render(
      <AzuosSegmentedControl
        data={{ value: 'all', options }}
        ui={{ ariaLabel: 'Recorte', variant: 'prominent', className: 'mt-2' }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    const group = screen.getByRole('group', { name: 'Recorte' });
    expect(group.className).toContain('bg-transparent');
    expect(group.className).toContain('mt-2');
    expect(screen.getByRole('button', { name: 'Todas as empresas' }).className).toContain('bg-primary ');
    expect(screen.getByRole('button', { name: 'Ano em dia' }).className).toContain('bg-primary/10');
  });
});
