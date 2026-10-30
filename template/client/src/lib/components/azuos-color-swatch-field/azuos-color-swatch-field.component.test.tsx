import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosColorSwatchField } from './azuos-color-swatch-field.component';

describe('AzuosColorSwatchField', () => {
  it('marks "Aleatória" when there is no color', () => {
    render(<AzuosColorSwatchField data={{ value: '' }} actions={{ onChange: vi.fn() }} />);

    expect(screen.getByRole('radio', { name: /Aleatória/ })).toHaveAttribute('aria-checked', 'true');
  });

  it('marks the palette color that is selected', () => {
    render(<AzuosColorSwatchField data={{ value: '#7C3AED' }} actions={{ onChange: vi.fn() }} />);

    expect(screen.getByRole('radio', { name: 'Cor #7c3aed' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /Aleatória/ })).toHaveAttribute('aria-checked', 'false');
  });

  it('picks a palette color on click', () => {
    const onChange = vi.fn();
    render(<AzuosColorSwatchField data={{ value: '' }} actions={{ onChange }} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Cor #2563eb' }));

    expect(onChange).toHaveBeenCalledWith('#2563eb');
  });

  it('goes back to random on click', () => {
    const onChange = vi.fn();
    render(<AzuosColorSwatchField data={{ value: '#2563eb' }} actions={{ onChange }} />);

    fireEvent.click(screen.getByRole('radio', { name: /Aleatória/ }));

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('passes a free color in lower case', () => {
    const onChange = vi.fn();
    render(<AzuosColorSwatchField data={{ value: '' }} actions={{ onChange }} />);

    fireEvent.change(screen.getByLabelText('Outra cor'), { target: { value: '#0F766E' } });

    expect(onChange).toHaveBeenCalledWith('#0f766e');
  });

  // triste
  it('does not mark any palette color for a free color', () => {
    render(<AzuosColorSwatchField data={{ value: '#0f766e' }} actions={{ onChange: vi.fn() }} />);

    const checked = screen.getAllByRole('radio').filter((radio) => radio.getAttribute('aria-checked') === 'true');
    expect(checked).toHaveLength(0);
  });
});
