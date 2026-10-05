import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AzuosPendingArea } from './azuos-pending-area.component';

const DATA = {
  title: 'Relatórios',
  summary: 'Os números do mês, prontos para imprimir ou enviar.',
  features: ['Quantas tarefas foram concluídas', 'Exportar em CSV'],
};

describe('AzuosPendingArea', () => {
  // feliz
  it('names the area as the page title, so the menu does not open a blank screen', () => {
    render(<AzuosPendingArea data={DATA} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Relatórios' })).toBeInTheDocument();
    expect(screen.getByText(DATA.summary)).toBeInTheDocument();
  });

  /* O "em breve" vazio é o que esta tela existe para evitar: ela lista o que a área vai fazer, para
     quem abre conferir se o previsto é o que precisa. */
  it('lists what the area will do', () => {
    render(<AzuosPendingArea data={DATA} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Exportar em CSV')).toBeInTheDocument();
  });

  it('says what has to exist first, when something blocks it', () => {
    render(<AzuosPendingArea data={{ ...DATA, dependsOn: 'as Tarefas' }} />);

    expect(screen.getByText('as Tarefas')).toBeInTheDocument();
  });

  // triste
  /* Sem dependência, a linha não aparece: um "Antes desta área:" vazio faria parecer que falta um
     bloqueio que ninguém escreveu. */
  it('draws no dependency line when nothing blocks it', () => {
    render(<AzuosPendingArea data={DATA} />);

    expect(screen.queryByText(/Antes desta área/)).not.toBeInTheDocument();
  });

  it('still draws the screen when nothing is planned yet', () => {
    render(<AzuosPendingArea data={{ ...DATA, features: [] }} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Relatórios' })).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });
});
