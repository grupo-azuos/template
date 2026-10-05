import {
  TASK_STATUS_LABELS,
  TASK_STATUSES,
  type TaskProgress,
  type TaskStatus,
  taskStatusTone,
} from '@template/shared/domain/task-status.util';
import { type Task } from '@template/shared/schemas/task.schema';
import { Check, ListChecks, Pencil, Plus, RotateCcw, SearchX, Trash2 } from 'lucide-react';

import { cn } from '../../utils/cn.util';
import { formatDateTime } from '../../utils/format-date.util';
import { Skeleton } from '../ui/skeleton';
import { AzuosActionButton } from '../azuos-action-button/azuos-action-button.component';
import { AzuosEmptyState } from '../azuos-empty-state/azuos-empty-state.component';
import { AzuosErrorState } from '../azuos-error-state/azuos-error-state.component';
import { AzuosPageHeader } from '../azuos-page-header/azuos-page-header.component';
import { AzuosProgressBar } from '../azuos-progress-bar/azuos-progress-bar.component';
import { AzuosSelectField } from '../azuos-select-field/azuos-select-field.component';
import { AzuosStatusBadge } from '../azuos-status-badge/azuos-status-badge.component';
import { AzuosTextField } from '../azuos-text-field/azuos-text-field.component';

/**
 * A TELA DE TAREFAS — a feature de exemplo do template, e o molde de toda tela de lista.
 *
 * Função pura de props: nenhum hook de dado aqui (CONTRIBUTING §3). A ordem de retorno é a
 * mesma em toda tela, e é o early return da seção 2 aplicado ao JSX:
 *
 *   1. carregando → esqueleto (nunca "nenhum registro" enquanto carrega)
 *   2. erro → o motivo, em vermelho, com "tentar de novo"
 *   3. vazio de verdade → o próximo passo é cadastrar
 *   4. filtro escondeu tudo → o próximo passo é limpar o filtro
 *   5. a lista
 */
export type AzuosTaskListViewProps = {
  data: {
    tasks: Task[];
    total: number;
    progress: TaskProgress;
    filter: { search: string; status: TaskStatus | '' };
  };
  state: {
    isLoading: boolean;
    isRefetching?: boolean;
    isEmpty: boolean;
    isFilteredOut: boolean;
    isTruncated?: boolean;
    error: string | null;
    updatingTaskId?: number | null;
    updateError?: string | null;
    canEdit?: boolean;
    canDelete?: boolean;
  };
  actions: {
    onCreate: () => void;
    onEdit: (task: Task) => void;
    onToggleDone: (task: Task) => void;
    onAskDelete: (task: Task) => void;
    onSearchChange: (search: string) => void;
    onStatusChange: (status: TaskStatus | '') => void;
    onClearFilters: () => void;
    onRetry: () => void;
  };
};

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Todas as situações' },
  ...TASK_STATUSES.map((status) => ({ value: status, label: TASK_STATUS_LABELS[status] })),
];

export function AzuosTaskListView({ data, state, actions }: AzuosTaskListViewProps) {
  const canEdit = state.canEdit ?? true;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 pb-10 sm:px-6">
      <AzuosPageHeader
        data={{ title: 'Tarefas', description: 'O que precisa ser feito, e em que pé está.' }}
      >
        {canEdit ? (
          <AzuosActionButton
            data={{ label: 'Nova tarefa' }}
            ui={{ icon: Plus }}
            actions={{ onClick: actions.onCreate }}
          />
        ) : null}
      </AzuosPageHeader>

      <FilterBar data={data} actions={actions} />

      {state.updateError ? (
        <AzuosErrorState data={{ message: state.updateError }} ui={{ variant: 'inline' }} />
      ) : null}

      <TaskListBody data={data} state={state} actions={actions} />
    </div>
  );
}

function FilterBar({
  data,
  actions,
}: Pick<AzuosTaskListViewProps, 'data'> & { actions: AzuosTaskListViewProps['actions'] }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <AzuosTextField
        data={{
          label: 'Buscar',
          name: 'search',
          value: data.filter.search,
          placeholder: 'Título ou descrição',
        }}
        ui={{ className: 'flex-1' }}
        actions={{ onChange: actions.onSearchChange }}
      />
      <div className="sm:w-56">
        <AzuosSelectField
          data={{ value: data.filter.status, options: STATUS_FILTER_OPTIONS }}
          ui={{
            ariaLabel: 'Situação',
            placeholder: 'Todas as situações',
            className: 'w-full bg-card',
          }}
          actions={{ onChange: (value) => actions.onStatusChange(value as TaskStatus | '') }}
        />
      </div>
    </div>
  );
}

