import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { EMPTY_BOARD_FILTER_VALUES } from '@template/shared/schemas/dashboard-board.schema';

import {
  PEOPLE_FIXTURE,
  widgetFixture,
  widgetResultFixture,
} from '../../../../lib/utils/dashboard-fixture.util';
import { AzuosBoardStudio } from './azuos-board-studio.component';

const WIDGETS = [
  widgetFixture({ id: 'a', kind: 'column', title: 'Tarefas por status', groupBy: 'status' }),
  widgetFixture({ id: 'b', kind: 'donut', title: 'Por status', groupBy: 'status' }),
  widgetFixture({ id: 'c', kind: 'list', title: 'Por quem cadastrou', groupBy: 'createdBy' }),
];

const meta = {
  title: 'Dashboard/AzuosBoardStudio',
  component: AzuosBoardStudio,
  args: {
    data: {
      scopeLabel: 'Equipe',
      widgets: WIDGETS,
      layout: [
        { i: 'a', x: 0, y: 0, w: 2, h: 2 },
        { i: 'b', x: 2, y: 0, w: 2, h: 2 },
        { i: 'c', x: 0, y: 2, w: 4, h: 2 },
      ],
      results: {
        a: widgetResultFixture({
          total: 12,
          series: [
            { key: 'doing', label: 'Em andamento', value: 7 },
            { key: 'done', label: 'Concluída', value: 5 },
          ],
        }),
      },
      filterNames: {},
      boardFilters: [{ id: 'periodo', kind: 'period', label: 'Período' }],
      filterValues: EMPTY_BOARD_FILTER_VALUES,
      people: PEOPLE_FIXTURE,
    },
    state: { isOpen: true, isSaving: false, canAdd: true, error: null },
    actions: {
      onFilterValueChange: fn(),
      onAddBoardFilter: fn(),
      onRemoveBoardFilter: fn(),
      onLayoutChange: fn(),
      onNewWidget: fn(),
      onEditWidget: fn(),
      onRemoveWidget: fn(),
      onChangeKind: fn(),
      onOpenFilters: fn(),
      onCancel: fn(),
      onSave: fn(),
    },
  },
} satisfies Meta<typeof AzuosBoardStudio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Building: Story = {};

export const Empty: Story = {
  args: { data: { ...meta.args.data, widgets: [], layout: [] } },
};

export const AtLimit: Story = { args: { state: { ...meta.args.state, canAdd: false } } };

export const Saving: Story = { args: { state: { ...meta.args.state, isSaving: true } } };
