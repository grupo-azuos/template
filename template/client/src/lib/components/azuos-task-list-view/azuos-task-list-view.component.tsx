import {
  TASK_STATUS_LABELS,
  TASK_STATUSES,
  type TaskProgress,
  type TaskStatus,
  taskStatusTone,
} from '@template/shared/domain/task-status.util';
import { type Task } from '@template/shared/schemas/task.schema';
import { Check, ListChecks, Pencil, Plus, RotateCcw, SearchX, Trash2 } from 'lucide-react';

import { formatDateTime } from '../../utils/format-date.util';
import { Skeleton } from '../ui/skeleton';
import { AzuosActionButton } from '../azuos-action-button/azuos-action-button.component';
import { type AzuosActionMenuItem } from '../azuos-action-menu/azuos-action-menu.component';
import { AzuosEmptyState } from '../azuos-empty-state/azuos-empty-state.component';
import { AzuosErrorState } from '../azuos-error-state/azuos-error-state.component';
import { AzuosPageHeader } from '../azuos-page-header/azuos-page-header.component';
import { AzuosProgressBar } from '../azuos-progress-bar/azuos-progress-bar.component';
import { AzuosContentCard } from '../azuos-content-card/azuos-content-card.component';
import { AzuosSelectField } from '../azuos-select-field/azuos-select-field.component';
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
      <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-sm">
        <span>
          {data.tasks.length} de {data.total} {data.total === 1 ? 'tarefa' : 'tarefas'}
        </span>
        <AzuosProgressBar data={data.progress} ui={{ itemLabel: 'tarefas', className: 'w-56' }} />
      </div>

      {state.isTruncated ? (
        <p className="text-warning-ink text-xs">
          Mostrando só as primeiras {data.tasks.length}. Use a busca para achar as outras.
        </p>
      ) : null}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.tasks.map((task) => (
          <TaskItem key={task.id} data={{ task }} state={state} actions={actions} />
        ))}
      </ul>
    </section>
  );
}

/* O que cada item do menu do card faz — a ação de linha mora no menu (padrão do grupo). */
const TASK_MENU_ACTIONS: Record<
  string,
  (actions: AzuosTaskListViewProps['actions'], task: Task) => void
> = {
  toggle: (actions, task) => actions.onToggleDone(task),
  edit: (actions, task) => actions.onEdit(task),
  delete: (actions, task) => actions.onAskDelete(task),
};

/** O menu do card: concluir ou reabrir, editar e, para quem pode, excluir. */
export function taskMenuItems(task: Task, canDelete: boolean): AzuosActionMenuItem[] {
  const isDone = task.status === 'done';

  return [
    {
      id: 'toggle',
      label: isDone ? 'Reabrir tarefa' : 'Marcar como concluída',
      icon: isDone ? RotateCcw : Check,
    },
    { id: 'edit', label: 'Editar tarefa', icon: Pencil },
    ...(canDelete
      ? [
          {
            id: 'delete',
            label: 'Excluir tarefa',
            icon: Trash2,
            isDestructive: true,
            separatorBefore: true,
          },
        ]
      : []),
  ];
}

/**
 * A TAREFA no card padrão do grupo (`AzuosContentCard`): a situação na faixa, o título, a
 * descrição, e no rodapé quem criou (com a foto) e quando. Abrir o card edita a tarefa; concluir,
 * editar e excluir ficam no menu de três pontinhos.
 */
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
  const canEdit = state.canEdit ?? true;

  return (
    <li className="flex">
      <AzuosContentCard
        data={{
          label: `Abrir a tarefa ${task.title}`,
          title: task.title,
          status: { label: TASK_STATUS_LABELS[task.status], tone: taskStatusTone(task.status) },
          footer: {
            title: `Criada em ${formatDateTime(task.createdAt)}`,
            subtitle: task.createdBy,
            person: { name: task.createdBy },
          },
          menu: canEdit
            ? {
                label: `Ações da tarefa ${task.title}`,
                items: taskMenuItems(task, state.canDelete ?? true),
              }
            : null,
        }}
        ui={{
          icon: ListChecks,
          iconTone: taskStatusTone(task.status),
          className: 'w-full',
          body: task.description ? (
            <p className="text-muted-foreground line-clamp-3 text-sm [overflow-wrap:anywhere] break-words whitespace-pre-line">
              {task.description}
            </p>
          ) : null,
        }}
        state={{ isMenuDisabled: state.updatingTaskId === task.id }}
        actions={{
          onOpen: canEdit ? () => actions.onEdit(task) : undefined,
          onMenuSelect: (id) => TASK_MENU_ACTIONS[id]?.(actions, task),
        }}
      />
    </li>
  );
}

/** O esqueleto tem a FORMA da lista: sem isso, a tela pula quando o conteúdo chega. */
function TaskListSkeleton() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Carregando tarefas"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="bg-card shadow-card rounded-surface flex flex-col gap-3 p-4">
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="mt-4 h-6 w-1/2" />
        </div>
      ))}
    </div>
  );
}
