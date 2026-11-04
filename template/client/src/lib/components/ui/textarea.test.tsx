import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Textarea } from './textarea';

describe('Textarea', () => {
  // feliz
  it('reports what is typed', () => {
    const onChange = vi.fn();
    render(<Textarea aria-label="Observações" onChange={onChange} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Observações' }), {
      target: { value: 'ok' },
    });

    expect(onChange).toHaveBeenCalled();
    expect(screen.getByRole('textbox')).toHaveAttribute('data-slot', 'textarea');
  });

  // triste
  it('marks itself invalid for the styles when the form says so', () => {
    render(<Textarea aria-label="x" aria-invalid className="h-40" />);

    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('textbox').className).toContain('h-40');
  });
});
