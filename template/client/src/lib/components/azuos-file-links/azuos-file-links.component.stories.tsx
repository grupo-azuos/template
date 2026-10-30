import { type Meta, type StoryObj } from '@storybook/react';
import { Paperclip } from 'lucide-react';

import { AzuosFileLinks } from './azuos-file-links.component';

const meta = {
  title: 'Importados/AzuosFileLinks',
  component: AzuosFileLinks,
  args: {
    data: {
      fileName: 'Atestado médico.pdf',
      viewUrl: '#abrir',
      downloadUrl: '#baixar',
    },
  },
} satisfies Meta<typeof AzuosFileLinks>;

export default meta;

type Story = StoryObj<typeof meta>;

/** "Abrir" em texto e o baixar no ícone ao lado — o par das listas de anexos da ficha. */
export const Default: Story = {};

/** O texto de abrir é o nome do arquivo, com o clipe — como no feedback. */
export const FileNameAsLabel: Story = {
  args: {
    data: {
      fileName: 'Advertência assinada.pdf',
      viewUrl: '#abrir',
      downloadUrl: '#baixar',
      openLabel: 'Advertência assinada.pdf',
    },
    ui: { openIcon: Paperclip },
  },
};

/** Caso limite: nome comprido numa coluna estreita encurta com reticências, sem empurrar o ícone. */
export const LongFileName: Story = {
  args: {
    data: {
      fileName: 'Termo de rescisão do contrato de trabalho assinado pelas duas partes.pdf',
      viewUrl: '#abrir',
      downloadUrl: '#baixar',
      openLabel: 'Termo de rescisão do contrato de trabalho assinado pelas duas partes.pdf',
    },
    ui: { openIcon: Paperclip, className: 'w-56' },
  },
};
