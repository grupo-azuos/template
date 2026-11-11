import { fireEvent, render, screen } from '@testing-library/react';
import { Sparkles, Ticket } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosHeroCard } from './azuos-hero-card.component';

describe('AzuosHeroCard', () => {
  it('renders title, description and badge', () => {
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

  it('renders as a link when to is given', () => {
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

  it('fires actions.onClick on click as a button', () => {
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

  it('applies the chosen tone classes (e.g. success, accent)', () => {
    const { container: containerSuccess } = render(
      <AzuosHeroCard
        data={{
          title: 'Mercados',
          icon: Sparkles,
        }}
        ui={{ tone: 'success' }}
      />,
    );

    expect(containerSuccess.querySelector('[data-slot="hero-card-icon"]')).toHaveClass(
      'text-hue-green',
    );

    const { container: containerAccent } = render(
      <AzuosHeroCard
        data={{
          title: 'Restaurantes',
          icon: Sparkles,
        }}
        ui={{ tone: 'accent' }}
      />,
    );

    expect(containerAccent.querySelector('[data-slot="hero-card-icon"]')).toHaveClass(
      'text-hue-yellow',
    );
  });

  it('renders extra children in the footer', () => {
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

  it('renders the icon as a tone-on-tone watermark without plain white', () => {
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
    // a marca d'água é o sotaque do tom, sem opacidade
    expect(iconSlot).toHaveClass('text-hue-blue');
    expect(iconSlot?.className).not.toMatch(/opacity-/);
    const card = container.querySelector('[data-slot="azuos-hero-card"]');
    expect(card).toHaveClass('bg-card');
    expect(card?.className).not.toMatch(/bg-[a-z0-9-]+\/[0-9]/);
  });
});
