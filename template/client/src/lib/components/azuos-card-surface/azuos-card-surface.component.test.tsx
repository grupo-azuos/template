import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import gsap from 'gsap';
import { Building2 } from 'lucide-react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AzuosCardSurface } from './azuos-card-surface.component';

afterEach(() => vi.restoreAllMocks());

describe('AzuosCardSurface', () => {
  // feliz
  it('sits on the brand surface, never a coloured background or border', () => {
    render(<AzuosCardSurface data={{ label: 'Empresa' }}>conteúdo</AzuosCardSurface>);

    const card = screen.getByRole('group', { name: 'Empresa' });
    expect(card).toHaveClass('bg-card', 'text-card-foreground');
    expect(card.className).not.toMatch(/border-(?!border)|bg-hue/);
  });

  it('grows the wash from the pointer with GSAP on hover, and shrinks it on leave', () => {
    const fromTo = vi.spyOn(gsap, 'fromTo');
    const to = vi.spyOn(gsap, 'to');
    render(<AzuosCardSurface data={{ label: 'Empresa' }}>x</AzuosCardSurface>);
    const card = screen.getByRole('group', { name: 'Empresa' });

    fireEvent.pointerEnter(card, { clientX: 5, clientY: 5 });
    expect(fromTo).toHaveBeenCalledOnce();
    fireEvent.pointerLeave(card, { clientX: 5, clientY: 5 });
    expect(to).toHaveBeenCalledOnce();
  });

  it('paints the wash in the accent only when the flag is on', () => {
    const { container, rerender } = render(
      <AzuosCardSurface ui={{ hoverTone: 'red' }}>x</AzuosCardSurface>,
    );
    const wash = () => container.querySelector('[data-slot="card-wash"]') as HTMLElement;
    expect(wash().style.backgroundColor).toContain('--foreground');

    rerender(
      <AzuosCardSurface ui={{ hoverTone: 'red', isHoverColored: true }}>x</AzuosCardSurface>,
    );
    expect(wash().style.backgroundColor).toContain('--hue-red');
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
  it('skips the growth when motion is reduced, and is not a button without an action', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    const fromTo = vi.spyOn(gsap, 'fromTo');
    render(<AzuosCardSurface data={{ label: 'Parado' }}>x</AzuosCardSurface>);
    const card = screen.getByRole('group', { name: 'Parado' });

    fireEvent.pointerEnter(card, { clientX: 1, clientY: 1 });
    fireEvent.pointerLeave(card, { clientX: 1, clientY: 1 });

    expect(fromTo).not.toHaveBeenCalled();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
