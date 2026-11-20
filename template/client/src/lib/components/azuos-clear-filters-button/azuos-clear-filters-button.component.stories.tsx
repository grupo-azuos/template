import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { AzuosClearFiltersButton } from './azuos-clear-filters-button.component';

const meta = {
  title: 'Ações/AzuosClearFiltersButton',
  component: AzuosClearFiltersButton,
  args: { state: { hasFilter: true }, actions: { onClear: fn() } },
} satisfies Meta<typeof AzuosClearFiltersButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Sem filtro ligado, o botão não aparece — a tela fica sem nada no lugar dele. */
export const WithoutFilter: Story = {
  args: { state: { hasFilter: false } },
};

/** Na ponta direita de uma barra de filtros, como fica nas telas. */
export const InFilterBar: Story = {
  render: (args) => (
    <div className="rounded-surface bg-card flex items-center gap-3 p-3">
      <span className="text-ink-700 text-sm">Status: ATIVO</span>
      <AzuosClearFiltersButton {...args} ui={{ className: 'ml-auto' }} />
    </div>
  ),
};
