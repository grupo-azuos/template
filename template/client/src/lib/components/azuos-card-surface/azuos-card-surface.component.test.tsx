import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Building2 } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosCardSurface } from './azuos-card-surface.component';

describe('AzuosCardSurface', () => {
  // feliz
  it('sits on the brand surface, never a coloured background or border', () => {
    render(<AzuosCardSurface data={{ label: 'Empresa' }}>conteúdo</AzuosCardSurface>);

    const card = screen.getByRole('group', { name: 'Empresa' });
    expect(card).toHaveClass('bg-card', 'text-card-foreground');
    expect(card.className).not.toMatch(/border-(?!border)|bg-hue/);
  });

  /* O hover é um véu PARADO que cobre o card inteiro: a mancha que crescia do mouse saiu. */
  it('covers the whole card with a still veil that only shows on hover', () => {
    const { container } = render(
      <AzuosCardSurface data={{ label: 'Empresa' }}>x</AzuosCardSurface>,
    );
    const wash = container.querySelector('[data-slot="card-wash"]') as HTMLElement;

    expect(wash).toHaveClass('inset-0', 'group-hover/card:bg-(--card-veil)');
    expect(wash.className).not.toMatch(/rounded-full/);
  });

  it('paints the veil in the accent only when the flag is on', () => {
    const { container, rerender } = render(
      <AzuosCardSurface ui={{ hoverTone: 'red' }}>x</AzuosCardSurface>,
    );
    const wash = () => container.querySelector('[data-slot="card-wash"]') as HTMLElement;
    const veil = () => wash().style.getPropertyValue('--card-veil');
    expect(veil()).toContain('--hover-veil');

    rerender(
      <AzuosCardSurface ui={{ hoverTone: 'red', isHoverColored: true }}>x</AzuosCardSurface>,
    );
    expect(veil()).toContain('--hue-red');
  });

  it('draws the mark icon in the accent, and turns into a real button when clickable', async () => {
    const onClick = vi.fn();
    const { container } = render(
      <AzuosCardSurface
        data={{ label: 'Abrir' }}
        ui={{ mark: Building2, markTone: 'green' }}
        actions={{ onClick }}
      >
        x
      </AzuosCardSurface>,
    );

    expect(container.querySelector('[data-slot="card-mark"]')).toHaveClass('text-hue-green');
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('turns light blue with white text when selected', () => {
    render(
      <AzuosCardSurface data={{ label: 'Filtro' }} state={{ isSelected: true }}>
        x
      </AzuosCardSurface>,
    );

    const card = screen.getByRole('group', { name: 'Filtro' });
    expect(card).toHaveClass('bg-card-selected', 'text-on-card-selected');
    expect(card).toHaveAttribute('data-selected', 'true');
  });

  // triste
  it('is not a button without an action', () => {
    render(<AzuosCardSurface data={{ label: 'Parado' }}>x</AzuosCardSurface>);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
