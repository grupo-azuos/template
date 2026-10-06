import { type Meta, type StoryObj } from '@storybook/react';
import { BarChart3 } from 'lucide-react';

import { AzuosPendingArea } from './azuos-pending-area.component';

const meta = {
  title: 'Estados da tela/AzuosPendingArea',
  component: AzuosPendingArea,
} satisfies Meta<typeof AzuosPendingArea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: {
      title: 'Relatórios',
      summary: 'Os números do mês, prontos para imprimir ou enviar.',
      features: [
        'Quantas tarefas foram concluídas no período',
        'Tempo médio entre criar e concluir',
        'Exportar em CSV e em PDF',
      ],
    },
  },
};

/** Com dependência: evita a pergunta "por que não fizeram esta primeiro?". */
export const WithDependency: Story = {
  args: {
    data: {
      title: 'Relatórios',
      summary: 'Os números do mês, prontos para imprimir ou enviar.',
      features: ['Quantas tarefas foram concluídas no período', 'Exportar em CSV e em PDF'],
      dependsOn: 'as Tarefas e os Responsáveis',
    },
    ui: { icon: BarChart3 },
  },
};

/** Caso limite: um item só previsto — a lista continua sendo uma lista. */
export const SingleFeature: Story = {
  args: {
    data: {
      title: 'Etiquetas',
      summary: 'Agrupar tarefas por assunto.',
      features: ['Criar, renomear e apagar etiquetas'],
    },
  },
};
