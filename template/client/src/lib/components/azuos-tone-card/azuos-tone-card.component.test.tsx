import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AzuosToneCard } from './azuos-tone-card.component';

describe('AzuosToneCard', () => {
  // feliz
  it('paints a static card with the pastel of its hue, never a full colour or a coloured border', () => {
    render(
      <AzuosToneCard data={{ label: 'Vencidos' }} ui={{ tone: 'danger' }}>
        3
      </AzuosToneCard>,
    );

    const card = screen.getByRole('group', { name: 'Vencidos' });
    expect(card).toHaveClass('bg-tone-red-surface', 'text-tone-red-text');
    expect(card.className).not.toMatch(/border-|-fill|\/\d/);
    expect(card).not.toHaveClass('hover:bg-tone-red-hover');
  });

  it('lightens an interactive card on hover, instead of darkening it', () => {
    render(
      <AzuosToneCard data={{ label: 'Em dia' }} ui={{ tone: 'success', mode: 'interactive' }}>
        8
      </AzuosToneCard>,
    );

    expect(screen.getByRole('group', { name: 'Em dia' })).toHaveClass(
      'bg-tone-emerald-surface',
      'hover:bg-tone-emerald-hover',
      'hover:shadow-xl',
    );
  });

  it('accepts a hue by name, as well as a state name', () => {
    render(
      <AzuosToneCard data={{ label: 'Revisões' }} ui={{ tone: 'violet' }}>
        6
      </AzuosToneCard>,
    );

    expect(screen.getByRole('group', { name: 'Revisões' })).toHaveClass('bg-tone-violet-surface');
  });

  it('turns the whole card into a button when it is clickable', async () => {
    const onClick = vi.fn();
    render(
      <AzuosToneCard
        data={{ label: 'Pendentes' }}
        ui={{ tone: 'warning', mode: 'interactive' }}
        actions={{ onClick }}
      >
        2
      </AzuosToneCard>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Pendentes' }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('marks the selected card with the middle pastel of its hue', () => {
    render(
      <AzuosToneCard
        data={{ label: 'Todos' }}
        ui={{ tone: 'brand', mode: 'interactive' }}
        state={{ isSelected: true }}
      >
        12
      </AzuosToneCard>,
    );

    const card = screen.getByRole('group', { name: 'Todos' });
    expect(card).toHaveClass('bg-tone-indigo-chip', 'text-tone-indigo-text');
    expect(card).toHaveAttribute('data-selected', 'true');
  });

  // triste
  it('falls back to the gray hue without a tone, and is not a button without an action', () => {
    render(<AzuosToneCard data={{ label: 'Neutro' }}>x</AzuosToneCard>);

    expect(screen.getByRole('group', { name: 'Neutro' })).toHaveClass('bg-tone-gray-surface');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
