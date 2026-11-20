import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { type AzuosArchivedListProps, AzuosArchivedList } from './azuos-archived-list.component';

const ITEM = {
  key: 'attachment:9',
  label: 'alvara-bombeiro.pdf',
  kind: 'Anexo',
  archivedAt: '2026-11-07T15:00:00.000Z',
  canRestore: true,
};

function props(overrides: Partial<AzuosArchivedListProps> = {}): AzuosArchivedListProps {
  return {
    data: { title: 'Removidos deste alvará', items: [ITEM] },
    state: { isLoading: false, restoringKey: null, error: null },
    actions: { onOpenChange: vi.fn(), onRestore: vi.fn() },
    ...overrides,
  };
}

async function open() {
  await userEvent.click(screen.getByRole('button', { name: /Removidos deste alvará/ }));
}

describe('AzuosArchivedList', () => {
  // feliz
  it('starts closed and tells the screen when the person opens it', async () => {
    const view = props();
    render(<AzuosArchivedList {...view} />);

    expect(screen.queryByText('alvara-bombeiro.pdf')).not.toBeInTheDocument();
    await open();

    expect(view.actions.onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.getByText('alvara-bombeiro.pdf')).toBeInTheDocument();
  });

  // feliz
  it('undoes the item the person picked', async () => {
    const view = props();
    render(<AzuosArchivedList {...view} />);
    await open();

    await userEvent.click(screen.getByRole('button', { name: 'Desfazer' }));

    expect(view.actions.onRestore).toHaveBeenCalledWith('attachment:9');
  });

  // triste
  it('offers no undo to who cannot, and says when there is nothing', async () => {
    const { rerender } = render(
      <AzuosArchivedList
        {...props({
          data: { title: 'Removidos deste alvará', items: [{ ...ITEM, canRestore: false }] },
        })}
      />,
    );
    await open();
    expect(screen.queryByRole('button', { name: 'Desfazer' })).not.toBeInTheDocument();

    rerender(
      <AzuosArchivedList {...props({ data: { title: 'Removidos deste alvará', items: [] } })} />,
    );
    expect(screen.getByText('Nada foi removido.')).toBeInTheDocument();
  });

  // triste
  it('shows the error and the loading state in place of the list', async () => {
    const { rerender } = render(
      <AzuosArchivedList
        {...props({ state: { isLoading: false, restoringKey: null, error: 'Falhou' } })}
      />,
    );
    await open();
    expect(screen.getByRole('alert')).toHaveTextContent('Falhou');

    rerender(
      <AzuosArchivedList
        {...props({ state: { isLoading: true, restoringKey: null, error: null } })}
      />,
    );
    expect(screen.getByText('Carregando os removidos…')).toBeInTheDocument();
  });

  // triste
  it('locks the other buttons while one undoes', async () => {
    render(
      <AzuosArchivedList
        {...props({
          data: {
            title: 'Removidos deste alvará',
            items: [ITEM, { ...ITEM, key: 'conversation:5', label: 'Protocolo entregue' }],
          },
          state: { isLoading: false, restoringKey: 'attachment:9', error: null },
        })}
      />,
    );
    await open();

    for (const button of screen.getAllByRole('button', { name: /Desfaz/ })) {
      expect(button).toBeDisabled();
    }
  });
});