function TaskListBody({ data, state, actions }: AzuosTaskListViewProps) {
  if (state.isLoading) return <TaskListSkeleton />;

  if (state.error) {
    return (
      <AzuosErrorState
        data={{ title: 'A lista de tarefas não carregou', message: state.error }}
        state={{ isRetrying: state.isRefetching }}
        actions={{ onRetry: actions.onRetry }}
      />
    );
  }

  if (state.isEmpty) {
    return (
      <AzuosEmptyState
        data={{
          title: 'Nenhuma tarefa ainda',
          description: 'Cadastre a primeira para começar a acompanhar o trabalho.',
        }}
        ui={{ icon: ListChecks }}
      >
        <AzuosActionButton
          data={{ label: 'Nova tarefa' }}
          ui={{ icon: Plus }}
          actions={{ onClick: actions.onCreate }}
        />
      </AzuosEmptyState>
    );
  }

  if (state.isFilteredOut) {
    return (
      <AzuosEmptyState
        data={{
          title: 'Nenhuma tarefa encontrada',
          description: 'Nada combina com a busca ou a situação escolhida.',
        }}
        ui={{ icon: SearchX }}
      >
        <AzuosActionButton
          data={{ label: 'Limpar filtros' }}
          ui={{ variant: 'secondary' }}
          actions={{ onClick: actions.onClearFilters }}
        />
      </AzuosEmptyState>
    );
  }

  return (
    <section className="flex flex-col gap-3" aria-label="Lista de tarefas">
      <div className="text-ink-500 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span>
          {data.tasks.length} de {data.total} {data.total === 1 ? 'tarefa' : 'tarefas'}
        </span>
        <AzuosProgressBar data={data.progress} ui={{ itemLabel: 'tarefas', className: 'w-56' }} />
      </div>

      {state.isTruncated ? (
        <p className="text-warning text-xs">
          Mostrando só as primeiras {data.tasks.length}. Use a busca para achar as outras.
        </p>
      ) : null}

      <ul className="flex flex-col gap-2">
        {data.tasks.map((task) => (
          <TaskItem key={task.id} data={{ task }} state={state} actions={actions} />
        ))}
      </ul>
    </section>
  );
}

function TaskItem({
  data,
  state,
  actions,
}: {
  data: { task: Task };
  state: AzuosTaskListViewProps['state'];
  actions: AzuosTaskListViewProps['actions'];
}) {
  const { task } = data;
  const isDone = task.status === 'done';
  const canEdit = state.canEdit ?? true;

  return (
    <li className="border-ink-300 bg-card rounded-surface flex flex-col gap-3 border p-4 sm:flex-row sm:items-start">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={cn(
              'text-ink-900 font-semibold break-words',
              isDone && 'text-ink-500 line-through',
            )}
          >
            {task.title}
          </p>
          <AzuosStatusBadge
            data={{ label: TASK_STATUS_LABELS[task.status] }}
            ui={{ tone: taskStatusTone(task.status), size: 'sm' }}
          />
        </div>
        {task.description ? (
          <p className="text-ink-700 mt-1 text-sm break-words whitespace-pre-line">
            {task.description}
          </p>
        ) : null}
        <p className="text-ink-500 mt-2 text-xs">
          Criada em {formatDateTime(task.createdAt)} por {task.createdBy}
        </p>
      </div>

      {canEdit ? (
        <div className="flex shrink-0 gap-1">
          <AzuosActionButton
            data={{ label: isDone ? 'Reabrir tarefa' : 'Marcar como concluída' }}
            ui={{
              icon: isDone ? RotateCcw : Check,
              isIconOnly: true,
              variant: 'ghost',
              size: 'sm',
            }}
            state={{ isLoading: state.updatingTaskId === task.id }}
            actions={{ onClick: () => actions.onToggleDone(task) }}
          />
          <AzuosActionButton
            data={{ label: 'Editar tarefa' }}
            ui={{ icon: Pencil, isIconOnly: true, variant: 'ghost', size: 'sm' }}
            actions={{ onClick: () => actions.onEdit(task) }}
          />
          {(state.canDelete ?? true) ? (
            <AzuosActionButton
              data={{ label: 'Excluir tarefa' }}
              ui={{
                icon: Trash2,
                isIconOnly: true,
                variant: 'ghost',
                size: 'sm',
                className: 'text-destructive hover:text-destructive/80',
              }}
              actions={{ onClick: () => actions.onAskDelete(task) }}
            />
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

/** O esqueleto tem a FORMA da lista: sem isso, a tela pula quando o conteúdo chega. */
function TaskListSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="Carregando tarefas">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="border-ink-300 bg-card rounded-surface border p-4">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-2 h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}
