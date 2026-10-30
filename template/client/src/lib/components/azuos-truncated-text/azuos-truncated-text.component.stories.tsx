import { type Meta, type StoryObj } from '@storybook/react';

import { AzuosStatusBadge } from '../azuos-status-badge/azuos-status-badge.component';
import { AzuosTruncatedText } from './azuos-truncated-text.component';

const meta = {
  title: 'Importados/AzuosTruncatedText',
  component: AzuosTruncatedText,
  decorators: [
    (Story) => (
      <div className="w-32 p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    data: { text: 'Assistente de Departamento Pessoal' },
    ui: { className: 'truncate text-sm' },
  },
} satisfies Meta<typeof AzuosTruncatedText>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Não cabe: corta com "…", e o balão mostra o texto inteiro. */
export const Default: Story = {};

/** Cabe inteiro: passar o mouse não abre balão nenhum. */
export const Fits: Story = { args: { data: { text: 'Indeed' } } };

/** Duas linhas antes de cortar, como a vaga na tabela. */
export const TwoLines: Story = {
  args: {
    data: { text: 'Analista de Departamento Pessoal Sênior com foco em folha' },
    ui: { className: 'line-clamp-2 text-sm' },
  },
};

/** O filho corta a si mesmo: o selo do status. */
export const Badge: Story = {
  args: { data: { text: 'Reprovado - Triagem' }, ui: { className: undefined } },
  render: (args) => (
    <AzuosTruncatedText {...args}>
      <AzuosStatusBadge
        data={{ label: args.data.text }}
        ui={{ tone: 'danger', size: 'sm', className: 'block w-fit max-w-full truncate' }}
      />
    </AzuosTruncatedText>
  ),
};
