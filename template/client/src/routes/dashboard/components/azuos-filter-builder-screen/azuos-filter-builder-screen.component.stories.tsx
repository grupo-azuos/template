import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { type SavedFilter } from '@template/shared/schemas/dashboard-board.schema';

import { AzuosFilterBuilderScreen } from './azuos-filter-builder-screen.component';

const MINE: SavedFilter = {
  id: '0190a000-0000-7000-8000-000000000001',
  name: 'Só as minhas',
  description: null,
  source: 'tasks',
  scope: 'personal',
  tree: {
    combinator: 'and',
    rules: [
      { field: 'createdBy', operator: '=', value: '00000000-0000-0000-0000-000000000001' },
      {
        combinator: 'or',
        rules: [
          { field: 'status', operator: '=', value: 'doing' },
          { field: 'createdAt', operator: '>=', value: '2026-11-01' },
        ],
      },
    ],
  },
  ownerId: '00000000-0000-0000-0000-000000000001',
  ownerName: 'Leyla',
  canEdit: true,
  archive: null,
  updatedAt: '2026-11-01T12:00:00.000Z',
};

const meta = {
  title: 'Components/AzuosFilterBuilderScreen',
  component: AzuosFilterBuilderScreen,
  args: {
    data: {
      filters: [MINE],
      archived: [],
      draft: {
        id: MINE.id,
        name: MINE.name,
        description: null,
        source: 'tasks',
        scope: 'personal',
        tree: MINE.tree,
      },
      problems: [],
      people: [
        { id: '00000000-0000-0000-0000-000000000001', name: 'Leyla', photo: null },
        { id: '00000000-0000-0000-0000-000000000002', name: 'Bruno Costa', photo: null },
      ],
    },
    state: { isLoading: false, isSaving: false, isOpen: true, error: null },
    actions: {
      onOpenNew: fn(),
      onOpenExisting: fn(),
      onClose: fn(),
      onDraftChange: fn(),
      onTreeChange: fn(),
      onSave: fn(),
      onArchive: fn(),
      onRestore: fn(),
    },
  },
} satisfies Meta<typeof AzuosFilterBuilderScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NewFilter: Story = {
  args: {
    data: {
      ...meta.args.data,
      filters: [],
      draft: {
        id: null,
        name: '',
        description: null,
        source: 'tasks',
        scope: 'personal',
        tree: { combinator: 'and', rules: [] },
      },
    },
  },
};

export const WithProblem: Story = {
  args: { data: { ...meta.args.data, problems: ['O filtro passa de 4 níveis de grupo'] } },
};

export const Saving: Story = { args: { state: { ...meta.args.state, isSaving: true } } };
