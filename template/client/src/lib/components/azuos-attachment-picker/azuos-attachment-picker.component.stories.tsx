import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { AzuosAttachmentPicker } from './azuos-attachment-picker.component';

const meta = {
  title: 'Formulários/AzuosAttachmentPicker',
  component: AzuosAttachmentPicker,
  args: { actions: { onChange: fn(), onError: fn() } },
} satisfies Meta<typeof AzuosAttachmentPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

const LIMITS = { accept: 'image/*,application/pdf', maxCount: 5, maxBytes: 10 * 1024 * 1024 };

/** Um `File` de mentira, só para a lista aparecer na pré-visualização. */
function fakeFile(name: string, sizeBytes: number): File {
  return new File([new Uint8Array(1)], name, { type: 'application/pdf', lastModified: sizeBytes });
}

export const Default: Story = {
  args: { data: { files: [], limits: LIMITS }, ui: { className: 'w-96' } },
};

export const WithChosenFiles: Story = {
  args: {
    data: {
      files: [fakeFile('contrato.pdf', 2_400_000), fakeFile('print-do-erro.png', 180_000)],
      limits: LIMITS,
    },
    ui: { className: 'w-96' },
  },
};

/** A recusa aparece colada no campo, em português, e para no PRIMEIRO problema. */
export const WithError: Story = {
  args: {
    data: { files: [], limits: LIMITS },
    state: { error: '"video-da-reuniao.mp4" passa de 10 MB.' },
    ui: { className: 'w-96' },
  },
};

export const Disabled: Story = {
  args: {
    data: { files: [fakeFile('contrato.pdf', 2_400_000)], limits: LIMITS },
    state: { isDisabled: true },
    ui: { className: 'w-96' },
  },
};

/** Caso limite: o registro já tem arquivos — a conta do limite soma os dois lados. */
export const WithExistingFiles: Story = {
  args: {
    data: { files: [], limits: { ...LIMITS, maxCount: 3 }, existingCount: 2 },
    ui: { className: 'w-96' },
  },
};
