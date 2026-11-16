import { render, screen } from '@testing-library/react';
import { Stamp } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { AzuosContentStatCard } from './azuos-content-stat-card.component';

describe('AzuosContentStatCard', () => {
  // feliz: rótulo, número no sotaque e a linha de baixo.
  it('shows the label, the number in the accent and the hint', () => {
    render(
      <AzuosContentStatCard
        data={{ label: 'Empresas afetadas', value: 552, hint: 'com ocorrência' }}
        ui={{ icon: Stamp, tone: 'warning' }}
      />,
    );

    expect(screen.getByText('Empresas afetadas')).toBeInTheDocument();
    expect(screen.getByText('552')).toHaveClass('text-hue-yellow-ink');
    expect(screen.getByText('com ocorrência')).toBeInTheDocument();
  });

  // triste: sem a linha de baixo, ela não aparece vazia.
  it('leaves the hint out when there is none', () => {
    const { container } = render(
      <AzuosContentStatCard data={{ label: 'Alvarás', value: 0 }} ui={{ icon: Stamp, tone: 'brand' }} />,
    );

    expect(container.querySelectorAll('p')).toHaveLength(2);
  });
});
