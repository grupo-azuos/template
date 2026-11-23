import { type Meta, type StoryObj } from '@storybook/react';
import { Archive, Pencil, Trash2 } from 'lucide-react';

import { AzuosActionMenu } from './azuos-action-menu.component';

const meta = {
  title: 'Ações/AzuosActionMenu',
  component: AzuosActionMenu,
  args: {
    data: {
      label: 'Ações',
      items: [
        { id: 'edit', label: 'Editar', icon: Pencil },
        { id: 'archive', label: 'Arquivar', icon: Archive },
        {
          id: 'delete',
          label: 'Excluir',
          icon: Trash2,
          isDestructive: true,
          separatorBefore: true,
        },
      ],
    },
    actions: { onSelect: () => {} },
  },
} satisfies Meta<typeof AzuosActionMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** O botão cinza com o rótulo. */
export const Default: Story = {};

/** Só os três pontinhos: o menu da linha de tabela e do card. */
export const IconOnly: Story = { args: { ui: { isIconOnly: true } } };

/** Travado enquanto a linha salva. */
export const Disabled: Story = { args: { state: { isDisabled: true } } };
