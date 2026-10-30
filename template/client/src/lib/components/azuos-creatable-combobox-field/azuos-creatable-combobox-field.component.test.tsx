import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  buildComboboxItems,
  AzuosCreatableComboboxField,
  type AzuosCreatableComboboxFieldProps,
} from './azuos-creatable-combobox-field.component';

function renderField(overrides: Partial<AzuosCreatableComboboxFieldProps> = {}) {
  const actions = { onChange: vi.fn(), onSearch: vi.fn(), onCreate: vi.fn() };

  render(
    <AzuosCreatableComboboxField
      data={{ value: '', options: ['Goiás', 'Goiânia'] }}
      ui={{ ariaLabel: 'Cidade', placeholder: 'Selecione...', searchPlaceholder: 'Buscar cidade...' }}
      actions={actions}
      {...overrides}
    />,
  );

  return actions;
}

/* `fireEvent`, como no teste do AzuosSelectField: o popover do Radix abre num portal, e o jsdom
   não resolve a geometria que o `userEvent` espera. */
function open() {
  fireEvent.click(screen.getByRole('combobox', { name: 'Cidade' }));
}

describe('buildComboboxItems', () => {
  it('offers to create what was typed when no option has the same key', () => {
    const items = buildComboboxItems({ term: 'Trindade', options: ['Goiás'], hasValue: false });

    expect(items.at(-1)).toEqual({ kind: 'create', label: 'Trindade' });
  });

  // triste
  it('does not offer to create a city that exists with another accent or case', () => {
    const items = buildComboboxItems({ term: 'GOIAS', options: ['Goiás'], hasValue: false });

    expect(items.some((item) => item.kind === 'create')).toBe(false);
  });

  it('does not offer to create while the search for the term has not come back', () => {
    const items = buildComboboxItems({
      term: 'Trindade',
      options: ['Goiás'],
      hasValue: false,
      isLoading: true,
    });

    expect(items.some((item) => item.kind === 'create')).toBe(false);
  });

  it('does not offer to create a blank term', () => {
    expect(buildComboboxItems({ term: '   ', options: [], hasValue: false })).toEqual([]);
  });

  it('collapses repeated spaces in the name it offers to create', () => {
    const items = buildComboboxItems({ term: ' Aparecida   de Goiânia ', options: [], hasValue: false });

    expect(items).toEqual([{ kind: 'create', label: 'Aparecida de Goiânia' }]);
  });

  it('offers to clear only when there is a value and a clear label', () => {
    expect(
      buildComboboxItems({ term: '', options: [], hasValue: true, clearLabel: 'Sem cidade' }),
    ).toEqual([{ kind: 'clear', label: 'Sem cidade' }]);
    expect(buildComboboxItems({ term: '', options: [], hasValue: false, clearLabel: 'Sem cidade' })).toEqual(
      [],
    );
  });
});

describe('AzuosCreatableComboboxField', () => {
  it('shows the placeholder when empty and the value when filled', () => {
    renderField({ data: { value: 'Goiás', options: [] } });

    expect(screen.getByRole('combobox', { name: 'Cidade' })).toHaveTextContent('Goiás');
  });

  it('searches from scratch when it opens', () => {
    const actions = renderField();
    open();

    expect(actions.onSearch).toHaveBeenCalledWith('');
    expect(screen.getByRole('option', { name: /Goiânia/ })).toBeInTheDocument();
  });

  it('passes each typed term to the search', () => {
    const actions = renderField();
    open();

    fireEvent.change(screen.getByPlaceholderText('Buscar cidade...'), { target: { value: 'goi' } });

    expect(actions.onSearch).toHaveBeenLastCalledWith('goi');
  });

  it('chooses an option on click', () => {
    const actions = renderField();
    open();

    fireEvent.click(screen.getByRole('option', { name: /Goiânia/ }));

    expect(actions.onChange).toHaveBeenCalledWith('Goiânia');
  });

  it('creates the typed city when it is not in the list', () => {
    const actions = renderField({ data: { value: '', options: [] } });
    open();

    fireEvent.change(screen.getByPlaceholderText('Buscar cidade...'), {
      target: { value: 'Trindade' },
    });
    fireEvent.click(screen.getByRole('option', { name: /Cadastrar “Trindade”/ }));

    expect(actions.onCreate).toHaveBeenCalledWith('Trindade');
    expect(actions.onChange).not.toHaveBeenCalled();
  });

  it('moves with the arrows and chooses with Enter', () => {
    const actions = renderField();
    open();
    const input = screen.getByPlaceholderText('Buscar cidade...');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(actions.onChange).toHaveBeenCalledWith('Goiânia');
  });

  // triste
  it('does nothing on Enter when the list is empty', () => {
    const actions = renderField({ data: { value: '', options: [] } });
    open();

    fireEvent.keyDown(screen.getByPlaceholderText('Buscar cidade...'), { key: 'Enter' });

    expect(actions.onChange).not.toHaveBeenCalled();
    expect(actions.onCreate).not.toHaveBeenCalled();
  });

  it('does not open when disabled', () => {
    const actions = renderField({ state: { isDisabled: true } });
    open();

    expect(actions.onSearch).not.toHaveBeenCalled();
  });
});
