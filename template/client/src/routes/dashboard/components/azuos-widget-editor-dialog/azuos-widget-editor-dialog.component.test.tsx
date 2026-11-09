import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { type SavedFilter, type Widget } from '@template/shared/schemas/dashboard-board.schema';

import { widgetFixture } from '../../../../lib/utils/dashboard-fixture.util';
import {
  AzuosWidgetEditorDialog,
  type AzuosWidgetEditorDialogProps,
  windowForMode,
  withUnit,
} from './azuos-widget-editor-dialog.component';
import {
  filterOptions,
  fitGroup,
  groupOptions,
  sourceHasDays,
  splitOptions,
} from './widget-editor.util';

/* As fontes são as de EXEMPLO do template (`dashboard-sources.ts`): tarefas e o movimento. */
describe('agenda in the editor', () => {
  // feliz
  it('groups an agenda by day with this month as window, shown instead of the period', () => {
    const props = makeProps({ ...WIDGET, title: '' }, true);
    render(<AzuosWidgetEditorDialog {...props} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Agenda' }));
    expect(screen.getByRole('group', { name: 'Janela da agenda' })).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Período' })).not.toBeInTheDocument();
    // A janela aparece no campo e no selo da pré-visualização.
    expect(screen.getAllByText(/Próximo 1 mês/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar bloco' }));

    expect(props.actions.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'agenda',
        groupBy: 'createdDay',
        window: { mode: 'relative', unit: 'month', count: 1, direction: 'next' },
      }),
    );
  });

  // feliz
  it('keeps the count when switching unit if possible, and starts exact dates at the current window', () => {
    const relative = {
      mode: 'relative' as const,
      unit: 'week' as const,
      count: 2,
      direction: 'next' as const,
    };

    expect(withUnit(relative, 'day')).toMatchObject({ unit: 'day', count: 7 });
    expect(withUnit({ ...relative, count: 1 }, 'month')).toMatchObject({ count: 1 });
    expect(windowForMode('last', relative)).toMatchObject({ direction: 'last' });
    expect(windowForMode('custom', relative)).toMatchObject({ mode: 'custom' });
  });

  // triste
  it('restarts at one month when leaving exact dates, and the period does not apply to an agenda', () => {
    const custom = { mode: 'custom' as const, from: '2026-11-01', to: '2026-11-30' };

    expect(windowForMode('next', custom)).toEqual({
      mode: 'relative',
      unit: 'month',
      count: 1,
      direction: 'next',
    });
    expect(windowForMode('custom', custom)).toBe(custom);
    expect(sourceHasDays('activity')).toBe(true);
    expect(fitGroup({ ...WIDGET, kind: 'column', window: custom }).window).toBeNull();
    expect(
      fitGroup({ ...WIDGET, kind: 'agenda', source: 'activity', groupBy: null, period: '7d' }),
    ).toMatchObject({ source: 'activity', groupBy: 'day', period: 'all' });
  });
});

describe('wide preview', () => {
  // feliz
  /* Ampliar é DENTRO do diálogo: o formulário sai da frente e volta com o que foi preenchido —
     o rascunho é o mesmo dos dois lados. */
  it('widens the preview in the dialog and comes back with the draft kept', () => {
    const props = makeProps({ ...WIDGET, title: '' }, true);
    render(<AzuosWidgetEditorDialog {...props} />);
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Meu bloco' } });

    fireEvent.click(screen.getByRole('button', { name: 'Ampliar pré-visualização' }));
    expect(screen.queryByLabelText('Título')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Meu bloco' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Voltar ao formulário' }));
    expect(screen.getByLabelText('Título')).toHaveValue('Meu bloco');
  });

  // triste
  it('still submits from the footer while the preview is wide', () => {
    const props = makeProps({ ...WIDGET, title: 'Bloco' }, true);
    render(<AzuosWidgetEditorDialog {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ampliar pré-visualização' }));
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar bloco' }));

    expect(props.actions.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Bloco' }),
    );
  });
});

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

const WIDGET: Widget = widgetFixture({ title: 'Por status' });

function makeProps(widget: Widget | null = WIDGET, isNew = false): AzuosWidgetEditorDialogProps {
  return {
    data: { editing: widget ? { widget, isNew } : null, filters: FILTERS },
    actions: { onClose: vi.fn(), onSubmit: vi.fn(), onOpenFilters: vi.fn() },
  };
}

describe('AzuosWidgetEditorDialog', () => {
  // feliz
  it('applies the edited block with the new title', () => {
    const props = makeProps();
    render(<AzuosWidgetEditorDialog {...props} />);

    fireEvent.change(screen.getByLabelText(/Título/), { target: { value: 'Tarefas por status' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
    expect(props.actions.onSubmit).toHaveBeenCalledWith({ ...WIDGET, title: 'Tarefas por status' });
  });

  // feliz
  it('asks for the filter builder, and hides without losing what was filled in', () => {
    const props = makeProps();
    const { rerender } = render(<AzuosWidgetEditorDialog {...props} />);
    fireEvent.change(screen.getByLabelText(/Título/), { target: { value: 'Rascunho' } });
    fireEvent.click(screen.getByRole('button', { name: 'Montar filtro' }));
    expect(props.actions.onOpenFilters).toHaveBeenCalled();

    rerender(<AzuosWidgetEditorDialog {...props} state={{ isHidden: true }} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    rerender(<AzuosWidgetEditorDialog {...props} state={{ isHidden: false }} />);
    expect(screen.getByLabelText(/Título/)).toHaveValue('Rascunho');
  });

  // feliz
  it('prefills a new block with a suggested title that follows kind and grouping', () => {
    const props = makeProps({ ...WIDGET, title: '' }, true);
    render(<AzuosWidgetEditorDialog {...props} />);

    expect(screen.getByLabelText(/Título/)).toHaveValue('Tarefas por status');
    fireEvent.click(screen.getByRole('radio', { name: 'Destaque' }));
    expect(screen.getByLabelText(/Título/)).toHaveValue('Destaque');
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar bloco' }));

    expect(props.actions.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'hero', title: 'Destaque' }),
    );
  });

  // feliz
  it('falls back to the suggested title when the title is cleared', () => {
    const props = makeProps();
    render(<AzuosWidgetEditorDialog {...props} />);

    fireEvent.change(screen.getByLabelText(/Título/), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(props.actions.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Tarefas por status' }),
    );
  });

  // triste
  it('rejects a title that is too long and shows why', () => {
    const props = makeProps();
    render(<AzuosWidgetEditorDialog {...props} />);

    fireEvent.change(screen.getByLabelText(/Título/), { target: { value: 'x'.repeat(61) } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(props.actions.onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  // triste
  it('keeps a typed title when the kind changes', () => {
    render(<AzuosWidgetEditorDialog {...makeProps()} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Rosca' }));

    expect(screen.getByLabelText(/Título/)).toHaveValue('Por status');
  });

  // feliz
  it('offers "only mine" on a source with a person, and sends it', () => {
    const props = makeProps();
    render(<AzuosWidgetEditorDialog {...props} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /Só os meus/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(props.actions.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ onlyMine: true }),
    );
  });

  // feliz
  it('asks pair blocks for a split, and single-value blocks for no grouping', () => {
    const { rerender } = render(
      <AzuosWidgetEditorDialog
        {...makeProps(widgetFixture({ kind: 'heatmap', splitBy: 'createdBy' }))}
      />,
    );
    expect(screen.getByRole('combobox', { name: 'Dividir por' })).toBeInTheDocument();

    rerender(
      <AzuosWidgetEditorDialog
        {...makeProps(widgetFixture({ id: 'w3', kind: 'radial', groupBy: null }))}
      />,
    );
    expect(screen.queryByRole('combobox', { name: 'Agrupar por' })).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Período' })).toBeInTheDocument();
  });

  // feliz
  it('picks the chart from the kind grid and sends every change to the preview', () => {
    const props = makeProps();
    const onPreviewChange = vi.fn();
    render(
      <AzuosWidgetEditorDialog
        {...props}
        data={{
          ...props.data,
          preview: {
            data: { total: 42, grandTotal: 42, series: [], cells: [] },
            isLoading: false,
            error: null,
          },
        }}
        actions={{ ...props.actions, onPreviewChange }}
      />,
    );

    expect(
      screen.getByRole('complementary', { name: 'Pré-visualização em tempo real' }),
    ).toHaveTextContent('42 tarefas');
    fireEvent.click(screen.getByRole('radio', { name: 'Rosca' }));

    expect(screen.getByRole('radio', { name: 'Rosca' })).toHaveAttribute('aria-checked', 'true');
    expect(onPreviewChange).toHaveBeenCalledWith(expect.objectContaining({ kind: 'donut' }));
  });

  // triste
  it('waits instead of showing zero while the preview has no numbers', () => {
    render(<AzuosWidgetEditorDialog {...makeProps()} />);

    expect(
      screen.getByRole('complementary', { name: 'Pré-visualização em tempo real' }),
    ).toHaveTextContent('…');
  });

  // triste
  it('renders nothing without an open block', () => {
    render(<AzuosWidgetEditorDialog {...makeProps(null)} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('block grouping and filters', () => {
  // feliz
  it('offers each chart only the grouping it can draw', () => {
    expect(groupOptions({ ...WIDGET, kind: 'calendar' }).map((option) => option.value)).toEqual([
      'createdDay',
    ]);
    expect(groupOptions({ ...WIDGET, kind: 'area' }).map((option) => option.value)).toEqual([
      'createdDay',
      'createdMonth',
    ]);
    expect(groupOptions({ ...WIDGET, kind: 'stats' })[0]).toEqual({
      value: '',
      label: 'Sem agrupar (o total)',
    });
  });

  // feliz
  it('fixes the grouping by itself when switching to a time chart', () => {
    expect(fitGroup({ ...WIDGET, kind: 'calendar' }).groupBy).toBe('createdDay');
    // O destaque agrupa: os grupos viram os cards ao lado do Zuzu.
    expect(fitGroup({ ...WIDGET, kind: 'hero' }).groupBy).toBe('status');
    expect(fitGroup({ ...WIDGET, kind: 'radial' }).groupBy).toBeNull();
    expect(fitGroup({ ...WIDGET, kind: 'stats', groupBy: null }).groupBy).toBeNull();
  });

  // feliz
  it('gives pair blocks a split other than the grouping, and drops it elsewhere', () => {
    const pair = fitGroup({ ...WIDGET, kind: 'stacked' });
    expect(pair.splitBy).not.toBeNull();
    expect(pair.splitBy).not.toBe(pair.groupBy);
    expect(splitOptions(pair).map((option) => option.value)).not.toContain('status');
    expect(fitGroup({ ...pair, kind: 'column' }).splitBy).toBeNull();
  });

  // triste
  it('keeps "only mine" when the source has a person', () => {
    expect(
      fitGroup({ ...WIDGET, onlyMine: true, source: 'activity', groupBy: 'actor' }).onlyMine,
    ).toBe(true);
  });

  // triste
  it('leaves out filters from another source and archived ones', () => {
    const archived = {
      ...FILTERS[0],
      id: '0190a000-0000-7000-8000-000000000003',
      name: 'Velho',
      archive: { archivedAt: '2026-11-02T12:00:00.000Z', archivedBy: null },
    };

    expect(filterOptions([...FILTERS, archived], 'tasks').map((option) => option.label)).toEqual([
      'Sem filtro (tudo)',
      'Só as minhas',
    ]);
    expect(filterOptions(FILTERS, 'activity')[1]?.label).toBe(
      'Movimento da equipe (compartilhado)',
    );
  });
});
