import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { AzuosExpandableScreen } from './azuos-expandable-screen.component';

const meta = {
  title: 'Conteúdo e marcadores/AzuosExpandableScreen',
  component: AzuosExpandableScreen,
  parameters: { layout: 'fullscreen' },
  args: {
    data: { title: 'Montar filtro', description: 'Grupos E/OU, um dentro do outro.' },
    state: { isOpen: true },
    actions: { onClose: fn() },
    children: <div className="p-6">O canvas do filtro entra aqui.</div>,
  },
} satisfies Meta<typeof AzuosExpandableScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const WithFooter: Story = {
  args: { footer: <span className="text-sm text-ink-500">Cancelar · Salvar</span> },
};
