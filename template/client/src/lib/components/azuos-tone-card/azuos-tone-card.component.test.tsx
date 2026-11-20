import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AzuosToneCard } from './azuos-tone-card.component';

describe('AzuosToneCard', () => {
  // feliz
  it('sits on the brand surface whatever the tone, never a coloured background', () => {
    render(
      <AzuosToneCard data={{ label: 'Vencidos' }} ui={{ tone: 'danger' }}>
        3
      </AzuosToneCard>,
    );

    const card = screen.getByRole('group', { name: 'Vencidos' });
    expect(card).toHaveClass('bg-card');
    expect(card.className).not.toMatch(/bg-hue|border-(?!border)|-fill/);
  });

  it('colours the hover wash with its tone when interactive', () => {
    const { container } = render(
      <AzuosToneCard data={{ label: 'Em dia' }} ui={{ tone: 'success', mode: 'interactive' }}>
        8
      </AzuosToneCard>,
    );

    const wash = container.querySelector('[data-slot="card-wash"]') as HTMLElement;
    expect(wash.style.getPropertyValue('--card-veil')).toContain('--hue-green');
  });

  it('turns the whole card into a button when it is clickable', async () => {
    const onClick = vi.fn();
    render(
      <AzuosToneCard data={{ label: 'Pendentes' }} actions={{ onClick }}>
        2
      </AzuosToneCard>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Pendentes' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('marks the selected card in the light blue of the brand', () => {
    render(
      <AzuosToneCard data={{ label: 'Todos' }} ui={{ tone: 'brand' }} state={{ isSelected: true }}>
        12
      </AzuosToneCard>,
    );

    expect(screen.getByRole('group', { name: 'Todos' })).toHaveClass('bg-card-selected');
  });

  // triste
  it('keeps a neutral wash on a static card, and is not a button without an action', () => {
    const { container } = render(<AzuosToneCard data={{ label: 'Neutro' }}>x</AzuosToneCard>);

    const wash = container.querySelector('[data-slot="card-wash"]') as HTMLElement;
    expect(wash.style.getPropertyValue('--card-veil')).toContain('--hover-veil');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
