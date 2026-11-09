import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosPersonMultiPickerField } from './azuos-person-multi-picker-field.component';

const PEOPLE = [
  { id: 'u-ana', name: 'Ana Souza', photo: null },
  { id: 'u-bia', name: 'Bia Marques', photo: null },
  { id: 'u-caio', name: 'Caio Ribeiro', photo: null },
];

describe('AzuosPersonMultiPickerField', () => {
  // feliz
  it('names up to two people and counts from the third', () => {
    const { rerender } = render(
      <AzuosPersonMultiPickerField
        data={{ values: ['u-ana', 'u-bia'], people: PEOPLE }}
        ui={{ ariaLabel: 'Envolvidos' }}
        actions={{ onChange: vi.fn() }}
      />,
    );
    expect(screen.getByRole('button', { name: /Envolvidos/ })).toHaveTextContent(
      'Ana Souza, Bia Marques',
    );

    rerender(
      <AzuosPersonMultiPickerField
        data={{ values: ['u-ana', 'u-bia', 'u-caio'], people: PEOPLE }}
        ui={{ ariaLabel: 'Envolvidos' }}
        actions={{ onChange: vi.fn() }}
      />,
    );
    expect(screen.getByRole('button', { name: /Envolvidos/ })).toHaveTextContent('3 pessoas');
  });

  // triste
  it('says nobody is chosen yet', () => {
    render(
      <AzuosPersonMultiPickerField
        data={{ values: [], people: PEOPLE }}
        ui={{ ariaLabel: 'Envolvidos' }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Envolvidos/ }));

    expect(screen.getAllByText('Escolha as pessoas').length).toBeGreaterThan(0);
  });
});
