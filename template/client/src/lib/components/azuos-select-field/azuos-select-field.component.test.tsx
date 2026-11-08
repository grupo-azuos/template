import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AzuosSelectField } from './azuos-select-field.component';

const owners = [
  { value: '', label: 'Todos os responsáveis' },
  { value: 'Ana', label: 'Ana' },
  { value: 'Bia', label: 'Bia' },
];

describe('AzuosSelectField', () => {
  // feliz
  it('shows the selected option label', () => {
    render(
      <AzuosSelectField
        data={{ value: 'Ana', options: owners }}
        ui={{ ariaLabel: 'Responsável' }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    expect(screen.getByRole('combobox', { name: 'Responsável' })).toHaveTextContent('Ana');
  });

  /* `fireEvent`, não `userEvent`, para abrir e escolher: o jsdom não calcula layout de
     verdade, e o `userEvent.click` do Select do Radix — que abre num portal, fora da
     árvore do componente — fica preso esperando um estado de "visível" que o jsdom nunca
     resolve. `fireEvent` dispara o evento direto, sem essa checagem de geometria. */

  // feliz
  it('calls onChange with the chosen option value', async () => {
    const onChange = vi.fn();

    render(
      <AzuosSelectField
        data={{ value: '', options: owners }}
        ui={{ ariaLabel: 'Responsável', placeholder: 'Todos os responsáveis' }}
        actions={{ onChange }}
      />,
    );

    fireEvent.click(screen.getByRole('combobox', { name: 'Responsável' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Ana' }));

    expect(onChange).toHaveBeenCalledWith('Ana');
  });

  // triste
  it('returns an empty string for the empty option, not the internal sentinel', async () => {
    const onChange = vi.fn();

    render(
      <AzuosSelectField
        data={{ value: 'Ana', options: owners }}
        ui={{ ariaLabel: 'Responsável' }}
        actions={{ onChange }}
      />,
    );

    fireEvent.click(screen.getByRole('combobox', { name: 'Responsável' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Todos os responsáveis' }));

    expect(onChange).toHaveBeenCalledWith('');
  });

  // triste
  it('does not open the menu while disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <AzuosSelectField
        data={{ value: '', options: owners }}
        ui={{ ariaLabel: 'Responsável' }}
        state={{ isDisabled: true }}
        actions={{ onChange }}
      />,
    );

    const trigger = screen.getByRole('combobox', { name: 'Responsável' });
    expect(trigger).toBeDisabled();

    await user.click(trigger);
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });
});

describe('AzuosSelectField with people', () => {
  // feliz
  it('shows the initials next to the name of the chosen person', () => {
    render(
      <AzuosSelectField
        data={{
          value: 'ana',
          options: [{ value: 'ana', label: 'Ana Souza', personName: 'Ana Souza', avatarUrl: null }],
        }}
        ui={{ ariaLabel: 'Responsável' }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    const trigger = screen.getByRole('combobox', { name: 'Responsável' });
    expect(trigger).toHaveTextContent('AS');
    expect(trigger).toHaveTextContent('Ana Souza');
  });

  // triste
  it('draws no avatar for an option that is not a person', () => {
    render(
      <AzuosSelectField
        data={{ value: 'Ana', options: owners }}
        ui={{ ariaLabel: 'Responsável' }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    expect(document.querySelector('[data-slot="avatar"]')).toBeNull();
  });
});
