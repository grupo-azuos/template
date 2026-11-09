import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosPersonPickerField } from './azuos-person-picker-field.component';

const PEOPLE = [
  { id: 'u-ana', name: 'Ana Souza', photo: null },
  { id: 'u-bia', name: 'Bia Marques', photo: 'https://foto/bia.png' },
];

describe('AzuosPersonPickerField', () => {
  // feliz
  it('shows the chosen person by name and sends the id of the next one', async () => {
    const onChange = vi.fn();
    render(
      <AzuosPersonPickerField
        data={{ value: 'u-ana', people: PEOPLE }}
        ui={{ ariaLabel: 'Responsável' }}
        actions={{ onChange }}
      />,
    );

    const field = screen.getByRole('combobox', { name: 'Responsável' });
    expect(field).toHaveTextContent('Ana Souza');
    fireEvent.click(field);
    fireEvent.click(await screen.findByRole('option', { name: /Bia Marques/ }));

    expect(onChange).toHaveBeenCalledWith('u-bia');
  });

  // feliz
  it('puts the leading options before the people', async () => {
    render(
      <AzuosPersonPickerField
        data={{ value: '', people: PEOPLE, leading: [{ value: '@me', label: 'Eu' }] }}
        ui={{ ariaLabel: 'Pessoa' }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    fireEvent.click(screen.getByRole('combobox', { name: 'Pessoa' }));
    const options = await screen.findAllByRole('option');

    expect(options[0]).toHaveTextContent('Eu');
  });

  // triste
  it('never offers a free text box', () => {
    render(
      <AzuosPersonPickerField
        data={{ value: '', people: [] }}
        ui={{ ariaLabel: 'Responsável' }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    expect(screen.queryByRole('textbox', { name: 'Responsável' })).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Responsável' })).toHaveTextContent(
      'Escolha a pessoa',
    );
  });
});
