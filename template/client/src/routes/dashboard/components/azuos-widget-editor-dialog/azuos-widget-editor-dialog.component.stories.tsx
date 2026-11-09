import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { type SavedFilter } from '@template/shared/schemas/dashboard-board.schema';

import { widgetFixture } from '../../../../lib/utils/dashboard-fixture.util';
import { AzuosWidgetEditorDialog } from './azuos-widget-editor-dialog.component';

const FILTERS: [SavedFilter, SavedFilter] = [
  {
    id: '0190a000-0000-7000-8000-000000000001',
    name: 'Só as minhas',
    description: null,
    source: 'tasks',
    scope: 'personal',
    tree: { combinator: 'and', rules: [{ field: 'createdBy', operator: '=', value: '@me' }] },
    ownerId: '00000000-0000-0000-0000-000000000001',
    ownerName: 'Leyla',
    canEdit: true,
    archive: null,
    updatedAt: '2026-11-01T12:00:00.000Z',
  },
  {
    id: '0190a000-0000-7000-8000-000000000002',
    name: 'Movimento da equipe',
    description: null,
    source: 'activity',
    scope: 'shared',
    tree: { combinator: 'and', rules: [] },
    ownerId: '00000000-0000-0000-0000-000000000002',
    ownerName: 'Bruno',
    canEdit: false,
    archive: null,
    updatedAt: '2026-11-01T12:00:00.000Z',
  },
];

const meta = {
  title: 'Components/AzuosWidgetEditorDialog',
  component: AzuosWidgetEditorDialog,
  args: {
    data: {
      editing: {
        widget: widgetFixture({ title: 'Por status', filterId: FILTERS[0].id }),
        isNew: false,
      },
      filters: FILTERS,
    },
    actions: { onClose: fn(), onSubmit: fn(), onOpenFilters: fn() },
  },
} satisfies Meta<typeof AzuosWidgetEditorDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NewBlock: Story = {
  args: {
    data: {
      ...meta.args.data,
      editing: { widget: widgetFixture({ id: 'w2', title: '' }), isNew: true },
    },
  },
};

export const Calendar: Story = {
  args: {
    data: {
      ...meta.args.data,
      editing: {
        widget: widgetFixture({
          id: 'w3',
          kind: 'calendar',
          title: 'Cadastradas por dia',
          groupBy: 'createdDay',
        }),
        isNew: false,
      },
    },
  },
};

export const TwoGroupingsOnlyMine: Story = {
  args: {
    data: {
      ...meta.args.data,
      editing: {
        widget: widgetFixture({
          id: 'w4',
          kind: 'stacked',
          title: 'Movimento da semana',
          source: 'activity',
          groupBy: 'actor',
          splitBy: 'action',
          onlyMine: true,
          period: '7d',
        }),
        isNew: false,
      },
    },
  },
};

export const NoSavedFilters: Story = { args: { data: { ...meta.args.data, filters: [] } } };
