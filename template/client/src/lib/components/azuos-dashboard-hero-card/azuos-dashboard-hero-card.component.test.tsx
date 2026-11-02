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
    expect(root).toHaveClass('bg-brand-blue-900', 'text-on-dark');
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
  it('marks the chosen stat as pressed, in the light blue of the brand', () => {
    render(
      <AzuosDashboardHeroCard
        data={{
          title: 'Resumo do Dia',
          stats: [
            { label: 'Vencidos', value: 3, icon: Siren, tone: 'danger', isActive: true, onClick: vi.fn() },
            { label: 'Próximos', value: 1, tone: 'warning', isActive: false, onClick: vi.fn() },
          ],
        }}
      />,
    );

    expect(screen.getByRole('button', { name: /Vencidos/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('group', { name: /Vencidos/ })).toHaveClass('bg-card-selected');
    expect(screen.getByRole('button', { name: /Próximos/ })).toHaveAttribute('aria-pressed', 'false');
  });

  // feliz
  it('shows each stat as a dashboard card, with the number in the accent of its tone', () => {
    render(
      <AzuosDashboardHeroCard
        data={{
          title: 'Resumo do Dia',
          stats: [
            { label: 'Perigo', value: 1, tone: 'danger' },
            { label: 'Revisão', value: 7, tone: 'plum' },
            { label: 'Neutro', value: 6 },
          ],
        }}
      />,
    );

    expect(screen.getByRole('group', { name: 'Perigo' })).toHaveClass('bg-card');
    expect(screen.getByText('1')).toHaveClass('text-hue-red');
    expect(screen.getByText('7')).toHaveClass('text-hue-plum');
    expect(screen.getByText('6')).toHaveClass('text-hue-slate');
  });

  // triste
  it('keeps a stat that only shows a number free of a button', () => {
    render(
      <AzuosDashboardHeroCard
        data={{ title: 'Resumo do Dia', stats: [{ label: 'Total', value: 9, tone: 'success' }] }}
      />,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  // feliz
  it('paints the highlighted part of the title, as text', () => {
    render(
      <AzuosDashboardHeroCard
        data={{
          title: 'Bom dia! Acumulou 3 alvarás vencidos.',
          titleHighlight: '3 alvarás vencidos',
        }}
      />,
    );

    expect(screen.getByText('3 alvarás vencidos')).toHaveClass('text-accent-hero');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Bom dia! Acumulou 3 alvarás vencidos.',
    );
  });

  // triste
  it('keeps the plain title when the highlight is not in it', () => {
    render(
      <AzuosDashboardHeroCard data={{ title: 'Dia tranquilo.', titleHighlight: '<b>x</b>' }} />,
    );

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Dia tranquilo.');
    expect(heading.querySelector('.text-accent-hero')).toBeNull();
  });
});
