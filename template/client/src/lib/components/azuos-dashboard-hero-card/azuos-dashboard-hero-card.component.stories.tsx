import type { Meta, StoryObj } from '@storybook/react';
import {
  AlarmClock,
  BadgePlus,
  CheckCircle2,
  ClipboardCheck,
  Megaphone,
  Siren,
  Sparkles,
  TriangleAlert,
  UserX,
} from 'lucide-react';

import { AzuosDashboardHeroCard } from './azuos-dashboard-hero-card.component';

const meta = {
  title: 'Superfícies/AzuosDashboardHeroCard',
  component: AzuosDashboardHeroCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AzuosDashboardHeroCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
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
          tone: 'default',
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
  },
};

export const Celebration: Story = {
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
          tone: 'info',
          icon: AlarmClock,
        },
        {
          label: 'Economia Gerada',
          value: 'R$ 142k',
          hint: 'Acima da projeção anual',
          tone: 'warning',
          icon: Sparkles,
        },
      ],
    },
  },
};

export const IdeaWithChildren: Story = {
  args: {
    data: {
      eyebrow: 'Dica do Zuzu',
      eyebrowIcon: Sparkles,
      title: 'Otimização de processos ativa',
      description:
        'Centralize suas certidões para receber notificações automáticas antes do vencimento.',
      badge: 'Novidade',
      zuzu: {
        pose: 'idea',
        size: 136,
      },
    },
    ui: {
      children: (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-control bg-accent-hero text-accent-hero-foreground hover:bg-accent-strong cursor-pointer px-4 py-2 text-sm font-bold shadow-xs transition-colors"
          >
            Configurar Notificações
          </button>
          <button
            type="button"
            className="rounded-control bg-brand-blue-800 text-primary-foreground hover:bg-brand-blue-700 cursor-pointer px-4 py-2 text-sm font-medium transition-colors"
          >
            Saiba Mais
          </button>
        </div>
      ),
    },
  },
};

/**
 * Cartões que trocam a fila da tela: o escolhido (`isActive`) tem o fundo mais fechado e o rótulo
 * no amarelo de destaque. Sem borda — a cor vem do fundo.
 */
export const WithActiveStat: Story = {
  args: {
    data: {
      eyebrow: 'Azuos Alerta',
      eyebrowIcon: Megaphone,
      title: 'Bom dia! Você tem 12 alvarás para olhar hoje.',
      zuzu: { pose: 'alert', size: 120 },
      stats: [
        {
          label: 'Alvarás Vencidos',
          value: 12,
          hint: 'Regularização imediata',
          tone: 'danger',
          icon: Siren,
          isActive: true,
          onClick: () => undefined,
        },
        {
          label: 'Pendências Próximas',
          value: 6,
          hint: 'Vencem nos próximos 30 dias',
          tone: 'warning',
          icon: AlarmClock,
          isActive: false,
          onClick: () => undefined,
        },
        {
          label: 'Sem Responsável',
          value: 0,
          hint: 'Alvarás sem dono atribuído',
          tone: 'default',
          icon: UserX,
          isActive: false,
          onClick: () => undefined,
        },
      ],
    },
  },
};
