import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosBoardDrillBanner } from './azuos-board-drill-banner.component';

describe('AzuosBoardDrillBanner', () => {
  // feliz
  it('says where the list came from and clears the cut', () => {
    const onClear = vi.fn();
    render(
      <AzuosBoardDrillBanner
        data={{ summary: ['Tarefas por status', 'Status: Concluída'], notice: null }}
        actions={{ onClear, onBack: vi.fn() }}
      />,
    );

    expect(screen.getByRole('region', { name: 'Recorte do painel' })).toHaveTextContent(
      'Status: Concluída',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Limpar recorte' }));
    expect(onClear).toHaveBeenCalled();
  });

  // feliz
  it('leads back to the dashboard', () => {
    const onBack = vi.fn();
    render(
      <AzuosBoardDrillBanner
        data={{ summary: ['Tarefas por status'], notice: null }}
        actions={{ onClear: vi.fn(), onBack }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Voltar para o Dashboard' }));
    expect(onBack).toHaveBeenCalled();
  });

  // triste
  it('warns, instead of showing a cut, when the cut did not apply, and still leads back', () => {
    const onBack = vi.fn();
    render(
      <AzuosBoardDrillBanner
        data={{ summary: [], notice: 'O filtro salvo sumiu.' }}
        actions={{ onClear: vi.fn(), onBack }}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('O filtro salvo sumiu.');
    expect(screen.queryByRole('region', { name: 'Recorte do painel' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Voltar para o Dashboard' }));
    expect(onBack).toHaveBeenCalled();
  });
});
