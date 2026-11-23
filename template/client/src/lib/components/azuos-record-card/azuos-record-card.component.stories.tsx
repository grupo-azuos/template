import { type Meta, type StoryObj } from '@storybook/react';
import { Building2, CalendarDays, Pencil, Trash2 } from 'lucide-react';

import { AzuosRecordCard } from './azuos-record-card.component';

const meta = {
  title: 'Cards/AzuosRecordCard',
  component: AzuosRecordCard,
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  args: {
    data: {
      label: 'Abrir Padaria Bom Dia',
      title: 'Padaria Bom Dia',
      code: '12.345.678/0001-90',
      meta: 'Simples Nacional',
      status: { label: 'Ativa', tone: 'green' },
      tags: [{ label: 'Matriz' }],
      metrics: [
        { key: 'open', label: 'Abertos', value: '3', tone: 'blue' },
        { key: 'late', label: 'Atrasados', value: '0', tone: 'red', isOn: false },
        { key: 'kind', label: 'Regime', value: 'Simples', isText: true },
      ],
      footer: {
        title: 'Ana Souza',
        subtitle: 'Responsável',
        person: { id: 'p-ana', name: 'Ana Souza' },
      },
      openLabel: 'Abrir',
      menu: {
        label: 'Ações da empresa',
        items: [
          { id: 'edit', label: 'Editar', icon: Pencil },
          {
            id: 'delete',
            label: 'Excluir',
            icon: Trash2,
            isDestructive: true,
            separatorBefore: true,
          },
        ],
      },
    },
    ui: { icon: Building2, iconTone: 'blue' },
    actions: { onOpen: () => {}, onMenuSelect: () => {} },
  },
} satisfies Meta<typeof AzuosRecordCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** O card padrão: faixa, cabeçalho com ícone, números e o rodapé com o rosto (com a foto). */
export const Default: Story = {};

/** A pendência: o selo vermelho que pisca, com a explicação no balão. */
export const WithAlert: Story = {
  args: { data: { ...meta.args.data, alert: { count: 4, message: '4 obrigações vencidas' } } },
};

/** A foto do registro no lugar do ícone. */
export const WithThumbnail: Story = {
  args: { ui: { thumbnailUrl: 'https://picsum.photos/seed/azuos/96' } },
};

/** Com ícone no rodapé, o rosto da pessoa vai para depois do texto. */
export const WithFooterIcon: Story = {
  args: {
    data: {
      ...meta.args.data,
      footer: { title: 'Vence em 28/11/2026', person: { id: 'p-ana', name: 'Ana Souza' } },
    },
    ui: { icon: Building2, iconTone: 'blue', footerIcon: CalendarDays },
  },
};

/** Caso limite: título longo (corta em duas linhas) e só o cabeçalho, sem faixa nem rodapé. */
export const Minimal: Story = {
  args: {
    data: {
      label: 'Abrir registro',
      title:
        'Associação Comercial e Industrial dos Lojistas do Centro-Oeste e Entorno do Distrito Federal',
    },
    actions: {},
  },
};
