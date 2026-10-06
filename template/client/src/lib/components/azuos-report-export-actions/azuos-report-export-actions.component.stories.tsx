import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { AzuosReportExportActions } from './azuos-report-export-actions.component';

const meta = {
  title: 'Ações/AzuosReportExportActions',
  component: AzuosReportExportActions,
  args: { actions: { onExport: fn() } },
} satisfies Meta<typeof AzuosReportExportActions>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { state: { exportingFormat: null } },
};

/** Baixando o Excel: os outros ficam desligados, para não montar o arquivo duas vezes. */
export const Exporting: Story = {
  args: { state: { exportingFormat: 'xlsx' } },
};

/** Um formato só: a tela que só exporta CSV não precisa dos três botões. */
export const SingleFormat: Story = {
  args: {
    data: { formats: [{ value: 'csv', label: 'CSV' }] },
    state: { exportingFormat: null },
  },
};
