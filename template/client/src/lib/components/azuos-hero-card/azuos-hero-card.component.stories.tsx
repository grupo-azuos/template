import type { Meta, StoryObj } from '@storybook/react';
import {
  AlarmClock,
  BadgePlus,
  CheckCircle2,
  ClipboardCheck,
  Fuel,
  Megaphone,
  Plane,
  Siren,
  Sparkles,
  Ticket,
  TriangleAlert,
  UserX,
  Utensils,
} from 'lucide-react';

import { AzuosHeroCard } from './azuos-hero-card.component';

const meta = {
  title: 'Superfícies/AzuosHeroCard',
  component: AzuosHeroCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AzuosHeroCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DashboardAlertPanel: Story = {
  args: {
    data: {
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
        {
          label: 'Pendências Próximas',
          value: 6,
          hint: 'Vencem nos próximos 30 dias',
          tone: 'warning',
          icon: AlarmClock,
        },
        {
          label: 'Sem Próxima Atualização',
          value: 0,
          hint: 'Com vencimento e sem acompanhamento',
          tone: 'info',
          icon: TriangleAlert,
        },
        {
          label: 'Novas Empresas',
          value: 578,
          hint: 'Aguardando sua análise',
          tone: 'neutral',
          icon: BadgePlus,
        },
        {
          label: 'Sem Responsável',
          value: 8,
          hint: 'Alvarás sem dono atribuído',
          tone: 'warning',
          icon: UserX,
        },
        {
          label: 'Revisões Pendentes',
          value: 904,
          hint: 'Aguardando checklist',
          tone: 'brand',
          icon: ClipboardCheck,
        },
      ],
    },
    ui: {
      tone: 'brand',
      variant: 'dashboard',
    },
  },
};

export const DashboardCelebrationPanel: Story = {
  args: {
    data: {
      eyebrow: 'Resultados do Trimestre',
      eyebrowIcon: Sparkles,
      timestamp: 'Hoje às 17:00',
      title: 'Meta Batida! Sua equipe completou 100% das entregas.',
      description: 'Zero pendências em atraso e 98% de satisfação consolidada.',
      badge: 'Destaque do Trimestre',
      zuzu: {
        pose: 'celebrating',
        size: 136,
      },
      stats: [
        {
          label: 'Metas Concluídas',
          value: '24 / 24',
          hint: '100% do plano trimestral',
          tone: 'success',
          icon: CheckCircle2,
        },
        {
          label: 'Tempo Médio',
          value: '1.2h',
          hint: 'Redução de 45% no ciclo',
          tone: 'brand',
          icon: AlarmClock,
        },
        {
          label: 'Economia Gerada',
          value: 'R$ 142k',
          hint: 'Acima da projeção anual',
          tone: 'neutral',
          icon: Sparkles,
        },
      ],
    },
    ui: {
      tone: 'brand',
      variant: 'dashboard',
    },
  },
};

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

export const CompactWithZuzu: Story = {
  args: {
    data: {
      title: 'Dica do Zuzu',
      description: 'Cadastre sua chave Pix para receber seus reembolsos corporativos em instantes',
      badge: 'Novidade',
      zuzu: {
        pose: 'thumbsup',
      },
      to: '#',
    },
    ui: {
      tone: 'brand',
    },
  },
};
