import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  AzuosInfiniteScrollFooter,
  type AzuosInfiniteScrollFooterProps,
} from './azuos-infinite-scroll-footer.component';

function makeProps(overrides: Partial<AzuosInfiniteScrollFooterProps> = {}): AzuosInfiniteScrollFooterProps {
  return {
    data: { loaded: 50, totalItems: 566 },
    ui: { itemNoun: { singular: 'empresa', plural: 'empresas' } },
    state: { isLoading: false, hasMore: true },
    actions: { onLoadMore: vi.fn() },
    ...overrides,
  };
}

describe('AzuosInfiniteScrollFooter', () => {
  // feliz
  it('says how much of the whole is loaded', () => {
    render(<AzuosInfiniteScrollFooter {...makeProps()} />);

    expect(screen.getByText('50 de 566 empresas')).toBeInTheDocument();
  });

  it('asks for the next page when the button is used', async () => {
    const props = makeProps();
    render(<AzuosInfiniteScrollFooter {...props} />);

    await userEvent.click(screen.getByRole('button', { name: /carregar mais/i }));

    expect(props.actions.onLoadMore).toHaveBeenCalledOnce();
  });

  /* O botão não é redundante com a rolagem: o `IntersectionObserver` não existe em todo
     ambiente, e leitor de tela não "rola até ver". */
  it('offers a way forward that does not depend on scrolling', () => {
    render(<AzuosInfiniteScrollFooter {...makeProps()} />);

    expect(screen.getByRole('button', { name: /carregar mais/i })).toBeInTheDocument();
  });

  // triste
  it('says the list ended, instead of offering a page that does not exist', () => {
    render(
      <AzuosInfiniteScrollFooter
        {...makeProps({ data: { loaded: 566, totalItems: 566 }, state: { isLoading: false, hasMore: false } })}
      />,
    );

    expect(screen.getByText('566 empresas — fim da lista')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /carregar mais/i })).not.toBeInTheDocument();
  });

  /* Rolagem rápida dispara o sentinela várias vezes; o botão travado é a outra metade da
     mesma trava. */
  it('does not ask for the same page twice while it is on the way', () => {
    render(<AzuosInfiniteScrollFooter {...makeProps({ state: { isLoading: true, hasMore: true } })} />);

    expect(screen.getByRole('button', { name: /carregando/i })).toBeDisabled();
  });

  it('counts in the singular when there is one item', () => {
    render(
      <AzuosInfiniteScrollFooter
        {...makeProps({ data: { loaded: 1, totalItems: 1 }, state: { isLoading: false, hasMore: false } })}
      />,
    );

    expect(screen.getByText('1 empresa — fim da lista')).toBeInTheDocument();
  });
});
