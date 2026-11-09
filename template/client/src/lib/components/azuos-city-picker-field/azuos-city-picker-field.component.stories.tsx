import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { AzuosCityPickerField } from './azuos-city-picker-field.component';

const meta = {
  title: 'Primitives/AzuosCityPickerField',
  component: AzuosCityPickerField,
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AzuosCityPickerField>;

export default meta;

type Story = StoryObj<typeof meta>;

const states = [
  { abbreviation: 'GO', name: 'Goiás' },
  { abbreviation: 'SP', name: 'São Paulo' },
  { abbreviation: 'MG', name: 'Minas Gerais' },
];

const cities = [
  { id: '00000000-0000-8000-8000-000000000007', name: 'Goiânia', state: 'GO' },
  { id: '00000000-0000-8000-8000-000000000034', name: 'Anápolis', state: 'GO' },
  { id: '00000000-0000-8000-8000-00000000003d', name: 'Aparecida de Goiânia', state: 'GO' },
  { id: '00000000-0000-8000-8000-000000000058', name: 'Trindade', state: 'GO' },
];

const actions = { onStateChange: fn(), onChange: fn() };

/** Herda a cidade da empresa — o caso comum. */
export const Default: Story = {
  args: {
    data: { state: 'GO', value: null, states, cities, inheritedCity: 'Goiânia' },
    actions,
  },
};

/** A filial em Anápolis de uma empresa de Goiânia. */
export const OwnCity: Story = {
  args: {
    data: {
      state: 'GO',
      value: '00000000-0000-8000-8000-000000000034',
      states,
      cities,
      inheritedCity: 'Goiânia',
    },
    actions,
  },
};

/** A cidade da própria empresa: sem herdar, o município fica travado até escolher a UF. */
export const NoState: Story = {
  args: {
    data: { state: null, value: null, states, cities: [] },
    actions,
  },
};

/** No filtro da lista: a opção nula vira "Todas as cidades". */
export const AllCities: Story = {
  args: {
    data: { state: 'GO', value: null, states, cities, allLabel: 'Todas as cidades' },
    ui: { ariaLabel: 'Cidade' },
    actions,
  },
};

/** O filtro com "Todas as UFs" escolhido: nenhuma UF, e a cidade só oferece "Todas as cidades". */
export const AllStates: Story = {
  args: {
    data: {
      state: null,
      value: null,
      states,
      cities: [],
      allLabel: 'Todas as cidades',
      allStatesLabel: 'Todas as UFs',
    },
    ui: { ariaLabel: 'Cidade' },
    actions,
  },
};

export const Loading: Story = {
  args: {
    data: { state: 'SP', value: null, states, cities: [], inheritedCity: 'Goiânia' },
    state: { isLoading: true },
    actions,
  },
};

export const Disabled: Story = {
  args: {
    data: {
      state: 'GO',
      value: '00000000-0000-8000-8000-000000000034',
      states,
      cities,
      inheritedCity: 'Goiânia',
    },
    state: { isDisabled: true },
    actions,
  },
};

/** Caso limite: a cidade gravada saiu do cadastro, e a empresa não tem cidade. */
export const UnknownCity: Story = {
  args: {
    data: {
      state: 'GO',
      value: '00000000-0000-8000-8000-00000000005a',
      states,
      cities: [],
      inheritedCity: null,
      current: { id: '00000000-0000-8000-8000-00000000005a', name: 'Município 90', state: 'GO' },
    },
    actions,
  },
};
