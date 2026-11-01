import { type Meta, type StoryObj } from '@storybook/react';
import { KeyRound, TriangleAlert, UserRound } from 'lucide-react';

import { AzuosStatusBadge } from '../azuos-status-badge/azuos-status-badge.component';
import { AzuosSectionTitle } from './azuos-section-title.component';

const meta = {
  title: 'Conteúdo e marcadores/AzuosSectionTitle',
  component: AzuosSectionTitle,
} satisfies Meta<typeof AzuosSectionTitle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: { title: 'Dados pessoais', description: 'Como a equipe vê esta pessoa nos sistemas.' },
    ui: { icon: UserRound },
  },
};

export const WithoutDescription: Story = {
  args: { data: { title: 'Senha' }, ui: { icon: KeyRound } },
};

/** A contagem da lista entra no título, ao lado do nome da seção. */
export const WithAdornment: Story = {
  args: {
    data: { title: 'Sistemas', description: 'Os sistemas que esta pessoa abre.' },
    ui: { icon: KeyRound },
    adornment: <AzuosStatusBadge data={{ label: '3' }} ui={{ tone: 'neutral' }} />,
  },
};

export const Danger: Story = {
  args: {
    data: {
      title: 'Zona de perigo',
      description: 'Excluir apaga a conta e todos os acessos dela.',
    },
    ui: { icon: TriangleAlert, tone: 'danger' },
  },
};

export const LongContent: Story = {
  args: {
    data: {
      title: 'Um título de seção bem mais comprido do que o normal, para ver a quebra de linha',
      description:
        'E uma explicação longa, que precisa quebrar em várias linhas sem empurrar o ícone para fora do lugar nem cortar o texto no meio da frase.',
    },
    ui: { icon: UserRound },
  },
  decorators: [(Story) => <div className="max-w-sm">{Story()}</div>],
};
