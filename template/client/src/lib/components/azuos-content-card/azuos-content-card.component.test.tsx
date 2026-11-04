import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Hourglass } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosContentCard } from './azuos-content-card.component';

describe('AzuosContentCard', () => {
  // feliz
  it('draws the subject icon big in the corner, in its accent, over the brand surface', () => {
    const { container } = render(
      <AzuosContentCard data={{ label: 'Clínica' }} ui={{ tone: 'copper', icon: Hourglass }}>
        <h3>Clínica Sorriso</h3>
      </AzuosContentCard>,
    );

    expect(screen.getByRole('heading', { name: 'Clínica Sorriso' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Clínica' })).toHaveClass('bg-card');
    expect(container.querySelector('[data-slot="card-mark"]')).toHaveClass('text-hue-copper');
  });

  it('opens when clicked', async () => {
    const onClick = vi.fn();
    render(
      <AzuosContentCard data={{ label: 'Abrir empresa' }} actions={{ onClick }}>
        x
      </AzuosContentCard>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Abrir empresa' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  // triste
  it('draws no mark without an icon', () => {
    const { container } = render(<AzuosContentCard>x</AzuosContentCard>);

    expect(container.querySelector('[data-slot="card-mark"]')).toBeNull();
  });
});
