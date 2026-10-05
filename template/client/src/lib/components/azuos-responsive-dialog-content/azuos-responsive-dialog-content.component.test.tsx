import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

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
