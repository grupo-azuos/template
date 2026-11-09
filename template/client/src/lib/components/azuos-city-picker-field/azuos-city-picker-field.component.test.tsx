import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  AzuosCityPickerField,
  type AzuosCityPickerFieldProps,
} from './azuos-city-picker-field.component';

const states = [
  { abbreviation: 'GO', name: 'Goiás' },
  { abbreviation: 'SP', name: 'São Paulo' },
];

const cities = [
  { id: '00000000-0000-8000-8000-000000000007', name: 'Goiânia', state: 'GO' },
  { id: '00000000-0000-8000-8000-000000000034', name: 'Anápolis', state: 'GO' },
];

function renderField(
  data: Partial<AzuosCityPickerFieldProps['data']> = {},
  actionsOverrides: Partial<AzuosCityPickerFieldProps['actions']> = {},
) {
  const onChange = vi.fn();
  const onStateChange = vi.fn();

  render(
    <AzuosCityPickerField
      data={{ state: 'GO', value: null, states, cities, inheritedCity: 'Goiânia', ...data }}
      actions={{ onStateChange, onChange, ...actionsOverrides }}
    />,
  );

  return { onChange, onStateChange };
}

/* `fireEvent`, como no AzuosComboboxField: o popover do Radix abre num portal, e o `userEvent`
   fica preso esperando geometria que o jsdom não calcula. */
function open(name = 'Cidade do alvará') {
  fireEvent.click(screen.getByRole('combobox', { name }));
}

describe('AzuosCityPickerField', () => {
  // feliz
  it('says which city is inherited', () => {
    renderField();

    expect(screen.getByRole('combobox', { name: 'Cidade do alvará' })).toHaveTextContent(
      'Mesma da empresa (Goiânia)',
    );
  });

  // feliz
  it('tells the caller the chosen state, to load its municipalities', () => {
    const { onStateChange } = renderField();

    open('UF — Cidade do alvará');
    fireEvent.click(screen.getByRole('option', { name: 'SP' }));

    expect(onStateChange).toHaveBeenCalledWith('SP');
  });

  // feliz
  it('returns the ID of the chosen municipality', () => {
    const { onChange } = renderField();

    open();
    fireEvent.click(screen.getByRole('option', { name: 'Anápolis' }));

    expect(onChange).toHaveBeenCalledWith('00000000-0000-8000-8000-000000000034');
  });

  // feliz
  it('returns null when going back to "mesma da empresa"', () => {
    const { onChange } = renderField({ value: '00000000-0000-8000-8000-000000000034' });

    open();
    fireEvent.click(screen.getByRole('option', { name: 'Mesma da empresa (Goiânia)' }));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  // feliz
  it('returns null for "Todas as cidades" in a filter', () => {
    const { onChange } = renderField({
      value: '00000000-0000-8000-8000-000000000007',
      inheritedCity: undefined,
      allLabel: 'Todas as cidades',
    });

    open();
    fireEvent.click(screen.getByRole('option', { name: 'Todas as cidades' }));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  // feliz
  it('returns an empty state for "Todas as UFs" in a filter — it removes the slice', () => {
    const { onStateChange } = renderField({
      inheritedCity: undefined,
      allLabel: 'Todas as cidades',
      allStatesLabel: 'Todas as UFs',
    });

    open('UF — Cidade do alvará');
    fireEvent.click(screen.getByRole('option', { name: 'Todas as UFs' }));

    expect(onStateChange).toHaveBeenCalledWith('');
  });

  // triste
  it('has no "all" state option outside a filter: the registry requires one', () => {
    renderField();

    open('UF — Cidade do alvará');

    expect(screen.queryByRole('option', { name: 'Todas as UFs' })).not.toBeInTheDocument();
  });

  // triste
  it('shows the stored city even when the registry did not return it', () => {
    renderField({
      value: '00000000-0000-8000-8000-00000000005a',
      cities: [],
      current: { id: '00000000-0000-8000-8000-00000000005a', name: 'Município 90' },
    });

    expect(screen.getByRole('combobox', { name: 'Cidade do alvará' })).toHaveTextContent(
      'Município 90',
    );
  });

  // triste
  it('invents no city in the label for a company without one', () => {
    renderField({ inheritedCity: null });

    expect(screen.getByRole('combobox', { name: 'Cidade do alvará' })).toHaveTextContent(
      /^Mesma da empresa$/,
    );
  });

  // triste
  it('locks the city until a state is chosen when there is no "none" option', () => {
    renderField({ state: null, cities: [], inheritedCity: undefined });

    const city = screen.getByRole('combobox', { name: 'Cidade do alvará' });
    expect(city).toBeDisabled();
    expect(city).toHaveTextContent('Escolha a UF primeiro');
  });

  // triste
  it('never offers to add a city: states and cities come from the shared registry', () => {
    renderField({
      state: 'MG',
      cities: [{ id: '00000000-0000-8000-8000-000000000001', name: 'Belo Horizonte', state: 'MG' }],
    });

    open();
    fireEvent.change(screen.getByPlaceholderText('Buscar município...'), {
      target: { value: 'Uberlândia' },
    });

    expect(screen.queryByRole('option', { name: /Adicionar município/ })).not.toBeInTheDocument();
  });
});
