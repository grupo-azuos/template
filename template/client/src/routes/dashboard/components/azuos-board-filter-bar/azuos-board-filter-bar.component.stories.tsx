import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { EMPTY_BOARD_FILTER_VALUES } from '@template/shared/schemas/dashboard-board.schema';

import { PEOPLE_FIXTURE } from '../../../../lib/utils/dashboard-fixture.util';
import { AzuosBoardFilterBar } from './azuos-board-filter-bar.component';

const meta = {
  title: 'Dashboard/AzuosBoardFilterBar',
  component: AzuosBoardFilterBar,
  args: {
    data: {
      filters: [
        { id: 'pessoa', kind: 'person', label: 'Pessoa' },
        { id: 'periodo', kind: 'period', label: 'Período' },
      ],
      values: EMPTY_BOARD_FILTER_VALUES,
      people: PEOPLE_FIXTURE,
    },
    state: { isEditing: false },
    actions: { onChange: fn(), onAdd: fn(), onRemove: fn() },
  },
} satisfies Meta<typeof AzuosBoardFilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Chosen: Story = {
  args: {
    data: {
      ...meta.args.data,
      values: {
        ...EMPTY_BOARD_FILTER_VALUES,
        person: 'u-bia',
        period: { mode: 'relative', direction: 'last', count: 30, unit: 'day' },
      },
    },
  },
};

export const ExactDates: Story = {
  args: {
    data: {
      ...meta.args.data,
      values: {
        ...EMPTY_BOARD_FILTER_VALUES,
        period: { mode: 'custom', from: '2026-11-01', to: '2026-11-30' },
      },
    },
  },
};

/* Os filtros de campo do sistema (`dashboard-sources.ts`): no template, o status da tarefa. */
export const FieldFilters: Story = {
  args: {
    data: {
      ...meta.args.data,
      filters: [{ id: 'taskStatus', kind: 'taskStatus', label: 'Status da tarefa' }],
      values: { ...EMPTY_BOARD_FILTER_VALUES, taskStatus: 'doing' },
    },
  },
};

export const Building: Story = {
  args: {
    data: { ...meta.args.data, filters: [{ id: 'periodo', kind: 'period', label: 'Período' }] },
    state: { isEditing: true },
  },
};

/* Caso limite: montando um painel ainda sem filtro nenhum — só os botões de pôr. */
export const BuildingEmpty: Story = {
  args: { data: { ...meta.args.data, filters: [] }, state: { isEditing: true } },
};
