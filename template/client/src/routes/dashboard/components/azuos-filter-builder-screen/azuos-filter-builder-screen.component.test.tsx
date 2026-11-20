import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { type SavedFilter } from '@template/shared/schemas/dashboard-board.schema';

import {
  AzuosFilterBuilderScreen,
  type AzuosFilterBuilderScreenProps,
  fieldsFor,
  optionLabel,
} from './azuos-filter-builder-screen.component';

const LEYLA_ID = '00000000-0000-0000-0000-000000000001';

const MINE: SavedFilter = {
  id: '0190a000-0000-7000-8000-000000000001',
  name: 'Só os meus',
  description: null,
  source: 'tasks',
  scope: 'personal',
  tree: { combinator: 'and', rules: [{ field: 'createdBy', operator: '=', value: LEYLA_ID }] },
  ownerId: LEYLA_ID,
  ownerName: 'Leyla',
  canEdit: true,
  archive: null,
  updatedAt: '2026-11-01T12:00:00.000Z',
};

function makeProps(
  overrides: Partial<AzuosFilterBuilderScreenProps['data']> = {},
): AzuosFilterBuilderScreenProps {
  return {
    data: {
      filters: [
        MINE,
        {
          ...MINE,
          id: '0190a000-0000-7000-8000-000000000002',
          name: 'Da equipe',
          scope: 'shared',
          canEdit: false,
        },
      ],
      archived: [
        {
          ...MINE,
          id: '0190a000-0000-7000-8000-000000000003',
          name: 'Antigo',
          archive: { archivedAt: '2026-11-02T12:00:00.000Z', archivedBy: null },
        },
      ],
      draft: {
        id: null,
        name: 'Atrasadas',
        description: null,
        source: 'tasks',
        scope: 'shared',
        tree: MINE.tree,
      },
      problems: [],
      people: [{ id: LEYLA_ID, name: 'Leyla', photo: null }],
      ...overrides,
    },
    state: { isLoading: false, isSaving: false, isOpen: true, error: null },
    actions: {
      onOpenNew: vi.fn(),
      onOpenExisting: vi.fn(),
      onClose: vi.fn(),
      onDraftChange: vi.fn(),
      onTreeChange: vi.fn(),
      onSave: vi.fn(),
      onArchive: vi.fn(),
      onRestore: vi.fn(),
    },
  };
}

describe('AzuosFilterBuilderScreen', () => {
  // feliz
  it('lists saved filters, edits, archives, restores and saves the draft', () => {
    const props = makeProps();
    render(<AzuosFilterBuilderScreen {...props} />);

    expect(screen.getByRole('dialog', { name: 'Montar filtro' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome do filtro/)).toHaveValue('Atrasadas');
    fireEvent.click(screen.getByRole('button', { name: 'Editar Só os meus' }));
    fireEvent.click(screen.getByRole('button', { name: 'Arquivar Só os meus' }));
    fireEvent.click(screen.getByRole('button', { name: 'Desarquivar Antigo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar filtro' }));
    expect(props.actions.onOpenExisting).toHaveBeenCalledWith(MINE.id);
    expect(props.actions.onArchive).toHaveBeenCalledWith(MINE.id);
    expect(props.actions.onRestore).toHaveBeenCalledWith('0190a000-0000-7000-8000-000000000003');
    expect(props.actions.onSave).toHaveBeenCalled();
  });

  // feliz
  it('shows another person filter without edit or archive', () => {
    render(<AzuosFilterBuilderScreen {...makeProps()} />);

    expect(screen.getByText('Da equipe')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar Da equipe' })).not.toBeInTheDocument();
  });

  // triste
  it('lists what is missing as a reminder, not an alert, and blocks saving', () => {
    render(<AzuosFilterBuilderScreen {...makeProps({ problems: ['Dê um nome ao filtro'] })} />);

    expect(screen.getByText('Para salvar:')).toBeInTheDocument();
    expect(screen.getByText('Dê um nome ao filtro')).toBeInTheDocument();
    // Lembrete não é erro: o alerta fica só para a recusa do servidor.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar filtro' })).toBeDisabled();
  });

  // triste
  it('shows the server refusal as an alert', () => {
    const props = makeProps();
    render(
      <AzuosFilterBuilderScreen {...props} state={{ ...props.state, error: 'Sem permissão' }} />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Sem permissão');
  });

  // feliz
  it('explains that a filter without conditions takes everything', () => {
    const props = makeProps();
    render(
      <AzuosFilterBuilderScreen
        {...props}
        data={{
          ...props.data,
          draft: { ...props.data.draft!, tree: { combinator: 'and', rules: [] } },
        }}
      />,
    );

    expect(screen.getByText(/Nenhuma condição ainda/)).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /As condições/ })).toBeInTheDocument();
  });

  // triste
  it('renders nothing when closed', () => {
    const props = makeProps();
    render(<AzuosFilterBuilderScreen {...props} state={{ ...props.state, isOpen: false }} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // feliz
  it('picks the person from the list of users and keeps the id', () => {
    const props = makeProps();
    render(<AzuosFilterBuilderScreen {...props} />);

    const field = screen.getByRole('combobox', { name: 'Valor de Quem cadastrou' });
    expect(field).toHaveTextContent('Leyla');
    expect(
      screen.queryByRole('textbox', { name: 'Valor de Quem cadastrou' }),
    ).not.toBeInTheDocument();
  });

  // feliz
  it('lets a person field mean "me" for whoever views it', async () => {
    const props = makeProps();
    const { rerender } = render(<AzuosFilterBuilderScreen {...props} />);

    fireEvent.click(screen.getByRole('combobox', { name: 'Valor de Quem cadastrou' }));
    fireEvent.click(await screen.findByRole('option', { name: /Eu \(quem está vendo\)/ }));
    const tree = vi.mocked(props.actions.onTreeChange).mock.calls.at(-1)?.[0];
    expect(tree?.rules[0]).toMatchObject({ field: 'createdBy', value: '@me' });

    rerender(
      <AzuosFilterBuilderScreen
        {...props}
        data={{
          ...props.data,
          draft: {
            ...props.data.draft!,
            tree: {
              combinator: 'and',
              rules: [{ field: 'createdBy', operator: '=', value: '@me' }],
            },
          },
        }}
      />,
    );
    expect(screen.getByText('Eu (quem está vendo)')).toBeInTheDocument();
  });
});

describe('fieldsFor', () => {
  // feliz
  it('maps source fields to their type operators and Portuguese option labels', () => {
    const status = fieldsFor('tasks').find((field) => field.name === 'status');

    expect(status?.operators?.map((operator) => (operator as { name: string }).name)).toContain(
      'in',
    );
    expect(status?.values?.length).toBeGreaterThan(0);
  });

  // feliz
  it('labels the options with the source own labels and flags the person field', () => {
    expect(optionLabel('tasks', 'doing')).toBe('Em andamento');
    expect(optionLabel('activity', 'task.updated')).toBe('Alterou a tarefa');
    expect(fieldsFor('activity').find((field) => field.name === 'actor')).toMatchObject({
      isPerson: true,
    });
  });

  // triste
  it('shows an option without a label as it is, and offers no "contains" on a date field', () => {
    expect(optionLabel('tasks', 'unknown')).toBe('unknown');
    const expires = fieldsFor('tasks').find((field) => field.name === 'createdAt');

    expect(
      expires?.operators?.map((operator) => (operator as { name: string }).name),
    ).not.toContain('contains');
  });
});
