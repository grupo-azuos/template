import { type Meta, type StoryObj } from '@storybook/react';
import { Building2, ClipboardList, ShieldCheck, Users } from 'lucide-react';

import { AzuosStatCardGrid } from '../azuos-stat-card-grid/azuos-stat-card-grid.component';
import { AzuosStatCard } from './azuos-stat-card.component';

const meta = {
  title: 'Gráficos e números/AzuosStatCard',
  component: AzuosStatCard,
} satisfies Meta<typeof AzuosStatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { data: { label: 'Clientes', value: 560 } },
};

/** Um número que EXCLUI algo precisa dizer o que excluiu, ou dois painéis discordam. */
export const WithHint: Story = {
  args: {
    data: { label: 'Ativos', value: 641, hint: 'Exclui 1.067 arquivados' },
    ui: { tone: 'info' },
  },
};

export const WithIcon: Story = {
  args: { data: { label: 'Clientes', value: 7 }, ui: { tone: 'brand', icon: Building2 } },
};

export const AllTonesWithIcon: Story = {
  args: { data: { label: 'Total', value: 0 } },
  render: () => (
    <AzuosStatCardGrid>
      <AzuosStatCard
        data={{ label: 'Clientes', value: 7 }}
        ui={{ tone: 'brand', icon: Building2 }}
      />
      <AzuosStatCard
        data={{ label: 'Total Geral', value: 25 }}
        ui={{ tone: 'neutral', icon: ClipboardList }}
      />
      <AzuosStatCard
        data={{ label: 'Ativos', value: 24, hint: 'Exclui 1 arquivado' }}
        ui={{ tone: 'info', icon: ShieldCheck }}
      />
      <AzuosStatCard data={{ label: 'Equipe', value: 4 }} ui={{ tone: 'neutral', icon: Users }} />
    </AzuosStatCardGrid>
  ),
};

export const Large: Story = {
  args: { data: { label: 'Total geral', value: 1708 }, ui: { tone: 'brand', size: 'lg' } },
};

export const Loading: Story = {
  args: { data: { label: 'Clientes', value: 0 }, state: { isLoading: true } },
};

/** Caso limite: zero é um número legítimo e não pode virar traço nem sumir. */
export const Zero: Story = {
  args: { data: { label: 'Inativas', value: 0 }, ui: { tone: 'neutral' } },
};

/** Caso limite: rótulo comprido não pode empurrar o número para fora do cartão. */
export const LongLabel: Story = {
  args: {
    data: {
      label: 'Tarefas sem prazo definido nem responsável',
      value: 1425,
      hint: 'Inclui vencidos antigos e sem prazo definido',
    },
    ui: { tone: 'danger', className: 'max-w-[220px]' },
  },
};

/** Todos os tons: o fundo do cartão inteiro é o `-soft` do tom, sem borda. */
export const AllTones: Story = {
  args: { data: { label: 'Total', value: 128 } },
  render: () => (
    <div className="card-grid">
      <AzuosStatCard data={{ label: 'Neutro', value: 128 }} />
      <AzuosStatCard data={{ label: 'Marca', value: 41 }} ui={{ tone: 'brand' }} />
      <AzuosStatCard data={{ label: 'Sucesso', value: 74 }} ui={{ tone: 'success' }} />
      <AzuosStatCard data={{ label: 'Atenção', value: 9 }} ui={{ tone: 'warning' }} />
      <AzuosStatCard data={{ label: 'Perigo', value: 13 }} ui={{ tone: 'danger' }} />
      <AzuosStatCard data={{ label: 'Informação', value: 5 }} ui={{ tone: 'info' }} />
    </div>
  ),
};

/** Clicável: o cartão é um atalho de filtro. O clique é um botão de verdade, por baixo. */
export const Clickable: Story = {
  args: {
    data: { label: 'Atrasadas', value: 13 },
    ui: { tone: 'danger' },
    actions: { onClick: () => {} },
  },
};

/** Selecionado: o filtro deste cartão já está valendo — quem marca o estado é o anel. */
export const Selected: Story = {
  args: {
    data: { label: 'Atrasadas', value: 13 },
    ui: { tone: 'danger' },
    state: { isSelected: true },
    actions: { onClick: () => {} },
  },
};
