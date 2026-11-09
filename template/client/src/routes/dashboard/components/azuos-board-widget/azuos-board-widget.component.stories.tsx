import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { type Widget } from '@template/shared/schemas/dashboard-board.schema';

import {
  CELLS_FIXTURE,
  widgetFixture,
  widgetResultFixture,
} from '../../../../lib/utils/dashboard-fixture.util';
import { AzuosBoardWidget } from './azuos-board-widget.component';

const meta = {
  title: 'Components/AzuosBoardWidget',
  component: AzuosBoardWidget,
  decorators: [(Story) => <div className="h-80 w-[36rem]">{Story()}</div>],
  args: {
    data: { widget: widgetFixture(), result: widgetResultFixture(), filterName: null },
    state: { isEditing: false },
    actions: { onEdit: fn(), onRemove: fn() },
  },
} satisfies Meta<typeof AzuosBoardWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

function withWidget(widget: Partial<Widget>, cells = false): Story {
  return {
    args: {
      data: {
        ...meta.args.data,
        widget: widgetFixture(widget),
        result: widgetResultFixture(cells ? { cells: CELLS_FIXTURE } : {}),
      },
    },
  };
}

export const Default: Story = {};

export const Donut: Story = withWidget({ kind: 'donut', title: 'Por status' });

export const Cards: Story = withWidget({ kind: 'stats', title: 'Tarefas', groupBy: 'status' });

export const HeroWithZuzu: Story = withWidget({
  kind: 'hero',
  title: 'Em aberto',
  groupBy: null,
});

/** O destaque agrupado: os grupos viram cards lado a lado (até quatro) dentro dele. */
export const HeroWithCards: Story = {
  ...withWidget({ kind: 'hero', title: 'Tarefas', groupBy: 'status' }),
  decorators: [(Story) => <div className="h-[28rem] w-[64rem]">{Story()}</div>],
};

export const EditingWithKindSwitch: Story = {
  args: {
    state: { isEditing: true },
    actions: { onEdit: fn(), onRemove: fn(), onChangeKind: fn() },
  },
};

export const Radar: Story = withWidget({ kind: 'radar', title: 'Por status' });

export const Treemap: Story = withWidget({
  kind: 'treemap',
  title: 'Por quem cadastrou',
  groupBy: 'createdBy',
});

export const Gauge: Story = withWidget({
  kind: 'radial',
  title: 'Meus no total',
  groupBy: null,
  onlyMine: true,
});

export const StackedBars: Story = withWidget(
  {
    kind: 'stacked',
    title: 'Movimento da semana',
    source: 'activity',
    groupBy: 'actor',
    splitBy: 'action',
    period: '7d',
  },
  true,
);

export const Heatmap: Story = withWidget(
  { kind: 'heatmap', title: 'Status × quem cadastrou', groupBy: 'status', splitBy: 'createdBy' },
  true,
);

export const Sankey: Story = withWidget(
  { kind: 'sankey', title: 'Status → quem cadastrou', groupBy: 'status', splitBy: 'createdBy' },
  true,
);

export const ScopedList: Story = {
  args: {
    data: {
      ...meta.args.data,
      filterName: 'Atrasadas',
      widget: widgetFixture({ kind: 'list', groupBy: 'createdBy', onlyMine: true, period: 'month' }),
    },
  },
};

export const Editing: Story = { args: { state: { isEditing: true } } };

export const Loading: Story = {
  args: { data: { ...meta.args.data, result: { data: null, isLoading: true, error: null } } },
};

export const WithError: Story = {
  args: {
    data: {
      ...meta.args.data,
      result: { data: null, isLoading: false, error: 'O filtro deste bloco foi arquivado.' },
    },
  },
};
