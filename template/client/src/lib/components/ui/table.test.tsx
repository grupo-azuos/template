import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './table';

describe('Table', () => {
  // feliz
  it('renders the caption, the head, the body and the footer', () => {
    render(
      <Table>
        <TableCaption>Tarefas do mês</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Ligar para o cliente</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>1 tarefa</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    );

    expect(screen.getByRole('table', { name: 'Tarefas do mês' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Título' })).toBeInTheDocument();
    expect(screen.getByText('1 tarefa').closest('tfoot')).toHaveAttribute(
      'data-slot',
      'table-footer',
    );
  });

  // triste
  it('keeps the table scrollable inside its container', () => {
    render(<Table className="w-96" />);

    expect(screen.getByRole('table').className).toContain('w-96');
    expect(screen.getByRole('table').parentElement).toHaveAttribute('data-slot', 'table-container');
  });
});
