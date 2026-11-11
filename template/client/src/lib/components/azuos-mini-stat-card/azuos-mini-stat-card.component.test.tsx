import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AzuosMiniStatCard } from './azuos-mini-stat-card.component';

describe('AzuosMiniStatCard', () => {
  // feliz
  it('shows the label and the number in the accent of its status', () => {
    render(<AzuosMiniStatCard data={{ label: 'Concluído', value: 9 }} ui={{ tone: 'green' }} />);

    expect(screen.getByText('Concluído')).toBeInTheDocument();
    expect(screen.getByText('9')).toHaveClass('text-hue-green');
  });

  it('filters when clicked and turns light blue when selected', async () => {
    const onClick = vi.fn();
    render(
      <AzuosMiniStatCard
        data={{ label: 'Aguardando', value: 6 }}
        ui={{ tone: 'yellow' }}
        state={{ isSelected: true }}
        actions={{ onClick }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Aguardando: 6' }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByRole('group', { name: 'Aguardando: 6' })).toHaveClass('bg-card-selected');
  });

  // triste
  it('falls back to the slate accent without a tone', () => {
    render(<AzuosMiniStatCard data={{ label: 'Sem status', value: 0 }} />);

    expect(screen.getByText('0')).toHaveClass('text-hue-slate');
  });
});
