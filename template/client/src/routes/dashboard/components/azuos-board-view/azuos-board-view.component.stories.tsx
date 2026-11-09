import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { EMPTY_BOARD_FILTER_VALUES } from '@template/shared/schemas/dashboard-board.schema';

import {
  PEOPLE_FIXTURE,
  widgetFixture,
  widgetResultFixture,
} from '../../../../lib/utils/dashboard-fixture.util';
import { AzuosBoardView } from './azuos-board-view.component';

const RESULT = widgetResultFixture();

const meta = {
  title: 'Composers/AzuosBoardView',
  component: AzuosBoardView,
  args: {
    data: {
      scope: 'team',
      scopes: [
        { value: 'team', label: 'Equipe' },
        { value: 'manager', label: 'Gestor' },
        { value: 'personal', label: 'Pessoal' },
      ],
      widgets: [
        widgetFixture({ id: 'a', kind: 'stats', title: 'Tarefas', groupBy: 'status' }),
        widgetFixture({ id: 'b', kind: 'column', title: 'Por status' }),
        widgetFixture({
          id: 'c',
          kind: 'list',
          title: 'Movimento',
          source: 'activity',
          groupBy: 'actor',
        }),
      ],
      layout: [
        { i: 'a', x: 0, y: 0, w: 4, h: 1 },
        { i: 'b', x: 0, y: 1, w: 2, h: 2 },
        { i: 'c', x: 2, y: 1, w: 2, h: 2 },
      ],
      results: { a: RESULT, b: RESULT, c: RESULT },
      editing: null,
      preview: null,
      updatedAt: '2026-11-06T18:30:00.000Z',
      filters: [],
      boardFilters: [
        { id: 'pessoa', kind: 'person', label: 'Pessoa' },
        { id: 'periodo', kind: 'period', label: 'Período' },
      ],
      filterValues: EMPTY_BOARD_FILTER_VALUES,
      people: PEOPLE_FIXTURE,
    },
    state: {
      isLoading: false,
      isEditing: false,
      isSaving: false,
      isRefreshing: false,
      canEdit: true,
      canAdd: true,
      error: null,
      isFilterScreenOpen: false,
    },
    actions: {
      onScopeChange: fn(),
      onRefresh: fn(),
      onStartEdit: fn(),
      onCancelEdit: fn(),
      onSave: fn(),
      onLayoutChange: fn(),
      onNewWidget: fn(),
      onEditWidget: fn(),
      onCloseEditor: fn(),
      onSubmitWidget: fn(),
      onRemoveWidget: fn(),
      onOpenFilters: fn(),
      onPreviewChange: fn(),
      onFilterValueChange: fn(),
      onAddBoardFilter: fn(),
      onRemoveBoardFilter: fn(),
    },
  },
} satisfies Meta<typeof AzuosBoardView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Editing: Story = { args: { state: { ...meta.args.state, isEditing: true } } };

export const ReadOnly: Story = {
  args: {
    data: {
      ...meta.args.data,
      scopes: [
        { value: 'team', label: 'Equipe' },
        { value: 'personal', label: 'Pessoal' },
      ],
    },
    state: { ...meta.args.state, canEdit: false },
  },
};

export const Loading: Story = { args: { state: { ...meta.args.state, isLoading: true } } };

export const WithError: Story = {
  args: { state: { ...meta.args.state, error: 'Não foi possível abrir o painel.' } },
};
