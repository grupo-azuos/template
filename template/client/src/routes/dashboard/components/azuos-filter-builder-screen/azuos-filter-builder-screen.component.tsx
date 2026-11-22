import {
  Archive,
  ArchiveRestore,
  CircleAlert,
  CircleDashed,
  Info,
  Pencil,
  Save,
} from 'lucide-react';
import { type ReactNode } from 'react';
import { type Field, type FullOption, QueryBuilder, type RuleGroupType } from 'react-querybuilder';
import 'react-querybuilder/dist/query-builder-layout.css';

import {
  DATA_SOURCE_KEYS,
  DATA_SOURCES,
  type DataField,
  type DataSourceKey,
  fieldsOf,
  type FilterGroup,
} from '@template/shared/schemas/dashboard-board.schema';

import { AzuosActionButton } from '../../../../lib/components/azuos-action-button/azuos-action-button.component';
import { AzuosExpandableScreen } from '../../../../lib/components/azuos-expandable-screen/azuos-expandable-screen.component';
import { AzuosFilterField } from '../../../../lib/components/azuos-filter-field/azuos-filter-field.component';
import { AzuosSegmentedControl } from '../../../../lib/components/azuos-segmented-control/azuos-segmented-control.component';
import { AzuosSelectField } from '../../../../lib/components/azuos-select-field/azuos-select-field.component';
import { AzuosTextAreaField } from '../../../../lib/components/azuos-text-area-field/azuos-text-area-field.component';
import { AzuosTextField } from '../../../../lib/components/azuos-text-field/azuos-text-field.component';
import { type SavedFiltersModel } from '../../../../lib/view-models/use-saved-filters.model';
import {
  AddControl,
  NotControl,
  RemoveControl,
  SelectControl,
  ValueControl,
} from './filter-builder-controls';

/**
 * O MONTADOR DE FILTRO — a tela que se expande. À esquerda, os filtros salvos do sistema (os
 * seus e os da equipe), para abrir, arquivar ou trazer de volta; à direita, o canvas: nome, para
 * quem é, de qual fonte, e a árvore de grupos E/OU, um dentro do outro.
 *
 * O que está errado aparece antes de salvar, em frase — o mesmo que o servidor recusaria.
 */
export type AzuosFilterBuilderScreenProps = SavedFiltersModel;

const OPERATORS: Record<DataField['type'], { name: string; label: string }[]> = {
  enum: [
    { name: '=', label: 'é' },
    { name: '!=', label: 'não é' },
    { name: 'in', label: 'é um destes' },
    { name: 'notIn', label: 'não é nenhum destes' },
    { name: 'null', label: 'está vazio' },
    { name: 'notNull', label: 'está preenchido' },
  ],
  text: [
    { name: '=', label: 'é igual a' },
    { name: '!=', label: 'é diferente de' },
    { name: 'contains', label: 'contém' },
    { name: 'doesNotContain', label: 'não contém' },
    { name: 'beginsWith', label: 'começa com' },
    { name: 'null', label: 'está vazio' },
    { name: 'notNull', label: 'está preenchido' },
  ],
  date: [
    { name: '=', label: 'é em' },
    { name: '<', label: 'antes de' },
    { name: '<=', label: 'até' },
    { name: '>', label: 'depois de' },
    { name: '>=', label: 'a partir de' },
    { name: 'between', label: 'entre' },
    { name: 'null', label: 'está vazio' },
    { name: 'notNull', label: 'está preenchido' },
  ],
  boolean: [{ name: '=', label: 'é' }],
};

const COMBINATORS = [
  { name: 'and', label: 'E — todas as condições' },
  { name: 'or', label: 'OU — qualquer uma' },
];

const TRANSLATIONS = {
  addRule: { label: 'Condição', title: 'Adicionar condição' },
  addGroup: { label: 'Grupo', title: 'Adicionar grupo' },
  removeRule: { label: 'Remover', title: 'Remover condição' },
  removeGroup: { label: 'Remover', title: 'Remover grupo' },
  fields: { title: 'Campo' },
  operators: { title: 'Operador' },
  combinators: { title: 'Como juntar' },
};

const CONTROLS = {
  fieldSelector: SelectControl,
  operatorSelector: SelectControl,
  combinatorSelector: SelectControl,
  valueEditor: ValueControl,
  addRuleAction: AddControl,
  addGroupAction: AddControl,
  removeRuleAction: RemoveControl,
  removeGroupAction: RemoveControl,
  notToggle: NotControl,
};

const SCOPE_OPTIONS = [
  { value: 'personal', label: 'Só eu' },
  { value: 'shared', label: 'Toda a equipe' },
];

export function fieldsFor(source: DataSourceKey): Field[] {
  return Object.entries(DATA_SOURCES[source].fields as Record<string, DataField>).map(
    ([name, field]) => ({
      name,
      label: field.label,
      inputType: field.type,
      isPerson: field.isPerson === true,
      values: field.options?.map((option) => ({
        name: option,
        label: optionLabel(source, option),
      })) as FullOption[] | undefined,
      operators: OPERATORS[field.type],
    }),
  );
}

