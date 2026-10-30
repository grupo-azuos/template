import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosSliderField } from './azuos-slider-field.component';

const data = { label: 'Zoom', value: 2, min: 1, max: 4, step: 1 };

describe('AzuosSliderField', () => {
  /* O motivo de o primitivo existir: a alça do shadcn não tinha nome para o leitor de tela. */
  it('names the thumb and reports the current value', () => {
    render(<AzuosSliderField data={data} />);

    const thumb = screen.getByRole('slider', { name: 'Zoom' });

    expect(thumb).toHaveAttribute('aria-valuenow', '2');
    expect(thumb).toHaveAttribute('aria-valuemin', '1');
    expect(thumb).toHaveAttribute('aria-valuemax', '4');
  });

  it('changes the value with the keyboard', () => {
    const onChange = vi.fn();
    render(<AzuosSliderField data={data} actions={{ onChange }} />);

    fireEvent.keyDown(screen.getByRole('slider', { name: 'Zoom' }), { key: 'ArrowRight' });

    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('does not change when disabled', () => {
    const onChange = vi.fn();
    render(<AzuosSliderField data={data} state={{ isDisabled: true }} actions={{ onChange }} />);

    fireEvent.keyDown(screen.getByRole('slider', { name: 'Zoom' }), { key: 'ArrowRight' });

    expect(onChange).not.toHaveBeenCalled();
  });
});
