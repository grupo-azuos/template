import type { Meta, StoryObj } from '@storybook/react';

import { AzuosAgendaCalendar } from './azuos-agenda-calendar.component';

const DAYS = [
  { date: '2026-11-03', count: 2 },
  { date: '2026-11-10', count: 7 },
  { date: '2026-11-11', count: 1 },
  { date: '2026-11-24', count: 4 },
  { date: '2026-12-02', count: 3 },
];

const meta = {
  title: 'Dashboard/AzuosAgendaCalendar',
  component: AzuosAgendaCalendar,
  decorators: [(Story) => <div className="h-96 w-[56rem]">{Story()}</div>],
  args: {
    data: { days: DAYS, range: { from: '2026-11-01', to: '2026-11-30' }, seriesLabel: 'alvarás' },
  },
} satisfies Meta<typeof AzuosAgendaCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OneMonth: Story = {};

export const TwoMonths: Story = {
  args: { data: { ...meta.args.data, range: { from: '2026-11-01', to: '2026-12-31' } } },
};

export const PartOfMonth: Story = {
  args: { data: { ...meta.args.data, range: { from: '2026-11-08', to: '2026-11-21' } } },
};

export const Empty: Story = { args: { data: { ...meta.args.data, days: [] } } };

export const Loading: Story = { args: { state: { isLoading: true } } };
