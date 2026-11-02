import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosCheckboxField } from './azuos-checkbox-field.component';

describe('AzuosCheckboxField', () => {
  // feliz
  it('reports the new value when the label is clicked', () => {
    const onChange = vi.fn();
    render(
      <AzuosCheckboxField
        data={{
          label: 'Simples Nacional',
          name: 'regime',
          isChecked: false,
          description: 'Até R$ 4,8 mi',
        }}
        actions={{ onChange }}
      />,
    );

    fireEvent.click(screen.getByText('Simples Nacional'));

    expect(onChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('checkbox', { name: 'Simples Nacional' })).toHaveAccessibleDescription(
      'Até R$ 4,8 mi',
    );
  });

  // feliz
  it('unchecks a checked box', () => {
    const onChange = vi.fn();
    render(
      <AzuosCheckboxField
        data={{ label: 'Ativo', name: 'active', isChecked: true }}
        actions={{ onChange }}
      />,
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Ativo' }));

    expect(onChange).toHaveBeenCalledWith(false);
  });

  // triste
  it('does not change while disabled', () => {
    const onChange = vi.fn();
    render(
      <AzuosCheckboxField
        data={{ label: 'Ativo', name: 'active', isChecked: false }}
        state={{ isDisabled: true }}
        actions={{ onChange }}
      />,
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Ativo' }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('checkbox', { name: 'Ativo' })).toBeDisabled();
  });
});
