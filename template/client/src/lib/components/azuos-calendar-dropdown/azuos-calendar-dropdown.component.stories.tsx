import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { AzuosCalendarDropdown, calendarMonthName } from './azuos-calendar-dropdown.component';

const MONTHS = Array.from({ length: 12 }, (_, index) => ({
  value: index,
  label: calendarMonthName(new Date(2026, index, 1, 12)),
  disabled: false,
}));

const YEARS = Array.from({ length: 111 }, (_, index) => ({
  value: 1926 + index,
  label: String(1926 + index),
  disabled: false,
}));

const meta = {
  title: 'Formulários/AzuosCalendarDropdown',
  component: AzuosCalendarDropdown,
  args: { onChange: fn() },
  decorators: [
    (Story) => (
      <div className="h-72">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AzuosCalendarDropdown>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Os meses: doze opções, todas cabem sem rolar. */
export const Default: Story = {
  args: { options: MONTHS, value: 2, 'aria-label': 'Mês' },
};

/** Os anos: mais de cem opções — a lista rola e abre com o ano que está valendo no meio. */
export const Years: Story = {
  args: { options: YEARS, value: 2026, 'aria-label': 'Ano' },
};

/** Com limite: os meses fora da faixa ficam apagados e não respondem. */
export const WithDisabledOptions: Story = {
  args: {
    options: MONTHS.map((month) => ({ ...month, disabled: month.value < 2 || month.value > 8 })),
    value: 4,
    'aria-label': 'Mês',
  },
};

export const Disabled: Story = {
  args: { options: MONTHS, value: 2, 'aria-label': 'Mês', disabled: true },
};

/** Caso limite: uma opção só. */
export const SingleOption: Story = {
  args: {
    options: [{ value: 2026, label: '2026', disabled: false }],
    value: 2026,
    'aria-label': 'Ano',
  },
};
