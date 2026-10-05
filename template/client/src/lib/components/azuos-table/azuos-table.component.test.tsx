import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  AzuosTable,
  AzuosTableActions,
  AzuosTableBody,
  AzuosTableCell,
  AzuosTableHead,
  AzuosTableHeader,
  AzuosTableRow,
} from './azuos-table.component';

function renderTable(props: Parameters<typeof AzuosTable>[0] = {}) {
  return render(
    <AzuosTable {...props}>
      <AzuosTableHeader>
        <AzuosTableRow>
          <AzuosTableHead>Tarefa</AzuosTableHead>
          <AzuosTableHead>Responsável</AzuosTableHead>
        </AzuosTableRow>
      </AzuosTableHeader>
      <AzuosTableBody>
        <AzuosTableRow>
          <AzuosTableCell>Revisar contrato</AzuosTableCell>
          <AzuosTableCell>
            <AzuosTableActions>
              <button type="button">Editar</button>
            </AzuosTableActions>
          </AzuosTableCell>
        </AzuosTableRow>
      </AzuosTableBody>
    </AzuosTable>,
  );
}

describe('AzuosTable', () => {
  // feliz
  it('draws a real table, with header cells a screen reader can announce', () => {
    renderTable();

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Tarefa' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Revisar contrato' })).toBeInTheDocument();
  });

  /* A superfície mora AQUI, e não editada dentro de `ui/table` — onde o próximo `shadcn add` a
     apagaria sem erro nenhum no console. */
  it('wraps the table in the house surface', () => {
    const { container } = renderTable();

    const surface = container.querySelector('[data-slot="table-surface"]');

    expect(surface?.className).toContain('rounded-surface');
    expect(surface?.className).toContain('border');
  });

  it('shows the footer when there is one', () => {
    renderTable({ footer: <span>3 tarefas</span> });

    expect(screen.getByText('3 tarefas')).toBeInTheDocument();
  });

  it('lets the surface be undone, for the table that already lives inside a card', () => {
    const { container } = renderTable({ containerClassName: 'border-0 shadow-none' });

    expect(container.querySelector('[data-slot="table-surface"]')?.className).toContain('border-0');
  });

  // triste
  /* Sem rodapé a faixa não existe: uma barra vazia embaixo da tabela parece um total que ninguém
     calculou. */
  it('draws no footer strip when there is no footer', () => {
    const { container } = renderTable();

    expect(container.querySelectorAll('[data-slot="table-surface"] > div')).toHaveLength(1);
  });

  /* A célula com botão fica numa linha só: um par de botões quebrado em duas linhas desalinha a
     coluna de ações da tabela inteira. */
  it('keeps the actions cell on a single line', () => {
    renderTable();

    const cell = screen.getByRole('button', { name: 'Editar' }).closest('td');

    expect(cell?.className).toContain('[&:has(button)]:whitespace-nowrap');
  });
});
