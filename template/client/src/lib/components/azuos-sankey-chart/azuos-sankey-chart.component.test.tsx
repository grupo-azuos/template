import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AzuosSankeyChart, sankeyOption } from './azuos-sankey-chart.component';

const DATA = {
  nodes: [
    { id: 'type:BOMBEIRO', label: 'BOMBEIRO', color: '#3b82f6' },
    { id: 'owner:N/A', label: 'N/A', color: '#10b981' },
    { id: 'stage:Parado', label: 'Parado', color: '#f59e0b' },
  ],
  links: [
    { from: 'type:BOMBEIRO', to: 'owner:N/A', value: 5 },
    { from: 'owner:N/A', to: 'stage:Parado', value: 5 },
  ],
  seriesLabel: 'Alvarás',
};
const THEME = { foreground: '#111', muted: '#666' };

describe('AzuosSankeyChart', () => {
  // feliz
  it('describes the flow in writing', () => {
    render(<AzuosSankeyChart data={DATA} />);

    expect(screen.getByRole('img', { name: /fluxo de 5 entre 3 etapas/ })).toBeInTheDocument();
  });

  /* O nó é achado pelo `id`, e o que aparece é o `label`: o mesmo nome pode existir em duas colunas
     sem os dois virarem um nó só. */
  it('keys the nodes by id and writes the label', () => {
    const series = (sankeyOption(DATA, THEME).series as { data: { name: string }[]; label: { formatter: (p: unknown) => string } }[])[0]!;

    expect(series.data.map((node) => node.name)).toEqual(['type:BOMBEIRO', 'owner:N/A', 'stage:Parado']);
    expect(series.label.formatter({ name: 'owner:N/A' })).toBe('N/A');
  });

  // triste
  it('says there is no flow instead of drawing an empty box', () => {
    render(<AzuosSankeyChart data={{ ...DATA, links: [] }} ui={{ emptyLabel: 'Sem fluxo' }} />);

    expect(screen.getByText('Sem fluxo')).toBeInTheDocument();
  });
});
