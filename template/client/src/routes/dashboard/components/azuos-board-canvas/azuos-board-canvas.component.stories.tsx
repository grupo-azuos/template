import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import {
  CELLS_FIXTURE,
  widgetFixture,
  widgetResultFixture,
} from '../../../../lib/utils/dashboard-fixture.util';
import { AzuosBoardCanvas } from './azuos-board-canvas.component';

const RESULT = widgetResultFixture();

const meta = {
  title: 'Components/AzuosBoardCanvas',
  component: AzuosBoardCanvas,
  args: {
    data: {
      widgets: [
        widgetFixture({ id: 'a', kind: 'stats', title: 'Alvarás', groupBy: 'status' }),
        widgetFixture({ id: 'b', kind: 'column', title: 'Por status' }),
        widgetFixture({
          id: 'c',
          kind: 'donut',
          title: 'Por tipo',
          groupBy: 'type',
          filterId: 'f1',
        }),
        widgetFixture({
          id: 'd',
          kind: 'stacked',
          title: 'Movimento da semana',
          source: 'activity',
          groupBy: 'actor',
          splitBy: 'action',
          period: '7d',
        }),
      ],
      layout: [
        { i: 'a', x: 0, y: 0, w: 4, h: 1 },
        { i: 'b', x: 0, y: 1, w: 2, h: 2 },
        { i: 'c', x: 2, y: 1, w: 2, h: 2 },
        { i: 'd', x: 0, y: 3, w: 4, h: 2 },
      ],
      results: {
        a: RESULT,
        b: RESULT,
        c: RESULT,
        d: widgetResultFixture({ cells: CELLS_FIXTURE }),
      },
      filterNames: { f1: 'Vencendo' },
    },
    state: { isEditing: false },
    actions: {
      onLayoutChange: fn(),
      onEditWidget: fn(),
      onRemoveWidget: fn(),
      onChangeKind: fn(),
      onDropKind: fn(),
    },
  },
} satisfies Meta<typeof AzuosBoardCanvas>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Editing: Story = { args: { state: { isEditing: true } } };

export const Empty: Story = { args: { data: { ...meta.args.data, widgets: [], layout: [] } } };
