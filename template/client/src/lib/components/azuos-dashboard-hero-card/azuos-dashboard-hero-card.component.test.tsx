import { fireEvent, render, screen } from '@testing-library/react';
import { Megaphone, Siren } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosDashboardHeroCard } from './azuos-dashboard-hero-card.component';

describe('AzuosDashboardHeroCard', () => {
  it('renderiza cabeçalho de alerta com eyebrow, ícone e timestamp', () => {
    render(
      <AzuosDashboardHeroCard
        data={{
          eyebrow: 'Azuos Alerta',
          eyebrowIcon: Megaphone,
          timestamp: '30/10/2026, 12:20',
          title: 'Resumo do Dia',
        }}
      />,
    );

    expect(screen.getByText('Azuos Alerta')).toBeInTheDocument();
    expect(screen.getByText(/30\/10\/2026, 12:20/)).toBeInTheDocument();
  });

  it('renderiza o Zuzu grande à esquerda sem moldura circular ou bola', () => {
    const { container } = render(
      <AzuosDashboardHeroCard
        data={{
          title: 'Atenção aos prazos',
          zuzu: {
            pose: 'alert',
            size: 136,
          },
        }}
      />,
    );

    const zuzuSlot = container.querySelector('[data-slot="dashboard-zuzu"]');
    expect(zuzuSlot).toBeInTheDocument();

    const img = zuzuSlot?.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img?.getAttribute('src')).toContain('alerta');
    expect(img?.width).toBe(136);

    // Garante que não está envolvido em uma bola/círculo (rounded-full)
    expect(zuzuSlot?.parentElement?.querySelector('.rounded-full')).toBeNull();
  });

  it('renderiza título, descrição e badge com alto contraste em fundo escuro', () => {
    const { container } = render(
      <AzuosDashboardHeroCard
        data={{
          title: 'Meta Batida!',
          description: 'Sua equipe completou todas as tarefas.',
          badge: 'Parabéns!',
        }}
      />,
    );

    expect(screen.getByText('Meta Batida!')).toBeInTheDocument();
    expect(screen.getByText('Sua equipe completou todas as tarefas.')).toBeInTheDocument();
    expect(screen.getByText('Parabéns!')).toBeInTheDocument();

    const root = container.querySelector('[data-slot="azuos-dashboard-hero-card"]');
    expect(root).toHaveClass('bg-brand-blue-900');
    expect(root).toHaveClass('text-on-dark');
  });

  it('renderiza grade de indicadores (stats) com cores e valores', () => {
    const handleClick = vi.fn();
    render(
      <AzuosDashboardHeroCard
        data={{
          title: 'Alvarás',
          stats: [
            {
              label: 'Alvarás Vencidos',
              value: 47,
              hint: 'Regularização imediata',
              tone: 'danger',
              icon: Siren,
              onClick: handleClick,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText('Alvarás Vencidos')).toBeInTheDocument();
    expect(screen.getByText('47')).toBeInTheDocument();
    expect(screen.getByText('Regularização imediata')).toBeInTheDocument();

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renderiza children personalizados na área inferior', () => {
    render(
      <AzuosDashboardHeroCard
        data={{
          title: 'Painel com Botões',
        }}
        ui={{
          children: <button type="button">Ação Especial</button>,
        }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Ação Especial' })).toBeInTheDocument();
  });

  // feliz
  it('turns a stat into a button when it opens something, and keeps the hint', () => {
    const onClick = vi.fn();
    render(
      <AzuosDashboardHeroCard
        data={{
          title: 'Resumo',
          stats: [
            { label: 'Vencidos', value: 3, tone: 'danger', icon: Siren, hint: 'hoje', onClick },
            { label: 'No prazo', value: 12, tone: 'warning' },
          ],
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Vencidos/ }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByText('hoje')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /No prazo/ })).not.toBeInTheDocument();
  });

  // feliz
  it('marks the chosen stat as pressed, with the darker fill and the highlight label', () => {
    render(
      <AzuosDashboardHeroCard
        data={{
          title: 'Resumo do Dia',
          stats: [
            { label: 'Vencidos', value: 3, icon: Siren, isActive: true, onClick: vi.fn() },
            { label: 'Próximos', value: 1, isActive: false, onClick: vi.fn() },
          ],
        }}
      />,
    );

    const chosen = screen.getByRole('button', { name: /Vencidos/ });
    expect(chosen).toHaveAttribute('aria-pressed', 'true');
    expect(chosen).toHaveClass('bg-brand-blue-900');
    expect(chosen.className).not.toMatch(/border/);
    expect(screen.getByText('Vencidos')).toHaveClass('text-accent-hero');

    const other = screen.getByRole('button', { name: /Próximos/ });
    expect(other).toHaveAttribute('aria-pressed', 'false');
    expect(other).toHaveClass('bg-brand-blue-800');
  });

  // triste
  it('says nothing about pressed when the stat is not a toggle', () => {
    render(
      <AzuosDashboardHeroCard
        data={{
          title: 'Resumo do Dia',
          stats: [{ label: 'Vencidos', value: 3, onClick: vi.fn() }],
        }}
      />,
    );

    expect(screen.getByRole('button', { name: /Vencidos/ })).not.toHaveAttribute('aria-pressed');
  });
});
