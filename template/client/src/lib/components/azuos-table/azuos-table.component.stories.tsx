import { type Meta, type StoryObj } from '@storybook/react';
import { Pencil, Trash2 } from 'lucide-react';
import { fn } from 'storybook/test';

import { AzuosActionButton } from '../azuos-action-button/azuos-action-button.component';
import { AzuosStatusBadge } from '../azuos-status-badge/azuos-status-badge.component';
import {
  AzuosTable,
  AzuosTableActions,
  AzuosTableBody,
  AzuosTableCell,
  AzuosTableHead,
  AzuosTableHeader,
  AzuosTableRow,
} from './azuos-table.component';

const meta = {
  title: 'Listas e tabelas/AzuosTable',
  component: AzuosTable,
} satisfies Meta<typeof AzuosTable>;

export default meta;

type Story = StoryObj<typeof meta>;

const ROWS = [
  { title: 'Revisar contrato', owner: 'Mariana Ribeiro', status: 'Em andamento', tone: 'info' },
  { title: 'Fechar o mês', owner: 'Caio Prado', status: 'Concluída', tone: 'success' },
  { title: 'Responder o cliente', owner: 'Ana Luz', status: 'A fazer', tone: 'neutral' },
] as const;

function Head() {
  return (
    <AzuosTableHeader>
      <AzuosTableRow>
        <AzuosTableHead>Tarefa</AzuosTableHead>
        <AzuosTableHead>Responsável</AzuosTableHead>
        <AzuosTableHead>Situação</AzuosTableHead>
        <AzuosTableHead className="text-right">Ações</AzuosTableHead>
      </AzuosTableRow>
    </AzuosTableHeader>
  );
}

function Rows() {
  return (
    <AzuosTableBody>
      {ROWS.map((row) => (
        <AzuosTableRow key={row.title}>
          <AzuosTableCell className="font-medium">{row.title}</AzuosTableCell>
          <AzuosTableCell>{row.owner}</AzuosTableCell>
          <AzuosTableCell>
            <AzuosStatusBadge data={{ label: row.status }} ui={{ tone: row.tone, size: 'sm' }} />
          </AzuosTableCell>
          <AzuosTableCell className="text-right">
            <AzuosTableActions>
              <AzuosActionButton
                data={{ label: 'Editar' }}
                ui={{ variant: 'ghost', size: 'sm', icon: Pencil, isIconOnly: true }}
                actions={{ onClick: fn() }}
              />
              <AzuosActionButton
                data={{ label: 'Excluir' }}
                ui={{ variant: 'ghost', size: 'sm', icon: Trash2, isIconOnly: true }}
                actions={{ onClick: fn() }}
              />
            </AzuosTableActions>
          </AzuosTableCell>
        </AzuosTableRow>
      ))}
    </AzuosTableBody>
  );
}

export const Default: Story = {
  render: () => (
    <AzuosTable>
      <Head />
      <Rows />
    </AzuosTable>
  ),
};

/** Com rodapé: a fonte do dado à esquerda, a contagem à direita. */
export const WithFooter: Story = {
  render: () => (
    <AzuosTable
      footer={
        <>
          <span>Atualizado agora</span>
          <span>3 tarefas</span>
        </>
      }
    >
      <Head />
      <Rows />
    </AzuosTable>
  ),
};

/** Caso limite: texto longo numa coluna. Ele QUEBRA, em vez de alargar a tabela. */
export const LongTextWraps: Story = {
  render: () => (
    <div className="w-[36rem]">
      <AzuosTable>
        <Head />
        <AzuosTableBody>
          <AzuosTableRow>
            <AzuosTableCell className="font-medium">
              Revisar o contrato de prestação de serviços do segundo semestre com o time jurídico
            </AzuosTableCell>
            <AzuosTableCell>Mariana Ribeiro</AzuosTableCell>
            <AzuosTableCell>
              <AzuosStatusBadge
                data={{ label: 'Em andamento' }}
                ui={{ tone: 'info', size: 'sm' }}
              />
            </AzuosTableCell>
            <AzuosTableCell className="text-right">
              <AzuosTableActions>
                <AzuosActionButton
                  data={{ label: 'Editar' }}
                  ui={{ variant: 'ghost', size: 'sm', icon: Pencil, isIconOnly: true }}
                  actions={{ onClick: fn() }}
                />
              </AzuosTableActions>
            </AzuosTableCell>
          </AzuosTableRow>
        </AzuosTableBody>
      </AzuosTable>
    </div>
  ),
};

/** Dentro de um cartão: a superfície em volta sai, para não virar caixa dentro de caixa. */
export const InsideACard: Story = {
  render: () => (
    <div className="bg-card border-border rounded-surface border p-5 shadow-xs">
      <AzuosTable containerClassName="border-0 shadow-none rounded-none">
        <Head />
        <Rows />
      </AzuosTable>
    </div>
  ),
};
