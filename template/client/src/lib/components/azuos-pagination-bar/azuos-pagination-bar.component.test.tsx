import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AzuosPaginationBar, pageCountOf, rangeLabelOf } from './azuos-pagination-bar.component';

const NOUN: [string, string] = ['tarefa', 'tarefas'];

describe('pageCountOf', () => {
  // feliz
  it('rounds the last, incomplete page up', () => {
    expect(pageCountOf(312, 25)).toBe(13);
    expect(pageCountOf(50, 25)).toBe(2);
  });

  // triste
  /* Zero item ainda é UMA página: a que diz que não há nada. Zero páginas faria a barra
     desaparecer, e a lista ficaria sem a frase que explica o vazio. */
  it('still counts one page when there is nothing', () => {
    expect(pageCountOf(0, 25)).toBe(1);
  });

  it('does not divide by zero when the page size comes broken', () => {
    expect(pageCountOf(312, 0)).toBe(1);
  });
});

describe('rangeLabelOf', () => {
  // feliz
  /* É a frase que impede a lista de mentir por omissão: errar a conta aqui é dizer à pessoa que ela
     já viu tudo quando não viu. */
  it('says the range of this page inside the total', () => {
    expect(
      rangeLabelOf({ page: 2, pageSize: 25, total: 312, noun: NOUN, gender: 'feminine' }),
    ).toBe('26–50 de 312 tarefas');
  });

  it('shows the total alone when everything fits on one page', () => {
    expect(rangeLabelOf({ page: 1, pageSize: 25, total: 7, noun: NOUN, gender: 'feminine' })).toBe(
      '7 tarefas',
    );
  });

  it('caps the last number at the total, on an incomplete last page', () => {
    expect(
      rangeLabelOf({ page: 13, pageSize: 25, total: 312, noun: NOUN, gender: 'feminine' }),
    ).toBe('301–312 de 312 tarefas');
  });

  // triste
  it('says nothing was found, in the singular', () => {
    expect(rangeLabelOf({ page: 1, pageSize: 25, total: 0, noun: NOUN, gender: 'feminine' })).toBe(
      'Nenhuma tarefa',
    );
  });

  it('uses the singular for a single item', () => {
    expect(rangeLabelOf({ page: 1, pageSize: 25, total: 1, noun: NOUN, gender: 'feminine' })).toBe(
      '1 tarefa',
    );
  });
});

describe('AzuosPaginationBar', () => {
  // feliz
  it('walks forward and backward', async () => {
    const onPageChange = vi.fn();
    render(
      <AzuosPaginationBar
        data={{ page: 2, pageSize: 25, total: 312, noun: NOUN, gender: 'feminine' }}
        actions={{ onPageChange }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /Próxima/ }));
    expect(onPageChange).toHaveBeenCalledWith(3);

    await userEvent.click(screen.getByRole('button', { name: /Anterior/ }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('says where the person is', () => {
    render(
      <AzuosPaginationBar
        data={{ page: 2, pageSize: 25, total: 312, noun: NOUN, gender: 'feminine' }}
        actions={{ onPageChange: vi.fn() }}
      />,
    );

    expect(screen.getByText('Página 2 de 13')).toBeInTheDocument();
  });

  // triste
  /* Desligada, não escondida: um botão que some faz a barra pular de lugar a cada clique. */
  it('disables the step it cannot take, instead of hiding it', () => {
    render(
      <AzuosPaginationBar
        data={{ page: 1, pageSize: 25, total: 312, noun: NOUN, gender: 'feminine' }}
        actions={{ onPageChange: vi.fn() }}
      />,
    );

    expect(screen.getByRole('button', { name: /Anterior/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Próxima/ })).toBeEnabled();
  });

  it('draws no steps when everything fits on one page', () => {
    render(
      <AzuosPaginationBar
        data={{ page: 1, pageSize: 25, total: 7, noun: NOUN, gender: 'feminine' }}
        actions={{ onPageChange: vi.fn() }}
      />,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('7 tarefas')).toBeInTheDocument();
  });

  it('blocks both steps while the page is loading', () => {
    render(
      <AzuosPaginationBar
        data={{ page: 2, pageSize: 25, total: 312, noun: NOUN, gender: 'feminine' }}
        state={{ isLoading: true }}
        actions={{ onPageChange: vi.fn() }}
      />,
    );

    expect(screen.getByRole('button', { name: /Anterior/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Próxima/ })).toBeDisabled();
  });
});
