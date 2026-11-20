import { Plus, Trash2, UserRound } from 'lucide-react';
import {
  type ActionProps,
  type Field,
  type FullOption,
  type NotToggleProps,
  type ValueEditorProps,
  type ValueSelectorProps,
} from 'react-querybuilder';

import { ME_VALUE } from '@template/shared/schemas/dashboard-board.schema';

import { AzuosActionButton } from '../../../../lib/components/azuos-action-button/azuos-action-button.component';
import { AzuosCheckboxField } from '../../../../lib/components/azuos-checkbox-field/azuos-checkbox-field.component';
import {
  AzuosPersonPickerField,
  type AzuosPersonPickerPerson,
} from '../../../../lib/components/azuos-person-picker-field/azuos-person-picker-field.component';
import { Input } from '../../../../lib/components/azuos-input/azuos-input';
import { AzuosMultiSelectField } from '../../../../lib/components/azuos-multi-select-field/azuos-multi-select-field.component';
import { AzuosSelectField } from '../../../../lib/components/azuos-select-field/azuos-select-field.component';

/**
 * OS CONTROLES DO MONTADOR DE FILTRO — os do projeto, no lugar dos que o `react-querybuilder`
 * traz (que usam `<select>` nativo, proibido aqui). Cada um recebe as props da biblioteca e
 * devolve o componente `Azuos*` equivalente.
 */
function optionsOf(options: ValueSelectorProps['options']): { value: string; label: string }[] {
  return (options as FullOption[]).map((option) => ({ value: option.name, label: option.label }));
}

/** Campo, operador e "E/OU" — todos são uma escolha numa lista. */
export function SelectControl(props: ValueSelectorProps) {
  return (
    <AzuosSelectField
      data={{ value: props.value ?? '', options: optionsOf(props.options) }}
      ui={{ ariaLabel: props.title, className: 'min-w-40' }}
      state={{ isDisabled: props.disabled }}
      actions={{ onChange: props.handleOnChange }}
    />
  );
}

export function AddControl(props: ActionProps) {
  return (
    <AzuosActionButton
      data={{ label: String(props.label ?? 'Adicionar') }}
      ui={{ variant: 'secondary', size: 'sm', icon: Plus }}
      state={{ isDisabled: props.disabled }}
      actions={{ onClick: () => props.handleOnClick() }}
    />
  );
}

export function RemoveControl(props: ActionProps) {
  return (
    <AzuosActionButton
      data={{ label: props.title ?? 'Remover' }}
      ui={{ variant: 'ghost', size: 'sm', icon: Trash2, isIconOnly: true }}
      state={{ isDisabled: props.disabled }}
      actions={{ onClick: () => props.handleOnClick() }}
    />
  );
}

export function NotControl(props: NotToggleProps) {
  return (
    <AzuosCheckboxField
      data={{
        label: 'Inverter (NÃO)',
        name: `not-${props.path.join('-')}`,
        isChecked: Boolean(props.checked),
      }}
      state={{ isDisabled: props.disabled }}
      actions={{ onChange: props.handleOnChange }}
    />
  );
}

type FieldData = Field & { inputType?: string; values?: FullOption[]; isPerson?: boolean };

/** O valor de uma condição, no formato do campo: lista, data, sim/não, pessoa ou texto. */
export function ValueControl(props: ValueEditorProps) {
  const field = props.fieldData as FieldData;
  if (props.operator === 'null' || props.operator === 'notNull') return null;
  if (field.inputType === 'boolean') return <BooleanValue {...props} />;
  if (field.inputType === 'enum') return <EnumValue {...props} />;
  if (field.inputType === 'date') return <DateValue {...props} />;
  if (field.isPerson && (props.operator === '=' || props.operator === '!=')) {
    return <PersonValue {...props} />;
  }

  return (
    <Input
      aria-label={`Valor de ${field.label}`}
      value={String(props.value ?? '')}
      onChange={(event) => props.handleOnChange(event.target.value)}
      className="w-56"
    />
  );
}

/** O que a tela de filtro passa para os controles: quem pode ser escolhido num campo de pessoa. */
export type FilterBuilderContext = { people: AzuosPersonPickerPerson[] };

/**
 * O CAMPO DE PESSOA É A LISTA DE QUEM USA O SISTEMA, com a foto, e a condição guarda o ID.
 *
 * Era uma caixa de texto: o nome digitado errado virava um filtro que nunca acha ninguém, e o
 * nome de quem muda de nome deixava o filtro salvo para trás. "Eu" continua no topo da lista: o
 * filtro vale para quem estiver vendo — no painel da equipe, cada um vê o seu.
 */
function PersonValue(props: ValueEditorProps) {
  const field = props.fieldData as FieldData;
  const people = (props.context as FilterBuilderContext | undefined)?.people ?? [];

  return (
    <AzuosPersonPickerField
      data={{
        value: String(props.value ?? ''),
        people,
        leading: [{ value: ME_VALUE, label: 'Eu (quem está vendo)', icon: UserRound }],
      }}
      ui={{ ariaLabel: `Valor de ${field.label}`, className: 'w-64' }}
      actions={{ onChange: props.handleOnChange }}
    />
  );
}

function BooleanValue(props: ValueEditorProps) {
  return (
    <AzuosSelectField
      data={{
        value: props.value === false || props.value === 'false' ? 'false' : 'true',
        options: [
          { value: 'true', label: 'Sim' },
          { value: 'false', label: 'Não' },
        ],
      }}
      ui={{ ariaLabel: 'Valor' }}
      actions={{ onChange: (value) => props.handleOnChange(value === 'true') }}
    />
  );
}

function EnumValue(props: ValueEditorProps) {
  const field = props.fieldData as FieldData;
  const options = (field.values ?? []).map((option) => ({
    value: option.name,
    label: option.label,
  }));
  if (props.operator === 'in' || props.operator === 'notIn') {
    return (
      <AzuosMultiSelectField
        data={{
          values: Array.isArray(props.value) ? props.value.map(String) : [],
          options,
          placeholder: 'Escolha',
          noun: 'valores',
        }}
        ui={{ ariaLabel: `Valores de ${field.label}` }}
        actions={{ onChange: props.handleOnChange }}
      />
    );
  }

  return (
    <AzuosSelectField
      data={{ value: String(props.value ?? ''), options }}
      ui={{ ariaLabel: `Valor de ${field.label}`, placeholder: 'Escolha' }}
      actions={{ onChange: props.handleOnChange }}
    />
  );
}

function DateValue(props: ValueEditorProps) {
  if (props.operator !== 'between') {
    return (
      <Input
        type="date"
        aria-label="Data"
        value={String(props.value ?? '')}
        onChange={(event) => props.handleOnChange(event.target.value)}
        className="w-44"
      />
    );
  }
  const [from = '', to = ''] = Array.isArray(props.value) ? props.value.map(String) : [];

  return (
    <span className="flex items-center gap-2">
      <Input
        type="date"
        aria-label="De"
        value={from}
        onChange={(event) => props.handleOnChange([event.target.value, to])}
        className="w-44"
      />
      <span className="text-sm text-ink-500">até</span>
      <Input
        type="date"
        aria-label="Até"
        value={to}
        onChange={(event) => props.handleOnChange([from, event.target.value])}
        className="w-44"
      />
    </span>
  );
}
