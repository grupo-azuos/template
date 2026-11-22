import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { EMPTY_BOARD_FILTER_VALUES } from '@template/shared/schemas/dashboard-board.schema';

import { AzuosBoardFilterBar } from './azuos-board-filter-bar.component';

/**
 * Os filtros do painel no estilo do Grafana: uma barra compacta acima dos blocos, cada filtro uma
 * peça "Nome | Valor". O Período sai da barra e vira o seletor de tempo do canto de cima.
 */
const meta = {
  title: 'Dashboard/AzuosBoardFilterBar',
  component: AzuosBoardFilterBar,
  args: {
    data: {
      filters: [
        { id: 'pessoa', kind: 'person', label: 'Responsável' },
        { id: 'periodo', kind: 'period', label: 'Período' },
        { id: 'taskStatus', kind: 'taskStatus', label: 'Status da tarefa' },
      ],
      values: EMPTY_BOARD_FILTER_VALUES,
      people: [
        { id: 'u-ana', name: 'Ana Souza', photo: null },
        { id: 'u-bruno', name: 'Bruno Lima', photo: null },
        { id: 'u-carla', name: 'Carla Dias', photo: null },
      ],
    },
    ui: { part: 'fields' },
    actions: { onChange: fn(), onClear: fn() },
  },
} satisfies Meta<typeof AzuosBoardFilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A barra acima dos blocos, com os filtros de campo. */
export const Default: Story = {};

/** O seletor de tempo, no canto de cima do painel. */
export const TimePicker: Story = { args: { ui: { part: 'period' } } };

/** Com valores escolhidos: o "Limpar filtros" aparece na ponta da barra. */
export const Chosen: Story = {
  args: {
    data: {
      ...meta.args.data,
      values: { ...EMPTY_BOARD_FILTER_VALUES, person: 'u-bruno', taskStatus: 'done' },
    },
  },
};

/** Datas exatas: as datas abrem logo abaixo do período. */
export const ExactDates: Story = {
  args: {
    ui: { part: 'period' },
    data: {
      ...meta.args.data,
      values: {
        ...EMPTY_BOARD_FILTER_VALUES,
        period: { mode: 'custom', from: '2026-11-01', to: '2026-11-30' },
      },
    },
  },
};

const STATUS_COUNTS = {
  total: 128,
  isLoading: false,
  series: [
    { key: 'todo', label: 'A fazer', value: 61 },
    { key: 'doing', label: 'Em andamento', value: 40 },
    { key: 'done', label: 'Concluída', value: 27 },
  ],
};

/** Os cards: a linha inteira, num carrossel, cada opção com quantos há nela. */
export const Cards: Story = {
  args: {
    data: {
      ...meta.args.data,
      filters: [
        { id: 'pessoa', kind: 'person', label: 'Responsável' },
        { id: 'status', kind: 'taskStatus', label: 'Status da tarefa', display: 'cards' },
      ],
      values: { ...EMPTY_BOARD_FILTER_VALUES, taskStatus: 'done' },
      counts: { status: STATUS_COUNTS },
    },
  },
};

/** Caso limite: as contagens ainda não chegaram — os cards mostram "…", nunca zero. */
export const CardsLoading: Story = {
  args: {
    data: { ...Cards.args!.data!, counts: { status: { ...STATUS_COUNTS, isLoading: true } } },
  },
};

/** "Linha inteira": o filtro ocupa a linha da barra sozinho. */
export const FullWidth: Story = {
  args: {
    data: {
      ...meta.args.data,
      filters: [
        { id: 'pessoa', kind: 'person', label: 'Responsável', width: 'full' },
        { id: 'taskStatus', kind: 'taskStatus', label: 'Status da tarefa' },
      ],
    },
  },
};

/** Montando: a barra como fica e a lista para ordenar, escolher o desenho e a largura. */
export const Building: Story = {
  args: {
    ui: undefined,
    state: { isEditing: true, isListOpen: true },
    actions: {
      onChange: fn(),
      onAdd: fn(),
      onRemove: fn(),
      onDisplayChange: fn(),
      onWidthChange: fn(),
      onPlaceChange: fn(),
    },
  },
};

/** Caso limite: montando um painel ainda sem filtro nenhum — só os botões de pôr. */
export const BuildingEmpty: Story = {
  args: {
    ui: undefined,
    data: { ...meta.args.data, filters: [] },
    state: { isEditing: true, isListOpen: true },
    actions: { onChange: fn(), onAdd: fn() },
  },
};
