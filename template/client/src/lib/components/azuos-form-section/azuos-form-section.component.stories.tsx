import { type Meta, type StoryObj } from '@storybook/react';
import { MessageSquare } from 'lucide-react';

import { AzuosFormSection } from './azuos-form-section.component';

const meta = {
  title: 'Primitives/AzuosFormSection',
  component: AzuosFormSection,
  args: {
    data: { title: 'Conversas', description: 'Cada comentário é salvo na hora.' },
    children: <p className="text-sm">Conteúdo do bloco.</p>,
  },
} satisfies Meta<typeof AzuosFormSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithIcon: Story = { args: { ui: { icon: MessageSquare } } };

export const WithoutDescription: Story = { args: { data: { title: 'Conversas' } } };

/** Travado: o conteúdo dá lugar ao motivo, escrito. */
export const Locked: Story = {
  args: {
    ui: { icon: MessageSquare },
    state: { lockedMessage: 'Salve o alvará para registrar conversas.' },
  },
};

export const LongTitle: Story = {
  args: {
    data: {
      title: 'Protocolos do Corpo de Bombeiros consultados pela automação do SIAPI',
      description:
        'Um alvará pode ter mais de um protocolo quando a empresa tem unidades distintas no mesmo processo.',
    },
  },
};
