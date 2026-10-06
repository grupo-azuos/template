import { type Meta, type StoryObj } from '@storybook/react';

import { AzuosUsageMeter } from './azuos-usage-meter.component';

const meta = {
  title: 'Gráficos e números/AzuosUsageMeter',
  component: AzuosUsageMeter,
} satisfies Meta<typeof AzuosUsageMeter>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { data: { label: 'Disco', percentage: 42, detail: '6,7 GB de 16 GB' } },
};

/** Os três tons. Aqui CHEIO É RUIM — o contrário da barra de progresso. */
export const AllTones: Story = {
  args: { data: { label: 'Disco', percentage: 42 } },
  render: () => (
    <div className="flex w-72 flex-col gap-4">
      <AzuosUsageMeter data={{ label: 'Tranquilo (42%)', percentage: 42 }} />
      <AzuosUsageMeter data={{ label: 'Atenção (80%)', percentage: 80 }} />
      <AzuosUsageMeter data={{ label: 'Crítico (95%)', percentage: 95 }} />
    </div>
  ),
};

export const WithoutDetail: Story = {
  args: { data: { label: 'Memória', percentage: 68 } },
};

/** Caso limite: medida fora da faixa. A barra não vaza nem desaparece para a esquerda. */
export const OutOfRange: Story = {
  args: { data: { label: 'Cota', percentage: 142, detail: 'Medida inconsistente' } },
};

/** Caso limite: rótulo longo numa coluna estreita — corta, não empurra o número. */
export const LongLabelInNarrowColumn: Story = {
  args: {
    data: {
      label: 'Disco principal do servidor de arquivos do setor',
      percentage: 91,
      detail: '1,8 TB de 2 TB',
    },
  },
  render: (args) => (
    <div className="border-ink-300 w-56 border border-dashed p-2">
      <AzuosUsageMeter {...args} />
    </div>
  ),
};
