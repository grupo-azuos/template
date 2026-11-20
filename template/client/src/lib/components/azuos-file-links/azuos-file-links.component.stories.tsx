import { type Meta, type StoryObj } from '@storybook/react';
import { Paperclip } from 'lucide-react';

import { AzuosFileLinks } from './azuos-file-links.component';

const meta = {
  title: 'Ações/AzuosFileLinks',
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

/** As duas pílulas cinza, "Abrir" e "Baixar" — o par das linhas de tabela e de lista. */
export const Default: Story = {};

/** A linha do arquivo inteira: ícone do tipo, nome, tipo e tamanho, e as pílulas à direita. */
export const Card: Story = {
  args: {
    data: {
      fileName: 'Protocolo_94888.pdf',
      viewUrl: '#abrir',
      downloadUrl: '#baixar',
      sizeLabel: '182 KB',
    },
    ui: { layout: 'card', className: 'max-w-xl' },
  },
};

/** Cada tipo com o seu ícone e o seu tom: PDF, planilha, imagem, documento e outro. */
export const CardFileKinds: Story = {
  render: () => (
    <div className="flex max-w-xl flex-col gap-3">
      {(
        [
          { fileName: 'Alvará sanitário.pdf', sizeLabel: '182 KB' },
          { fileName: 'Honorários de novembro.xlsx', sizeLabel: '48 KB' },
          { fileName: 'print 18-11-2026 17h47.png', sizeLabel: '207 KB' },
          { fileName: 'Contrato social.docx', sizeLabel: '96 KB' },
          { fileName: 'Vistoria - fotos.zip', sizeLabel: '4,1 MB' },
        ] as const
      ).map(({ fileName, sizeLabel }) => (
        <AzuosFileLinks
          key={fileName}
          data={{ fileName, sizeLabel, viewUrl: '#abrir', downloadUrl: '#baixar' }}
          ui={{ layout: 'card' }}
        />
      ))}
    </div>
  ),
};

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

/** Caso limite: nome comprido numa coluna estreita encurta com reticências, sem empurrar o baixar. */
export const LongFileName: Story = {
  args: {
    data: {
      fileName: 'Termo de rescisão do contrato de trabalho assinado pelas duas partes.pdf',
      viewUrl: '#abrir',
      downloadUrl: '#baixar',
      openLabel: 'Termo de rescisão do contrato de trabalho assinado pelas duas partes.pdf',
    },
    ui: { openIcon: Paperclip, className: 'w-64' },
  },
};

/** Caso limite: o `card` com nome comprido numa coluna estreita — o nome corta, as pílulas descem. */
export const CardLongFileNameNarrow: Story = {
  args: {
    data: {
      fileName: 'Termo de rescisão do contrato de trabalho assinado pelas duas partes.pdf',
      viewUrl: '#abrir',
      downloadUrl: '#baixar',
      sizeLabel: '1,2 MB',
    },
    ui: { layout: 'card', className: 'w-80' },
  },
};
