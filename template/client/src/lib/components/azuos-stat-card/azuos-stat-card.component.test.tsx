import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Building2 } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosStatCard } from './azuos-stat-card.component';

describe('AzuosStatCard', () => {
  // feliz
  it('shows the label and the number', () => {
    render(<AzuosStatCard data={{ label: 'Clientes', value: 560 }} />);

    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('560')).toBeInTheDocument();
  });

  /* Um número que exclui algo precisa dizer o que excluiu, ou dois painéis passam a discordar
     sobre a mesma base sem que ninguém saiba qual está certo. */
  it('shows the caveat when the number leaves something out', () => {
    render(
      <AzuosStatCard data={{ label: 'Ativos', value: 641, hint: 'Exclui 1.067 arquivados' }} />,
    );

    expect(screen.getByText('Exclui 1.067 arquivados')).toBeInTheDocument();
  });

  it('accepts text instead of a number, for ratios like "13/13"', () => {
    render(<AzuosStatCard data={{ label: 'Cadastrados', value: '13/13' }} />);

    expect(screen.getByText('13/13')).toBeInTheDocument();
  });

  /* O token do tom, e não a paleta crua: `bg-emerald-100` não acompanharia a troca de tema. */
  it('paints the whole card with the tone token', () => {
    const { container } = render(
      <AzuosStatCard data={{ label: 'Concluídas', value: 74 }} ui={{ tone: 'success' }} />,
    );

    expect(container.firstElementChild?.className).toContain('bg-success-soft');
  });

  it('keeps the neutral card with a border, since it has no tone to separate it from the page', () => {
    const { container } = render(<AzuosStatCard data={{ label: 'Total', value: 7 }} />);

    expect(container.firstElementChild?.className).toContain('border');
  });

  /* O quadrado do ícone é a identidade da categoria: cor sólida, não o `-soft` do fundo. */
  it('draws the icon square when it was given an icon', () => {
    const { container } = render(
      <AzuosStatCard data={{ label: 'Clientes', value: 7 }} ui={{ icon: Building2 }} />,
    );

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('becomes a real button when it filters the list, so the keyboard reaches it', async () => {
    const onClick = vi.fn();
    render(<AzuosStatCard data={{ label: 'Atrasadas', value: 13 }} actions={{ onClick }} />);

    await userEvent.click(screen.getByRole('button', { name: /filtrar a lista/ }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  /* Selecionado, o rótulo do botão muda: quem usa leitor de tela precisa saber que o próximo
     clique TIRA o filtro, e não que o aplica de novo. */
  it('says the next click removes the filter when it is already selected', () => {
    render(
      <AzuosStatCard
        data={{ label: 'Atrasadas', value: 13 }}
        state={{ isSelected: true }}
        actions={{ onClick: vi.fn() }}
      />,
    );

    const button = screen.getByRole('button', { name: /tirar o filtro/ });

    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  // triste
  /* ZERO É RESPOSTA. Trocá-lo por traço ou esconder o cartão faria "nenhuma tarefa atrasada"
     parecer "não sei quantas" — e as duas coisas pedem ações diferentes. */
  it('shows zero as zero, never as empty', () => {
    render(<AzuosStatCard data={{ label: 'Inativas', value: 0 }} />);

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('hides the number while loading, instead of showing a wrong value', () => {
    render(<AzuosStatCard data={{ label: 'Clientes', value: 560 }} state={{ isLoading: true }} />);

    expect(screen.queryByText('560')).not.toBeInTheDocument();
    expect(screen.getByText('Clientes')).toBeInTheDocument();
  });

  it('draws no caveat line when there is no caveat', () => {
    const { container } = render(<AzuosStatCard data={{ label: 'Equipe', value: 22 }} />);

    expect(container.querySelectorAll('p')).toHaveLength(2);
  });

  /* Sem `onClick` não existe botão: um cartão que parece clicável e não é vale menos que um
     cartão que não parece. */
  it('is not a button when it does not filter anything', () => {
    render(<AzuosStatCard data={{ label: 'Total', value: 7 }} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
