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

  it('renderiza título, descrição e badge no fundo do hero, que acompanha o tema', () => {
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
    expect(root).toHaveClass('bg-hero-surface', 'text-hero-foreground');
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
  it('marks the chosen stat as pressed, with the middle pastel of its hue and the icon inverted', () => {
    render(
      <AzuosDashboardHeroCard
        data={{
          title: 'Resumo do Dia',
          stats: [
            {
              label: 'Vencidos',
              value: 3,
              icon: Siren,
              tone: 'danger',
              isActive: true,
              onClick: vi.fn(),
            },
            { label: 'Próximos', value: 1, tone: 'warning', isActive: false, onClick: vi.fn() },
          ],
        }}
      />,
    );

    const chosen = screen.getByRole('button', { name: /Vencidos/ });
    expect(chosen).toHaveAttribute('aria-pressed', 'true');
    expect(chosen).toHaveClass('bg-tone-red-chip', 'text-tone-red-text');
    expect(chosen.className).not.toMatch(/border|-fill/);
    expect(chosen.querySelector('svg')?.parentElement).toHaveClass(
      'bg-tone-red-text',
      'text-tone-red-surface',
    );

    const other = screen.getByRole('button', { name: /Próximos/ });
    expect(other).toHaveAttribute('aria-pressed', 'false');
    expect(other).toHaveClass('bg-tone-amber-surface', 'text-tone-amber-text');
  });

  // feliz
  it('paints each stat with the pastel of its hue, never a border or opacity', () => {
    render(
      <AzuosDashboardHeroCard
        data={{
          title: 'Resumo do Dia',
          stats: [
            { label: 'Perigo', value: 1, tone: 'danger', hint: 'dica clara' },
            { label: 'Atenção', value: 2, tone: 'warning' },
            { label: 'Aviso', value: 3, tone: 'info' },
            { label: 'Certo', value: 4, tone: 'success' },
            { label: 'Marca', value: 5, tone: 'brand', hint: 'dica escura' },
            { label: 'Neutro', value: 6 },
            { label: 'Revisão', value: 7, tone: 'violet' },
          ],
        }}
      />,
    );

    const cardOf = (label: string) => screen.getByText(label).closest('div.rounded-surface');
    expect(cardOf('Perigo')).toHaveClass('bg-tone-red-surface', 'text-tone-red-text');
    expect(cardOf('Atenção')).toHaveClass('bg-tone-amber-surface', 'text-tone-amber-text');
    expect(cardOf('Aviso')).toHaveClass('bg-tone-sky-surface', 'text-tone-sky-text');
    expect(cardOf('Certo')).toHaveClass('bg-tone-emerald-surface', 'text-tone-emerald-text');
    expect(cardOf('Marca')).toHaveClass('bg-tone-indigo-surface', 'text-tone-indigo-text');
    expect(cardOf('Neutro')).toHaveClass('bg-tone-gray-surface', 'text-tone-gray-text');
    expect(cardOf('Revisão')).toHaveClass('bg-tone-violet-surface', 'text-tone-violet-text');
    for (const label of ['Perigo', 'Atenção', 'Aviso', 'Certo', 'Marca', 'Neutro', 'Revisão']) {
      expect(cardOf(label)?.className).not.toMatch(/border|\/\d/);
    }
  });

  // feliz
  it('lightens a clickable stat on hover, lifting it with a shadow, never darkening it', () => {
    render(
      <AzuosDashboardHeroCard
        data={{
          title: 'Resumo do Dia',
          stats: [
            {
              label: 'Vencidos',
              value: 3,
              tone: 'danger',
              icon: Siren,
              hint: 'ver',
              onClick: vi.fn(),
            },
            { label: 'Revisões', value: 2, tone: 'brand', onClick: vi.fn() },
          ],
        }}
      />,
    );

    const danger = screen.getByRole('button', { name: /Vencidos/ });
    expect(danger).toHaveClass('cursor-pointer', 'hover:bg-tone-red-hover', 'hover:shadow-xl');
    expect(screen.getByRole('button', { name: /Revisões/ })).toHaveClass(
      'hover:bg-tone-indigo-hover',
    );
  });

  // feliz
  it('takes the chosen brand stat to the middle pastel of its hue', () => {
    render(
      <AzuosDashboardHeroCard
        data={{
          title: 'Revisões',
          stats: [
            { label: 'Pendentes', value: 2, tone: 'brand', isActive: true, onClick: vi.fn() },
          ],
        }}
      />,
    );

    expect(screen.getByRole('button', { name: /Pendentes/ })).toHaveClass(
      'bg-tone-indigo-chip',
      'text-tone-indigo-text',
    );
  });

  // triste
  it('keeps a stat that only shows a number free of hover color', () => {
    render(
      <AzuosDashboardHeroCard
        data={{ title: 'Resumo do Dia', stats: [{ label: 'Total', value: 9, tone: 'success' }] }}
      />,
    );

    const card = screen.getByText('Total').closest('div.rounded-surface');
    expect(card?.className).not.toMatch(/hover:/);
  });

  // triste
  it('falls back to the gray hue when the tone is unknown', () => {
    render(
      <AzuosDashboardHeroCard
        data={{
          title: 'Resumo do Dia',
          stats: [
            {
              label: 'Estranho',
              value: 0,
              tone: 'unknown' as unknown as 'default',
            },
          ],
        }}
      />,
    );

    expect(screen.getByText('Estranho').closest('div.rounded-surface')).toHaveClass(
      'bg-tone-gray-surface',
    );
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

    expect(screen.getByText('3 alvarás vencidos')).toHaveClass('text-hero-accent');
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
    expect(heading.querySelector('.text-hero-accent')).toBeNull();
  });
});
