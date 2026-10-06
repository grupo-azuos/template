import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { AzuosSelectField } from '../azuos-select-field/azuos-select-field.component';
import { AzuosFilterField } from './azuos-filter-field.component';

const meta = {
  title: 'Formulários/AzuosFilterField',
  component: AzuosFilterField,
} satisfies Meta<typeof AzuosFilterField>;

export default meta;

type Story = StoryObj<typeof meta>;

const STATUS_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'todo', label: 'A fazer' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'done', label: 'Concluída' },
];

export const Default: Story = {
  args: {
    data: { label: 'Situação' },
    children: (
      <AzuosSelectField
        data={{ value: '', options: STATUS_OPTIONS }}
        ui={{ ariaLabel: 'Situação' }}
        actions={{ onChange: fn() }}
      />
    ),
  },
};

/** A barra de filtros inteira: é aqui que o rótulo em cima prova o seu valor. */
export const FilterBar: Story = {
  args: { data: { label: 'Situação' } },
  render: () => (
    <div className="flex flex-wrap items-end gap-3">
      <AzuosFilterField data={{ label: 'Situação' }} ui={{ className: 'w-44' }}>
        <AzuosSelectField
          data={{ value: 'todo', options: STATUS_OPTIONS }}
          ui={{ ariaLabel: 'Situação' }}
          actions={{ onChange: fn() }}
        />
      </AzuosFilterField>
      <AzuosFilterField data={{ label: 'Responsável' }} ui={{ className: 'w-44' }}>
        <AzuosSelectField
          data={{
            value: '',
            options: [
              { value: '', label: 'Todos' },
              { value: 'mariana', label: 'Mariana Ribeiro' },
            ],
          }}
          ui={{ ariaLabel: 'Responsável' }}
          actions={{ onChange: fn() }}
        />
      </AzuosFilterField>
    </div>
  ),
};

/** Caso limite: rótulo longo numa coluna estreita — o controle não estoura a largura. */
export const LongLabelInNarrowColumn: Story = {
  args: {
    data: { label: 'Situação da tarefa no período selecionado' },
    ui: { className: 'w-40' },
    children: (
      <AzuosSelectField
        data={{ value: '', options: STATUS_OPTIONS }}
        ui={{ ariaLabel: 'Situação' }}
        actions={{ onChange: fn() }}
      />
    ),
  },
};
