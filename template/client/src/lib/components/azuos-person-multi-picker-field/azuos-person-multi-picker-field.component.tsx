import { AzuosMultiSelectField } from '../azuos-multi-select-field/azuos-multi-select-field.component';
import {
  type AzuosPersonPickerPerson,
  personOptions,
} from '../azuos-person-picker-field/azuos-person-picker-field.component';

/**
 * O CAMPO DE VÁRIAS PESSOAS — o par de `AzuosPersonPickerField` para quando a escolha é de mais
 * de uma (regra `select-standard`): a mesma lista, com a foto de cada um, e os valores são IDs.
 */
export type AzuosPersonMultiPickerFieldProps = {
  data: { values: string[]; people: AzuosPersonPickerPerson[]; placeholder?: string };
  ui: { ariaLabel: string; className?: string };
  state?: { isDisabled?: boolean };
  actions: { onChange: (ids: string[]) => void };
};

export function AzuosPersonMultiPickerField({
  data,
  ui,
  state,
  actions,
}: AzuosPersonMultiPickerFieldProps) {
  return (
    <AzuosMultiSelectField
      data={{
        values: data.values,
        options: personOptions(data.people),
        placeholder: data.placeholder ?? 'Escolha as pessoas',
        noun: 'pessoas',
      }}
      ui={ui}
      state={state}
      actions={actions}
    />
  );
}
