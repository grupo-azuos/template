import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { COMPANY_COLOR_PALETTE } from '../../utils/company-color.util';
import { AzuosColorSwatchField } from './azuos-color-swatch-field.component';

/* A paleta vem do `tokens.css`: o teste fala dela pela posição, nunca pelo hex. */
const [BLUE, , PURPLE] = COMPANY_COLOR_PALETTE;

describe('AzuosColorSwatchField', () => {
  it('marks "Aleatória" when there is no color', () => {
    render(<AzuosColorSwatchField data={{ value: '' }} actions={{ onChange: vi.fn() }} />);

    expect(screen.getByRole('radio', { name: /Aleatória/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('marks the palette color that is selected', () => {
    render(<AzuosColorSwatchField data={{ value: PURPLE.toUpperCase() }} actions={{ onChange: vi.fn() }} />);

    expect(screen.getByRole('radio', { name: `Cor ${PURPLE}` })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('radio', { name: /Aleatória/ })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('picks a palette color on click', () => {
    const onChange = vi.fn();
    render(<AzuosColorSwatchField data={{ value: '' }} actions={{ onChange }} />);

    fireEvent.click(screen.getByRole('radio', { name: `Cor ${BLUE}` }));

    expect(onChange).toHaveBeenCalledWith(BLUE);
  });

  it('goes back to random on click', () => {
    const onChange = vi.fn();
    render(<AzuosColorSwatchField data={{ value: BLUE }} actions={{ onChange }} />);

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

    const checked = screen
      .getAllByRole('radio')
      .filter((radio) => radio.getAttribute('aria-checked') === 'true');
    expect(checked).toHaveLength(0);
  });
});
