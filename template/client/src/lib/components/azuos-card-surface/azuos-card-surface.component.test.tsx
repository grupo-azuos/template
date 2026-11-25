import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  /* O card não se mexe no hover: nem sobe, nem muda a sombra, nem ganha véu ou ícone no canto. */
  it('stays still on hover, and turns into a real button when clickable', async () => {
    const onClick = vi.fn();
    const { container } = render(
      <AzuosCardSurface data={{ label: 'Abrir empresa' }} actions={{ onClick }}>
        x
      </AzuosCardSurface>,
    );

    const card = screen.getByRole('group', { name: 'Abrir empresa' });
    expect(card).toHaveClass('cursor-pointer');
    expect(card.className).not.toMatch(/hover:|translate|transition|duration|shadow-card-hover/);
    expect(container.querySelector('[data-slot="card-wash"]')).toBeNull();
    expect(container.querySelector('[data-slot="card-mark"]')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Abrir empresa' }));
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
