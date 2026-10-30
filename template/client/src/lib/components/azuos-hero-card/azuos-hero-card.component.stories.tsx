import type { Meta, StoryObj } from '@storybook/react';
import { Fuel, Plane, Sparkles, Ticket, Utensils } from 'lucide-react';

import { AzuosHeroCard } from './azuos-hero-card.component';

const meta = {
  title: 'Components/AzuosHeroCard',
  component: AzuosHeroCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AzuosHeroCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BrandTone: Story = {
  args: {
    data: {
      title: 'Azuos Benefícios',
      description: 'Gestão unificada de benefícios, premiações e frotas corporativas',
      badge: 'Até 20% OFF',
      icon: Sparkles,
      to: '#',
    },
    ui: {
      tone: 'brand',
    },
  },
};

export const AccentTone: Story = {
  args: {
    data: {
      title: 'Restaurantes & Alimentação',
      description: 'Refeições corporativas e convênios credenciados com taxa zero',
      badge: 'Até 10%',
      icon: Utensils,
      to: '#',
    },
    ui: {
      tone: 'accent',
    },
  },
};

export const SuccessTone: Story = {
  args: {
    data: {
      title: 'Combustível & Frota',
      description: 'Abastecimento em postos credenciados com desconto automático',
      badge: '2% cashback',
      icon: Fuel,
      to: '#',
    },
    ui: {
      tone: 'success',
    },
  },
};

export const InfoTone: Story = {
  args: {
    data: {
      title: 'Passagens & Hotéis',
      description: 'Voos, traslados e hospedagem para equipes em trânsito',
      badge: 'Até 10%',
      icon: Plane,
      to: '#',
    },
    ui: {
      tone: 'info',
    },
  },
};

export const DangerTone: Story = {
  args: {
    data: {
      title: 'Ingressos & Lazer',
      description: 'Shows, teatros, cinema e eventos corporativos',
      badge: 'Últimos dias',
      icon: Ticket,
      to: '#',
    },
    ui: {
      tone: 'danger',
    },
  },
};
