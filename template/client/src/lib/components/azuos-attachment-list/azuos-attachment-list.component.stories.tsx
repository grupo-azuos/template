import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { AzuosAttachmentList, type AzuosAttachment } from './azuos-attachment-list.component';

const meta = {
  title: 'Listas e tabelas/AzuosAttachmentList',
  component: AzuosAttachmentList,
  args: { actions: { onRemove: fn() } },
} satisfies Meta<typeof AzuosAttachmentList>;

export default meta;

type Story = StoryObj<typeof meta>;

const ATTACHMENTS: AzuosAttachment[] = [
  {
    id: 1,
    fileName: 'contrato-assinado.pdf',
    sizeBytes: 2_400_000,
    kindLabel: 'Documento',
    originLabel: 'anexado pelo time',
    viewUrl: '#',
    downloadUrl: '#',
    canRemove: true,
  },
  {
    id: 2,
    fileName: 'print-do-erro.png',
    sizeBytes: 180_000,
    kindLabel: 'Imagem',
    originLabel: 'enviado por quem abriu',
    viewUrl: '#',
    downloadUrl: '#',
  },
];

export const Default: Story = {
  args: { data: { attachments: ATTACHMENTS } },
};

/** Só leitura: nenhum arquivo ganha botão de excluir — é assim na consulta pública. */
export const ReadOnly: Story = {
  args: {
    data: { attachments: ATTACHMENTS.map((attachment) => ({ ...attachment, canRemove: false })) },
    actions: {},
  },
};

/** Excluindo um arquivo: trava só a linha dele, não a lista inteira. */
export const RemovingOne: Story = {
  args: { data: { attachments: ATTACHMENTS }, state: { removingId: 1 } },
};

export const Loading: Story = {
  args: { data: { attachments: [] }, state: { isLoading: true } },
};

export const Empty: Story = {
  args: { data: { attachments: [] }, ui: { emptyLabel: 'Nenhum arquivo nesta tarefa.' } },
};

export const WithError: Story = {
  args: {
    data: { attachments: ATTACHMENTS },
    state: { error: 'O arquivo já tinha sido excluído por outra pessoa.' },
  },
};

/** Caso limite: nome longo numa coluna estreita — corta, e os botões não saem da linha. */
export const LongFileName: Story = {
  args: {
    data: {
      attachments: [
        {
          ...ATTACHMENTS[0]!,
          fileName: 'contrato-de-prestacao-de-servicos-segundo-semestre-assinado-v4-final.pdf',
        },
      ],
    },
  },
  render: (args) => (
    <div className="w-80">
      <AzuosAttachmentList {...args} />
    </div>
  ),
};
