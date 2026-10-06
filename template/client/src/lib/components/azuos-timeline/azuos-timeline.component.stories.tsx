import { type Meta, type StoryObj } from '@storybook/react';
import { CheckCircle2, FileText, Send } from 'lucide-react';

import { AzuosTimelineStep } from '../azuos-timeline-step/azuos-timeline-step.component';
import { AzuosTimeline } from './azuos-timeline.component';

const meta = {
  title: 'Conteúdo e marcadores/AzuosTimeline',
  component: AzuosTimeline,
} satisfies Meta<typeof AzuosTimeline>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: null },
  render: () => (
    <div className="w-96">
      <AzuosTimeline>
        <AzuosTimelineStep
          data={{ title: 'Dados da tarefa', description: 'Título e descrição', icon: FileText }}
          ui={{ tone: 'brand' }}
        >
          <p className="text-sm">Os campos desta etapa entram aqui.</p>
        </AzuosTimelineStep>
        <AzuosTimelineStep data={{ title: 'Responsável', icon: Send }}>
          <p className="text-sm">A escolha de quem vai fazer.</p>
        </AzuosTimelineStep>
        <AzuosTimelineStep
          data={{ title: 'Conferir e salvar', icon: CheckCircle2 }}
          ui={{ isLast: true, tone: 'success' }}
        >
          <p className="text-sm">O resumo antes de salvar.</p>
        </AzuosTimelineStep>
      </AzuosTimeline>
    </div>
  ),
};

/** Uma etapa só: sem linha nenhuma — ela não tem para onde ir depois. */
export const SingleStep: Story = {
  args: { children: null },
  render: () => (
    <div className="w-96">
      <AzuosTimeline>
        <AzuosTimelineStep
          data={{ title: 'Dados da tarefa', icon: FileText }}
          ui={{ isLast: true }}
        >
          <p className="text-sm">Os campos desta etapa entram aqui.</p>
        </AzuosTimelineStep>
      </AzuosTimeline>
    </div>
  ),
};
