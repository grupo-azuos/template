import { type Meta, type StoryObj } from '@storybook/react';
import { BookmarkCheck, Clock, FileText, Flag, Gavel, Mail, Phone, Star } from 'lucide-react';
import { fn } from 'storybook/test';

import { AzuosIconPicker } from './azuos-icon-picker.component';

const OPTIONS = [
  { value: 'bookmark-check', label: 'Marcador', icon: BookmarkCheck },
  { value: 'clock', label: 'Relógio', icon: Clock },
  { value: 'file-text', label: 'Documento', icon: FileText },
  { value: 'phone', label: 'Telefone', icon: Phone },
  { value: 'mail', label: 'E-mail', icon: Mail },
  { value: 'gavel', label: 'Martelo', icon: Gavel },
  { value: 'flag', label: 'Bandeira', icon: Flag },
  { value: 'star', label: 'Estrela', icon: Star },
];

const meta = {
  title: 'Importados/AzuosIconPicker',
  component: AzuosIconPicker,
  args: {
    data: { value: 'bookmark-check', options: OPTIONS },
    ui: { label: 'Ícone' },
    actions: { onChange: fn() },
  },
} satisfies Meta<typeof AzuosIconPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Nada escolhido ainda: nenhum aparece marcado. */
export const NoneSelected: Story = {
  args: { data: { value: null, options: OPTIONS } },
};

export const Disabled: Story = {
  args: { state: { isDisabled: true } },
};

/** Caso limite: coluna estreita — a grade quebra linha. */
export const NarrowColumn: Story = {
  render: (args) => (
    <div className="w-40">
      <AzuosIconPicker {...args} />
    </div>
  ),
};
