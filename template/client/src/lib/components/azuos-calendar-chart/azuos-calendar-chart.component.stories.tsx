import { type Meta, type StoryObj } from '@storybook/react';

import { AzuosCalendarChart } from './azuos-calendar-chart.component';

const meta = {
  title: 'Gráficos e números/AzuosCalendarChart',
  component: AzuosCalendarChart,
} satisfies Meta<typeof AzuosCalendarChart>;

export default meta;

type Story = StoryObj<typeof meta>;

/* Um dia com vencimento a cada três, e um pico numa semana de março. */
const DAYS = Array.from({ length: 120 }, (_, index) => {
  const date = new Date(Date.UTC(2026, 9, 1 + index * 3));

  return { date: date.toISOString().slice(0, 10), count: (index % 4) + 1 + (index === 50 ? 12 : 0) };
});

export const Default: Story = { args: { data: { days: DAYS, seriesLabel: 'vencimentos', from: '2026-10-01' } } };

export const Loading: Story = {
  args: { data: { days: [], seriesLabel: 'vencimentos' }, state: { isLoading: true } },
};

export const Empty: Story = {
  args: { data: { days: [], seriesLabel: 'vencimentos' }, ui: { emptyLabel: 'Nenhum vencimento no período' } },
};
