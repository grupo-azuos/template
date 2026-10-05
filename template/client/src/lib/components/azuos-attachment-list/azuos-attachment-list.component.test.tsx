import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  AzuosAttachmentList,
  fileSizeOf,
  type AzuosAttachment,
} from './azuos-attachment-list.component';

const ATTACHMENT: AzuosAttachment = {
  id: 1,
  fileName: 'contrato.pdf',
  sizeBytes: 2_400_000,
  kindLabel: 'Documento',
  originLabel: 'anexado pelo time',
  viewUrl: '/view/1',
  downloadUrl: '/download/1',
  canRemove: true,
};

describe('fileSizeOf', () => {
  // feliz
  /* Arquivo é coisa de MB: "2.400.000 bytes" não diz nada a ninguém. */
  it('writes megabytes with the Brazilian decimal comma', () => {
    expect(fileSizeOf(2_400_000)).toBe('2,3 MB');
  });

  it('falls back to kilobytes for a small file', () => {
    expect(fileSizeOf(180_000)).toBe('176 KB');
  });

  // triste
  /* "0 KB" se lê como arquivo corrompido. Um arquivo que existe ocupa pelo menos 1 KB na frase. */
  it('never writes zero for a file that exists', () => {
    expect(fileSizeOf(10)).toBe('1 KB');
  });
});

describe('AzuosAttachmentList', () => {
  // feliz
  it('offers both opening and downloading, which are different needs', () => {
    render(<AzuosAttachmentList data={{ attachments: [ATTACHMENT] }} />);

    expect(screen.getByRole('link', { name: /Abrir/ })).toHaveAttribute('href', '/view/1');
    expect(screen.getByRole('link', { name: /Baixar/ })).toHaveAttribute(
      'download',
      'contrato.pdf',
    );
  });

  /* De quem é o arquivo vai ESCRITO: sem isso, a única pista de por que uns têm botão de excluir e
     outros não seria a ausência do botão — e ausência não explica nada. */
  it('writes the kind, the size and where the file came from', () => {
    render(<AzuosAttachmentList data={{ attachments: [ATTACHMENT] }} />);

    expect(screen.getByText('Documento · 2,3 MB · anexado pelo time')).toBeInTheDocument();
  });

  it('removes the file that was asked for', async () => {
    const onRemove = vi.fn();
    render(<AzuosAttachmentList data={{ attachments: [ATTACHMENT] }} actions={{ onRemove }} />);

    await userEvent.click(screen.getByRole('button', { name: /Excluir contrato.pdf/ }));

    expect(onRemove).toHaveBeenCalledWith(ATTACHMENT);
  });

  // triste
  /* Quem não pode excluir não vê o botão. Esconder é conveniência — a recusa do servidor é a que
     vale —, mas um botão que sempre falha ensina a pessoa a desconfiar da tela. */
  it('hides the remove button for a file the viewer cannot remove', () => {
    render(
      <AzuosAttachmentList
        data={{ attachments: [{ ...ATTACHMENT, canRemove: false }] }}
        actions={{ onRemove: vi.fn() }}
      />,
    );

    expect(screen.queryByRole('button', { name: /Excluir/ })).not.toBeInTheDocument();
  });

  it('hides the remove button when the screen offers no removal at all', () => {
    render(<AzuosAttachmentList data={{ attachments: [ATTACHMENT] }} />);

    expect(screen.queryByRole('button', { name: /Excluir/ })).not.toBeInTheDocument();
  });

  it('says there is no file instead of drawing an empty box', () => {
    render(
      <AzuosAttachmentList
        data={{ attachments: [] }}
        ui={{ emptyLabel: 'Nenhum arquivo nesta tarefa.' }}
      />,
    );

    expect(screen.getByText('Nenhum arquivo nesta tarefa.')).toBeInTheDocument();
  });

  it('shows the failure instead of the list when the removal failed', () => {
    render(
      <AzuosAttachmentList
        data={{ attachments: [ATTACHMENT] }}
        state={{ error: 'O arquivo já tinha sido excluído.' }}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('O arquivo já tinha sido excluído.');
    expect(screen.queryByRole('link', { name: /Abrir/ })).not.toBeInTheDocument();
  });
});
