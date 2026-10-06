import { type Meta, type StoryObj } from '@storybook/react';
import { CheckCircle2, FileText } from 'lucide-react';

import { AzuosTimelineStep } from './azuos-timeline-step.component';

const meta = {
  title: 'Conteúdo e marcadores/AzuosTimelineStep',
  component: AzuosTimelineStep,
} satisfies Meta<typeof AzuosTimelineStep>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: { title: 'Dados da tarefa', description: 'Título e descrição', icon: FileText },
    children: <p className="text-sm">Os campos desta etapa entram aqui.</p>,
  },
  render: (args) => (
    <div className="w-96">
      <AzuosTimelineStep {...args} />
    </div>
  ),
};

export const AllTones: Story = {
  args: { data: { title: 'Dados da tarefa', icon: FileText }, children: null },
  render: () => (
    <div className="w-96">
      <AzuosTimelineStep data={{ title: 'Neutro', icon: FileText }}>
        <p className="text-sm">Etapa que ainda não começou.</p>
      </AzuosTimelineStep>
      <AzuosTimelineStep data={{ title: 'Em foco', icon: FileText }} ui={{ tone: 'brand' }}>
        <p className="text-sm">A etapa de agora.</p>
      </AzuosTimelineStep>
      <AzuosTimelineStep
        data={{ title: 'Pronta', icon: CheckCircle2 }}
        ui={{ tone: 'success', isLast: true }}
      >
        <p className="text-sm">Etapa concluída.</p>
      </AzuosTimelineStep>
    </div>
  ),
};

/** A última etapa não tem linha: ela não tem para onde ir depois. */
export const LastStep: Story = {
  args: {
    data: { title: 'Conferir e salvar', icon: CheckCircle2 },
    ui: { isLast: true, tone: 'success' },
    children: <p className="text-sm">O resumo antes de salvar.</p>,
  },
  render: (args) => (
    <div className="w-96">
      <AzuosTimelineStep {...args} />
    </div>
  ),
};
