import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Dialog, DialogTitle } from '../ui/dialog';
import { AzuosResponsiveDialogContent } from './azuos-responsive-dialog-content.component';

function renderOpen(props: Parameters<typeof AzuosResponsiveDialogContent>[0] = {}) {
  return render(
    <Dialog open>
      <AzuosResponsiveDialogContent {...props}>
        <DialogTitle>Nova tarefa</DialogTitle>
        <p>o conteúdo</p>
      </AzuosResponsiveDialogContent>
    </Dialog>,
  );
}

describe('AzuosResponsiveDialogContent', () => {
  // feliz
  it('draws a real dialog with its title and content', () => {
    renderOpen();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Nova tarefa')).toBeInTheDocument();
    expect(screen.getByText('o conteúdo')).toBeInTheDocument();
  });

  /* A alça só existe visualmente abaixo de `sm` (`sm:hidden`): é por isso que o gesto de arrastar
     nunca entra em conflito com a centralização do desktop. */
  it('keeps the drag handle out of the desktop layout and out of the screen reader', () => {
    renderOpen();

    const handle = screen.getByTestId('drag-handle');

    expect(handle.className).toContain('sm:hidden');
    expect(handle).toHaveAttribute('aria-hidden', 'true');
  });

  it('offers a close button with a name a screen reader can read', () => {
    renderOpen();

    expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument();
  });

  // triste
  /* Sem botão visível, o gatilho CONTINUA existindo — é nele que o arrastar clica sozinho —, mas sai
     do foco: do contrário sobraria um botão "Fechar" fantasma no tab, sem nada visível que explique
     o que é. */
  it('hides the close button from the tab order without removing it', () => {
    renderOpen({ showCloseButton: false });

    const close = screen.getByText('Fechar').closest('button');

    expect(close).toHaveAttribute('tabindex', '-1');
    expect(close).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not force an inline transform while nobody is dragging', () => {
    renderOpen();

    expect(screen.getByRole('dialog')).not.toHaveAttribute(
      'style',
      expect.stringContaining('translateY'),
    );
  });
});

describe('AzuosResponsiveDialogContent drag to dismiss', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function drag(from: number, to: number) {
    const handle = screen.getByTestId('drag-handle');

    fireEvent.pointerDown(handle, { clientY: from, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientY: to, pointerId: 1 });

    return handle;
  }

  // feliz
  it('follows the finger down while dragging, without a transition', () => {
    renderOpen();

    drag(10, 50);

    expect(screen.getByRole('dialog').style.transform).toBe('translateY(40px)');
    expect(screen.getByRole('dialog').style.transition).toBe('none');
  });

  /* Soltar depois do limiar fecha pelo MESMO gatilho do botão: é o que garante que o `onOpenChange`
     de quem abriu o diálogo seja avisado igual. */
  it('closes the dialog when released past the threshold', () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <AzuosResponsiveDialogContent>
          <DialogTitle>Nova tarefa</DialogTitle>
        </AzuosResponsiveDialogContent>
      </Dialog>,
    );

    const handle = drag(0, 200);
    fireEvent.pointerUp(handle, { pointerId: 1 });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  // triste
  /* Abaixo do limiar o conteúdo VOLTA ao lugar com transição — um toque hesitante não pode fechar
     o formulário que a pessoa estava preenchendo. */
  it('springs back when released before the threshold', () => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);

      return 0;
    });
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <AzuosResponsiveDialogContent>
          <DialogTitle>Nova tarefa</DialogTitle>
        </AzuosResponsiveDialogContent>
      </Dialog>,
    );

    const handle = drag(0, 40);
    act(() => {
      fireEvent.pointerUp(handle, { pointerId: 1 });
    });

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).not.toHaveAttribute(
      'style',
      expect.stringContaining('translateY'),
    );
  });

  it('never pulls the sheet upwards', () => {
    renderOpen();

    drag(100, 20);

    expect(screen.getByRole('dialog').style.transform).toBe('translateY(0px)');
  });

  it('ignores movement and release when no drag has started', () => {
    renderOpen();
    const handle = screen.getByTestId('drag-handle');

    fireEvent.pointerMove(handle, { clientY: 300, pointerId: 1 });
    fireEvent.pointerUp(handle, { pointerId: 1 });

    expect(screen.getByRole('dialog')).not.toHaveAttribute(
      'style',
      expect.stringContaining('translateY'),
    );
  });
});
