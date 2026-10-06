import { type Meta, type StoryObj } from '@storybook/react';
import { Clock, EyeOff, Flag, Lock } from 'lucide-react';

import {
  AzuosHistoryTimeline,
  formatMinutesSpent,
  type AzuosHistoryEntry,
} from './azuos-history-timeline.component';

const meta = {
  title: 'Conteúdo e marcadores/AzuosHistoryTimeline',
  component: AzuosHistoryTimeline,
} satisfies Meta<typeof AzuosHistoryTimeline>;

export default meta;

type Story = StoryObj<typeof meta>;

const ENTRIES: AzuosHistoryEntry[] = [
  {
    id: 1,
    kindLabel: 'Abriu',
    tone: 'info',
    authorName: 'Mariana Ribeiro',
    createdAt: '2026-10-01T13:05:00.000Z',
    description: 'A planilha do fechamento não abre no computador da recepção.',
    meta: [{ icon: Flag, label: 'Estágio: A fazer' }],
  },
  {
    id: 2,
    kindLabel: 'Comentou',
    tone: 'neutral',
    authorName: 'Caio Prado',
    createdAt: '2026-10-01T15:40:00.000Z',
    description: 'Consegui reproduzir. Vou testar em outro computador antes de responder.',
    meta: [
      { icon: Flag, label: 'Estágio: Em andamento' },
      { icon: Clock, label: 'Tempo: ' + formatMinutesSpent(45) },
      { icon: EyeOff, label: 'Interno — quem abriu não vê' },
    ],
  },
  {
    id: 3,
    kindLabel: 'Encerrou',
    tone: 'success',
    authorName: 'Caio Prado',
    createdAt: '2026-10-02T11:20:00.000Z',
    description: 'Era a versão do programa. Atualizei e a planilha abriu.',
    meta: [
      { icon: Flag, label: 'Estágio: Concluída' },
      { icon: Clock, label: 'Tempo: ' + formatMinutesSpent(150) },
      { icon: Lock, label: 'Encerrou o atendimento', isStrong: true },
    ],
  },
];

export const Default: Story = {
  args: { data: { entries: ENTRIES } },
  render: (args) => (
    <div className="w-[36rem]">
      <AzuosHistoryTimeline {...args} />
    </div>
  ),
};

/** Com anexos numa das entradas. */
export const WithAttachments: Story = {
  args: {
    data: {
      entries: [
        {
          ...ENTRIES[0]!,
          attachments: [
            {
              id: 1,
              fileName: 'print-do-erro.png',
              sizeBytes: 180_000,
              kindLabel: 'Imagem',
              viewUrl: '#',
              downloadUrl: '#',
            },
          ],
        },
      ],
    },
  },
  render: (args) => (
    <div className="w-[36rem]">
      <AzuosHistoryTimeline {...args} />
    </div>
  ),
};

/** Uma entrada só: o trilho não sobra para cima nem para baixo. */
export const SingleEntry: Story = {
  args: { data: { entries: [ENTRIES[0]!] } },
  render: (args) => (
    <div className="w-[36rem]">
      <AzuosHistoryTimeline {...args} />
    </div>
  ),
};

export const Loading: Story = {
  args: { data: { entries: [] }, state: { isLoading: true } },
};

export const Empty: Story = {
  args: { data: { entries: [] }, ui: { emptyLabel: 'Nada aconteceu nesta tarefa ainda.' } },
};

export const WithError: Story = {
  args: {
    data: { entries: [] },
    state: { error: 'Não consegui carregar o histórico. Tente de novo em instantes.' },
  },
};
