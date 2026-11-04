import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Label } from './label';

describe('Label', () => {
  // feliz
  it('labels the field it points to', () => {
    render(
      <>
        <Label htmlFor="name">Nome</Label>
        <input id="name" />
      </>,
    );

    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
    expect(screen.getByText('Nome')).toHaveAttribute('data-slot', 'label');
  });

  // triste
  it('keeps the extra class', () => {
    render(<Label className="sr-only">Oculto</Label>);

    expect(screen.getByText('Oculto').className).toContain('sr-only');
  });
});