/**
 * As opções guardadas em código (`todo`, `task.updated`) aparecem em português — o rótulo vem da
 * própria fonte (`dashboard-sources.ts`), e o motor não conhece fonte nenhuma.
 */
export function optionLabel(source: DataSourceKey, option: string): string {
  for (const field of Object.values(fieldsOf(source))) {
    const label = field.optionLabels?.[option];
    if (label) return label;
  }

  return option;
}

export function AzuosFilterBuilderScreen({ data, state, actions }: AzuosFilterBuilderScreenProps) {
  const draft = data.draft;

  return (
    <AzuosExpandableScreen
      data={{
        title: draft?.id ? 'Editar filtro' : 'Montar filtro',
        description: 'Grupos E/OU, um dentro do outro. O filtro salvo serve a qualquer dashboard.',
      }}
      state={{ isOpen: state.isOpen }}
      actions={{ onClose: actions.onClose }}
      footer={
        <>
          <AzuosActionButton
            data={{ label: 'Cancelar' }}
            ui={{ variant: 'secondary' }}
            actions={{ onClick: actions.onClose }}
          />
          <AzuosActionButton
            data={{ label: 'Salvar filtro', loadingLabel: 'Salvando…' }}
            ui={{ icon: Save }}
            state={{ isDisabled: data.problems.length > 0, isLoading: state.isSaving }}
            actions={{ onClick: actions.onSave }}
          />
        </>
      }
    >
      <div className="grid gap-6 p-6 lg:grid-cols-[18rem_1fr]">
        <SavedList data={data} actions={actions} />
        {draft ? (
          /* Dois grupos com nome (Lei de Miller): o que o filtro É (nome, descrição, quem usa) e o
             que ele PEGA (a fonte e as condições). */
          <section aria-label="O filtro" className="flex min-w-0 flex-col gap-5">
            <FormGroup
              data={{
                legend: 'Sobre o filtro',
                hint: 'Como ele aparece na lista e quem pode usar.',
              }}
            >
              {/* Nome e "Quem usa" na mesma linha — são as duas decisões curtas; a descrição, texto
                  livre e opcional, fica embaixo com espaço para escrever. */}
              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <AzuosTextField
                  data={{
                    label: 'Nome do filtro',
                    name: 'filterName',
                    value: draft.name,
                    placeholder: 'Ex.: Vencendo este mês',
                    isRequired: true,
                  }}
                  ui={{ className: 'min-w-0 flex-1' }}
                  actions={{ onChange: (name) => actions.onDraftChange({ name }) }}
                />
                <AzuosFilterField data={{ label: 'Quem usa' }}>
                  <AzuosSegmentedControl
                    data={{ value: draft.scope, options: SCOPE_OPTIONS }}
                    ui={{ ariaLabel: 'Quem usa o filtro' }}
                    actions={{
                      onChange: (scope) =>
                        actions.onDraftChange({ scope: scope as 'personal' | 'shared' }),
                    }}
                  />
                </AzuosFilterField>
              </div>
              <AzuosTextAreaField
                data={{
                  label: 'Descrição (opcional)',
                  name: 'filterDescription',
                  value: draft.description ?? '',
                  placeholder: 'Para que serve este filtro, em uma frase.',
                }}
                ui={{ rows: 3 }}
                actions={{
                  onChange: (description) =>
                    actions.onDraftChange({ description: description || null }),
                }}
              />
            </FormGroup>

            <FormGroup
              data={{
                legend: 'As condições',
                hint: 'Quais itens entram. Sem condição, entra tudo.',
              }}
            >
              <AzuosFilterField data={{ label: 'Fonte de dados' }}>
                <AzuosSelectField
                  data={{
                    value: draft.source,
                    options: DATA_SOURCE_KEYS.map((key) => ({
                      value: key,
                      label: DATA_SOURCES[key].label,
                    })),
                  }}
                  ui={{ ariaLabel: 'Fonte de dados', className: 'w-full md:w-72' }}
                  actions={{
                    onChange: (source) =>
                      actions.onDraftChange({ source: source as DataSourceKey }),
                  }}
                />
              </AzuosFilterField>
              <QueryBuilder
                key={draft.source}
                fields={fieldsFor(draft.source)}
                query={draft.tree as RuleGroupType}
                onQueryChange={(query) => actions.onTreeChange(query as FilterGroup)}
                combinators={COMBINATORS}
                controlElements={CONTROLS}
                context={{ people: data.people }}
                translations={TRANSLATIONS}
                listsAsArrays
                showNotToggle
                resetOnFieldChange
                /* O grupo não tem fundo: os campos são cinza cheio (`bg-muted`) e, sobre um grupo
                   cinza, sumiam no claro e no escuro. O grupo de dentro se marca por um fio à
                   esquerda, como a régua de um índice; a moldura do CSS da biblioteca sai (`!`). */
                controlClassnames={{
                  queryBuilder: 'flex flex-col gap-3',
                  ruleGroup:
                    'flex flex-col gap-3 border-0! p-0! [&_.ruleGroup]:border-border [&_.ruleGroup]:border-l-2! [&_.ruleGroup]:pl-3!',
                  header: 'flex flex-wrap items-center gap-2',
                  body: 'flex flex-col gap-2 pl-4',
                  rule: 'flex flex-wrap items-center gap-2',
                }}
              />
              {draft.tree.rules.length === 0 ? (
                <p className="text-ink-500 flex items-center gap-2 text-sm">
                  <Info className="size-4 shrink-0" aria-hidden="true" />
                  Nenhuma condição ainda: o filtro pega tudo de {DATA_SOURCES[draft.source].noun}.
                  Use “Condição” para recortar.
                </p>
              ) : null}
            </FormGroup>

            <Problems data={{ problems: data.problems, error: state.error }} />
          </section>
        ) : null}
      </div>
    </AzuosExpandableScreen>
  );
}

