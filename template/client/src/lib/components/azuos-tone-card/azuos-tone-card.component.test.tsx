import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AzuosToneCard } from './azuos-tone-card.component';

describe('AzuosToneCard', () => {
  // feliz
  it('paints a static card with the soft tone background, never a colored border', () => {
    render(
      <AzuosToneCard data={{ label: 'Vencidos' }} ui={{ tone: 'danger' }}>
        3
      </AzuosToneCard>,
    );

    const card = screen.getByRole('group', { name: 'Vencidos' });
    expect(card).toHaveClass('bg-destructive-soft');
    expect(card.className).not.toMatch(/border-(destructive|primary|success|warning|info)/);
    expect(card).not.toHaveClass('hover-fill');
  });

  it('fills an interactive card with the tone when the mouse comes in', () => {
    render(
      <AzuosToneCard data={{ label: 'Em dia' }} ui={{ tone: 'success', mode: 'interactive' }}>
        8
      </AzuosToneCard>,
    );

    const card = screen.getByRole('group', { name: 'Em dia' });
    expect(card).toHaveClass('bg-card', 'hover-fill');
    expect(card.style.getPropertyValue('--fill-color')).toBe('var(--success-soft)');
    fireEvent.pointerEnter(card, { clientX: 4, clientY: 4 });

    expect(card.style.getPropertyValue('--fill-x')).toBe('4px');
  });

  it('turns the whole card into a button when it is clickable', async () => {
    const onClick = vi.fn();
    render(
      <AzuosToneCard data={{ label: 'Pendentes' }} ui={{ tone: 'warning', mode: 'interactive' }} actions={{ onClick }}>
        2
      </AzuosToneCard>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Pendentes' }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('marks the selected card with the full tone color', () => {
    render(
      <AzuosToneCard data={{ label: 'Todos' }} ui={{ tone: 'brand', mode: 'interactive' }} state={{ isSelected: true }}>
        12
      </AzuosToneCard>,
    );

    expect(screen.getByRole('group', { name: 'Todos' })).toHaveClass('bg-primary');
  });

  // triste
  it('keeps the static card still: no fill on hover', () => {
    render(
      <AzuosToneCard data={{ label: 'Parado' }} ui={{ tone: 'info' }}>
        1
      </AzuosToneCard>,
    );

    const card = screen.getByRole('group', { name: 'Parado' });
    fireEvent.pointerEnter(card, { clientX: 4, clientY: 4 });

    expect(card.style.getPropertyValue('--fill-x')).toBe('');
  });

  it('stays a plain neutral card without a tone', () => {
    render(<AzuosToneCard data={{ label: 'Neutro' }}>x</AzuosToneCard>);

    expect(screen.getByRole('group', { name: 'Neutro' })).toHaveClass('bg-card', 'border-border');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
