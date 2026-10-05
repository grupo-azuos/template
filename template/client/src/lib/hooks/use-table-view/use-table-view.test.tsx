import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useTableView } from './use-table-view';

function Probe() {
  const tableView = useTableView();

  return (
    <button type="button" onClick={tableView.actions.onToggle}>
      {tableView.forceCards ? 'cartões' : 'automático'}
    </button>
  );
}

/**
 * A preferência vive no escopo do módulo — de propósito, para duas telas não terem cada uma a sua
 * cópia. Estes testes não presumem em qual formato a suíte começou: cada um lê o estado de ANTES e
 * verifica a mudança, que é o que o hook promete em qualquer ordem.
 */
describe('useTableView', () => {
  // feliz
  it('starts on one of the two formats', () => {
    render(<Probe />);

    expect(screen.getByRole('button').textContent).toMatch(/^(cartões|automático)$/);
  });

  it('switches format and tells every reader at once', () => {
    render(
      <>
        <Probe />
        <Probe />
      </>,
    );
    const [first, second] = screen.getAllByRole('button');
    const before = first?.textContent;

    act(() => first?.click());

    expect(first?.textContent).not.toBe(before);
    /* As duas telas leem a MESMA preferência: duas cópias divergiriam no primeiro clique, e uma lista
       abriria em cartões enquanto a outra continuaria em tabela. */
    expect(second?.textContent).toBe(first?.textContent);
  });

  // triste
  it('comes back to the first format on a second toggle', () => {
    render(<Probe />);
    const button = screen.getByRole('button');
    const before = button.textContent;

    act(() => button.click());
    act(() => button.click());

    expect(button.textContent).toBe(before);
  });
});