function SavedList({ data, actions }: Pick<AzuosFilterBuilderScreenProps, 'data' | 'actions'>) {
  return (
    <aside aria-label="Filtros salvos" className="flex flex-col gap-4">
      <div>
        <h3 className="text-ink-900 mb-2 text-sm font-semibold">Filtros salvos</h3>
        {data.filters.length === 0 ? (
          <p className="text-ink-500 text-sm">Nenhum ainda. O que você salvar aparece aqui.</p>
        ) : null}
        <ul className="flex flex-col gap-1">
          {data.filters.map((filter) => (
            <li
              key={filter.id}
              className="rounded-box hover:bg-accent flex items-center justify-between gap-2 px-2 py-1.5"
            >
              <span className="min-w-0">
                <span className="text-ink-900 block truncate text-sm font-medium">
                  {filter.name}
                </span>
                <span className="text-ink-500 block truncate text-xs">
                  {DATA_SOURCES[filter.source].label} ·{' '}
                  {filter.scope === 'shared' ? 'Equipe' : 'Só eu'}
                </span>
              </span>
              {filter.canEdit ? (
                <span className="flex shrink-0">
                  <AzuosActionButton
                    data={{ label: `Editar ${filter.name}` }}
                    ui={{ variant: 'ghost', size: 'sm', icon: Pencil, isIconOnly: true }}
                    actions={{ onClick: () => actions.onOpenExisting(filter.id) }}
                  />
                  <AzuosActionButton
                    data={{ label: `Arquivar ${filter.name}` }}
                    ui={{ variant: 'ghost', size: 'sm', icon: Archive, isIconOnly: true }}
                    actions={{ onClick: () => actions.onArchive(filter.id) }}
                  />
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
      {data.archived.length > 0 ? (
        <div>
          <h3 className="text-ink-500 mb-2 text-xs font-semibold uppercase">Arquivados</h3>
          <ul className="flex flex-col gap-1">
            {data.archived.map((filter) => (
              <li key={filter.id} className="flex items-center justify-between gap-2 px-2 py-1">
                <span className="text-ink-500 truncate text-sm">{filter.name}</span>
                {filter.canEdit ? (
                  <AzuosActionButton
                    data={{ label: `Desarquivar ${filter.name}` }}
                    ui={{ variant: 'ghost', size: 'sm', icon: ArchiveRestore, isIconOnly: true }}
                    actions={{ onClick: () => actions.onRestore(filter.id) }}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}

/**
 * O que falta para salvar é LEMBRETE, não erro: aparece neutro, com o ícone, antes de a pessoa
 * ter digitado qualquer coisa (antes era um vermelho "Dê um nome" já na abertura). Vermelho só o
 * que deu errado de verdade — a recusa do servidor.
 */
function Problems({ data }: { data: { problems: string[]; error: string | null } }) {
  if (data.problems.length === 0 && !data.error) return null;

  return (
    <div className="flex flex-col gap-2">
      {data.problems.length > 0 ? (
        <div className="rounded-box bg-muted text-ink-700 p-3 text-sm">
          <p className="text-ink-900 mb-1 font-semibold">Para salvar:</p>
          <ul className="flex flex-col gap-1">
            {data.problems.map((problem) => (
              <li key={problem} className="flex items-center gap-2">
                <CircleDashed className="text-ink-500 size-4 shrink-0" aria-hidden="true" />
                {problem}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {data.error ? (
        <p role="alert" className="text-hue-red flex items-center gap-2 text-sm font-medium">
          <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
          {data.error}
        </p>
      ) : null}
    </div>
  );
}

/** Um grupo do formulário, com nome e uma frase do que ele decide. */
function FormGroup({
  data,
  children,
}: {
  data: { legend: string; hint: string };
  children: ReactNode;
}) {
  return (
    <fieldset className="rounded-surface bg-card shadow-card flex flex-col gap-4 p-4">
      <legend className="text-ink-900 px-1 text-sm font-bold">
        {data.legend}
        <span className="text-ink-500 ml-2 text-xs font-normal">{data.hint}</span>
      </legend>
      {children}
    </fieldset>
  );
}
