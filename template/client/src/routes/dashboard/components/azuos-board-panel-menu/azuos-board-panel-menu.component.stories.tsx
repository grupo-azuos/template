import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { AzuosBoardPanelMenu } from './azuos-board-panel-menu.component';

/**
 * O menu do título de um bloco do painel, como no Grafana. Quem só vê tem o "Ver"; quem monta
 * tem também Editar, Duplicar e Remover.
 */
const meta = {
  title: 'Dashboard/AzuosBoardPanelMenu',
  component: AzuosBoardPanelMenu,
  args: {
    data: { title: 'Tarefas por status' },
    actions: { onView: fn(), onEdit: fn(), onDuplicate: fn(), onRemove: fn() },
  },
} satisfies Meta<typeof AzuosBoardPanelMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Quem pode montar: as quatro ações. */
export const Default: Story = { args: { state: { canEdit: true } } };

/** Quem só vê: só o "Ver". */
export const OnlyView: Story = { args: { state: { canEdit: false } } };

/** Caso limite: título longo, que só aparece no rótulo do botão. */
export const LongTitle: Story = {
  args: {
    data: { title: 'Tarefas concluídas por quem cadastrou nos últimos noventa dias' },
    state: { canEdit: true },
  },
};
