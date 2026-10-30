import { fireEvent, render, screen } from '@testing-library/react';
import { Megaphone, Siren, Sparkles, Ticket } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosHeroCard } from './azuos-hero-card.component';

describe('AzuosHeroCard', () => {
  it('renderiza título, descrição e badge corretamente', () => {
    render(
      <AzuosHeroCard
        data={{
          title: 'Eventos & Shows',
          description: 'Ingressos e reservas com cashback exclusivo',
          badge: 'Até 15%',
          icon: Ticket,
        }}
      />,
    );

    expect(screen.getByText('Eventos & Shows')).toBeInTheDocument();
    expect(screen.getByText('Ingressos e reservas com cashback exclusivo')).toBeInTheDocument();
    expect(screen.getByText('Até 15%')).toBeInTheDocument();
  });

  it('renderiza como link quando to é fornecido', () => {
    render(
      <AzuosHeroCard
        data={{
          title: 'Serviços de Frota',
          icon: Sparkles,
          to: '/fleet',
        }}
      />,
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/fleet');
  });

  it('aciona actions.onClick no clique quando é botão', () => {
    const handleClick = vi.fn();
    render(
      <AzuosHeroCard
        data={{
          title: 'Combustível',
          icon: Sparkles,
        }}
        actions={{ onClick: handleClick }}
      />,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('aplica classes do tom selecionado (ex: success, accent)', () => {
    const { container: containerSuccess } = render(
      <AzuosHeroCard
        data={{
          title: 'Mercados',
          icon: Sparkles,
        }}
        ui={{ tone: 'success' }}
      />,
    );

    expect(containerSuccess.querySelector('[data-slot="azuos-hero-card"]')).toHaveClass('bg-success');

    const { container: containerAccent } = render(
      <AzuosHeroCard
        data={{
          title: 'Restaurantes',
          icon: Sparkles,
        }}
        ui={{ tone: 'accent' }}
      />,
    );

    expect(containerAccent.querySelector('[data-slot="azuos-hero-card"]')).toHaveClass('bg-accent-hero');
  });

  it('renderiza children adicionais no rodapé', () => {
    render(
      <AzuosHeroCard
        data={{
          title: 'Viagens Corporativas',
          icon: Sparkles,
        }}
        ui={{
          children: <span data-testid="custom-tag">Tag Extra</span>,
        }}
      />,
    );

    expect(screen.getByTestId('custom-tag')).toBeInTheDocument();
  });

  it('renderiza o ícone como marca d água integrada tom-sobre-tom sem branco seco', () => {
    const { container } = render(
      <AzuosHeroCard
        data={{
          title: 'Azuos Benefícios',
          icon: Sparkles,
        }}
        ui={{ tone: 'brand' }}
      />,
    );

    const iconSlot = container.querySelector('[data-slot="hero-card-icon"]');
    expect(iconSlot).toBeInTheDocument();
    expect(iconSlot).toHaveClass('opacity-15');
    // Card container deve ser 100% sólido bg-primary
    const card = container.querySelector('[data-slot="azuos-hero-card"]');
    expect(card).toHaveClass('bg-primary');
    expect(card?.className).not.toMatch(/bg-[a-z0-9-]+\/[0-9]/);
  });

  it('renderiza variante com o mascote Zuzu no slot hero-card-zuzu', () => {
    const { container } = render(
      <AzuosHeroCard
        data={{
          title: 'Dica do Zuzu',
          description: 'Acompanhe novidades e alertas',
          badge: 'Novidade',
        }}
        ui={{ variant: 'zuzu' }}
      />,
    );

    const zuzuSlot = container.querySelector('[data-slot="hero-card-zuzu"]');
    expect(zuzuSlot).toBeInTheDocument();
    // Não renderiza slot de ícone watermark quando é variante Zuzu
    expect(container.querySelector('[data-slot="hero-card-icon"]')).not.toBeInTheDocument();

    const zuzuImg = zuzuSlot?.querySelector('img');
    expect(zuzuImg).toBeInTheDocument();
    expect(zuzuImg?.getAttribute('src')).toContain('joinha');
  });

  it('renderiza pose e tamanho customizados do Zuzu via data.zuzu', () => {
    const { container } = render(
      <AzuosHeroCard
        data={{
          title: 'Meta Batida!',
          zuzu: {
            pose: 'celebrating',
            size: 120,
          },
        }}
        ui={{ tone: 'success' }}
      />,
    );

    const zuzuSlot = container.querySelector('[data-slot="hero-card-zuzu"]');
    expect(zuzuSlot).toBeInTheDocument();

    const zuzuImg = zuzuSlot?.querySelector('img');
    expect(zuzuImg).toBeInTheDocument();
    expect(zuzuImg?.getAttribute('src')).toContain('festejando');
    expect(zuzuImg?.width).toBe(120);
  });

  it('renderiza variante dashboard com Zuzu grande à esquerda e mensagem à direita', () => {
    const { container } = render(
      <AzuosHeroCard
        data={{
          eyebrow: 'Azuos Alerta',
          eyebrowIcon: Megaphone,
          timestamp: '30/10/2026, 12:20',
          title: 'Boa tarde, Vinícius Gabriel! Acumulou 47 alvarás vencidos.',
          description: 'Bora desafogar pelos mais antigos?',
          zuzu: {
            pose: 'alert',
            size: 136,
          },
          stats: [
            {
              label: 'Alvarás Vencidos',
              value: 47,
              hint: 'Regularização imediata',
              tone: 'danger',
              icon: Siren,
            },
          ],
        }}
        ui={{ variant: 'dashboard', tone: 'brand' }}
      />,
    );

    // Eyebrow e timestamp
    expect(screen.getByText('Azuos Alerta')).toBeInTheDocument();
    expect(screen.getByText(/30\/10\/2026, 12:20/)).toBeInTheDocument();

    // Mensagem principal
    expect(screen.getByText(/Boa tarde, Vinícius Gabriel!/)).toBeInTheDocument();
    expect(screen.getByText('Bora desafogar pelos mais antigos?')).toBeInTheDocument();

    // Zuzu grande à esquerda sem moldura circular
    const zuzuSlot = container.querySelector('[data-slot="hero-card-zuzu"]');
    expect(zuzuSlot).toBeInTheDocument();
    const zuzuImg = zuzuSlot?.querySelector('img');
    expect(zuzuImg).toBeInTheDocument();
    expect(zuzuImg?.getAttribute('src')).toContain('alerta');
    expect(zuzuImg?.width).toBe(136);

    // Indicador no rodapé
    expect(screen.getByText('Alvarás Vencidos')).toBeInTheDocument();
    expect(screen.getByText('47')).toBeInTheDocument();
    expect(screen.getByText('Regularização imediata')).toBeInTheDocument();
  });
});
