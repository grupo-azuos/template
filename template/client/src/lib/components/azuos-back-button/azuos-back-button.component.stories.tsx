import type { Meta, StoryObj } from '@storybook/react';

import { AzuosBackButton } from './azuos-back-button.component';

const meta = {
  title: 'Components/AzuosBackButton',
  component: AzuosBackButton,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AzuosBackButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: {
      destination: 'empresas',
    },
  },
};

export const CustomLabel: Story = {
  args: {
    data: {
      label: 'Voltar para o painel principal',
    },
  },
};

export const AsLink: Story = {
  args: {
    data: {
      destination: 'empresas',
      to: '/companies',
    },
  },
};

export const Disabled: Story = {
  args: {
    data: {
      destination: 'empresas',
    },
    state: {
      isDisabled: true,
    },
  },
};
