import { type Meta, type StoryObj } from '@storybook/react';
import { ZoomIn, ZoomOut } from 'lucide-react';

import { AzuosSliderField } from './azuos-slider-field.component';

const noop = () => undefined;

const meta = {
  title: 'Formulários/AzuosSliderField',
  component: AzuosSliderField,
  args: {
    data: { label: 'Zoom', value: 1.5, min: 1, max: 4, step: 0.05 },
    actions: { onChange: noop },
  },
} satisfies Meta<typeof AzuosSliderField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Com os ícones das pontas — o zoom do editor de foto. */
export const WithIcons: Story = {
  args: {
    ui: {
      startIcon: <ZoomOut className="size-4 shrink-0 text-ink-500" aria-hidden />,
      endIcon: <ZoomIn className="size-4 shrink-0 text-ink-500" aria-hidden />,
    },
  },
};

export const AtTheLimits: Story = {
  args: { data: { label: 'Zoom', value: 4, min: 1, max: 4, step: 0.05 } },
};

export const Disabled: Story = {
  args: { state: { isDisabled: true } },
};

/** Caso limite: coluna estreita. */
export const NarrowColumn: Story = {
  render: (args) => (
    <div className="w-32">
      <AzuosSliderField {...args} />
    </div>
  ),
};
