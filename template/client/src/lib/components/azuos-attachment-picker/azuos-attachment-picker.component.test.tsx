import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  AzuosAttachmentPicker,
  identityOf,
  limitsSummary,
  reviewChoice,
} from './azuos-attachment-picker.component';

const LIMITS = { accept: 'image/*,application/pdf', maxCount: 3, maxBytes: 1024 * 1024 };

function fileOf(name: string, size: number, lastModified = 1): File {
  const file = new File(['x'], name, { type: 'application/pdf', lastModified });
  Object.defineProperty(file, 'size', { value: size });

  return file;
}

describe('identityOf', () => {
  // feliz
  /* É a MESMA chave que a lista usa para desenhar: se as duas divergirem, a recusa deixa passar um
     caso que a lista não sabe desenhar, e a tela cai. */
  it('tells two different files apart by name, size and modified date', () => {
    expect(identityOf(fileOf('a.pdf', 10))).not.toBe(identityOf(fileOf('b.pdf', 10)));
    expect(identityOf(fileOf('a.pdf', 10))).not.toBe(identityOf(fileOf('a.pdf', 20)));
  });

  // triste
  it('treats the same file chosen twice as the same file', () => {
    expect(identityOf(fileOf('a.pdf', 10))).toBe(identityOf(fileOf('a.pdf', 10)));
  });
});

describe('limitsSummary', () => {
  // feliz
  /* A pessoa precisa saber o que cabe ANTES de tentar: descobrir o limite pela recusa é escolher um
     vídeo de 80 MB, esperar o envio e ouvir que não podia. */
  it('says how many files fit and how big each one can be', () => {
    expect(limitsSummary({ accept: '*', maxCount: 5, maxBytes: 10 * 1024 * 1024 })).toBe(
      'Até 5 arquivos, de 10 MB cada',
    );
  });
});

describe('reviewChoice', () => {
  // feliz
  it('accepts files that fit the rules', () => {
    const review = reviewChoice([fileOf('a.pdf', 100)], [], LIMITS);

    expect(review.accepted).toHaveLength(1);
    expect(review.error).toBeNull();
  });

  // triste
  /* O mesmo arquivo de novo é um clique a mais, não uma intenção: subiria duplicado, pagaria o dobro
     de armazenamento e daria CHAVE REPETIDA na lista — o que derruba a tela inteira. */
  it('refuses the same file chosen twice', () => {
    const already = [fileOf('a.pdf', 100)];

    const review = reviewChoice([fileOf('a.pdf', 100)], already, LIMITS);

    expect(review.accepted).toHaveLength(0);
    expect(review.error).toContain('já está na lista');
  });

  it('refuses a file above the size ceiling, naming it', () => {
    const review = reviewChoice([fileOf('video.mp4', 5 * 1024 * 1024)], [], LIMITS);

    expect(review.error).toContain('video.mp4');
    expect(review.error).toContain('1 MB');
  });

  /* A conta soma o que já está no registro: quem já mandou dois não pode escolher mais dois quando o
     teto é três. */
  it('counts the files the record already has against the ceiling', () => {
    const review = reviewChoice([fileOf('a.pdf', 10), fileOf('b.pdf', 10)], [], LIMITS, 2);

    expect(review.accepted).toHaveLength(1);
    expect(review.error).toContain('no máximo 3');
  });

  it('stops at the first problem instead of listing five of them', () => {
    const review = reviewChoice(
      [fileOf('big.pdf', 5 * 1024 * 1024), fileOf('also-big.pdf', 5 * 1024 * 1024)],
      [],
      LIMITS,
    );

    expect(review.error).toContain('big.pdf');
    expect(review.error).not.toContain('also-big.pdf');
  });
});

describe('AzuosAttachmentPicker', () => {
  // feliz
  it('says what fits before the person tries', () => {
    render(
      <AzuosAttachmentPicker
        data={{ files: [], limits: LIMITS }}
        actions={{ onChange: vi.fn(), onError: vi.fn() }}
      />,
    );

    expect(screen.getByText('Até 3 arquivos, de 1 MB cada')).toBeInTheDocument();
  });

  it('reports the file that was chosen', async () => {
    const onChange = vi.fn();
    render(
      <AzuosAttachmentPicker
        data={{ files: [], limits: LIMITS }}
        actions={{ onChange, onError: vi.fn() }}
      />,
    );

    await userEvent.upload(screen.getByLabelText('Escolher arquivos'), fileOf('a.pdf', 100));

    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ name: 'a.pdf' })]);
  });

  it('takes a chosen file back out of the list', async () => {
    const onChange = vi.fn();
    const file = fileOf('a.pdf', 100);
    render(
      <AzuosAttachmentPicker
        data={{ files: [file], limits: LIMITS }}
        actions={{ onChange, onError: vi.fn() }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /Tirar a.pdf/ }));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  // triste
  /* A recusa é ANUNCIADA (`role="alert"`), e não só pintada: quem não vê a tela precisa saber que a
     escolha não entrou. */
  it('announces the refusal', () => {
    render(
      <AzuosAttachmentPicker
        data={{ files: [], limits: LIMITS }}
        state={{ error: '"video.mp4" passa de 1 MB.' }}
        actions={{ onChange: vi.fn(), onError: vi.fn() }}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('passa de 1 MB');
  });

  it('draws no list when nothing was chosen yet', () => {
    render(
      <AzuosAttachmentPicker
        data={{ files: [], limits: LIMITS }}
        actions={{ onChange: vi.fn(), onError: vi.fn() }}
      />,
    );

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  // Ctrl+V (clipboard paste) e Drag & Drop
  it('captura arquivos colados via Ctrl+V da área de transferência', () => {
    const onChange = vi.fn();
    const onError = vi.fn();
    const { container } = render(
      <AzuosAttachmentPicker
        data={{ files: [], limits: LIMITS }}
        actions={{ onChange, onError }}
      />,
    );

    const pastedFile = fileOf('print-tela.png', 500);
    fireEvent.paste(container.firstChild as HTMLElement, {
      clipboardData: {
        files: [pastedFile],
        items: [{ kind: 'file', getAsFile: () => pastedFile }],
      },
    });

    expect(onError).toHaveBeenCalledWith(null);
    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ name: 'print-tela.png' })]);
  });

  it('recusa arquivo colado quando passa do limite de tamanho', () => {
    const onChange = vi.fn();
    const onError = vi.fn();
    const { container } = render(
      <AzuosAttachmentPicker
        data={{ files: [], limits: LIMITS }}
        actions={{ onChange, onError }}
      />,
    );

    const bigFile = fileOf('grande.pdf', 5 * 1024 * 1024);
    fireEvent.paste(container.firstChild as HTMLElement, {
      clipboardData: {
        files: [bigFile],
        items: [{ kind: 'file', getAsFile: () => bigFile }],
      },
    });

    expect(onError).toHaveBeenCalledWith(expect.stringContaining('passa de 1 MB'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('suporta arrastar e soltar arquivos (drag and drop)', () => {
    const onChange = vi.fn();
    render(
      <AzuosAttachmentPicker
        data={{ files: [], limits: LIMITS }}
        actions={{ onChange, onError: vi.fn() }}
      />,
    );

    const droppedFile = fileOf('documento.pdf', 300);
    const dropzone = screen.getByText('Escolher arquivos').closest('label');
    expect(dropzone).toBeInTheDocument();

    fireEvent.drop(dropzone!, {
      dataTransfer: {
        files: [droppedFile],
      },
    });

    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ name: 'documento.pdf' })]);
  });

  it('não processa colagem via Ctrl+V quando o campo está desabilitado', () => {
    const onChange = vi.fn();
    const onError = vi.fn();
    const { container } = render(
      <AzuosAttachmentPicker
        data={{ files: [], limits: LIMITS }}
        state={{ isDisabled: true }}
        actions={{ onChange, onError }}
      />,
    );

    const file = fileOf('anexo.pdf', 100);
    fireEvent.paste(container.firstChild as HTMLElement, {
      clipboardData: {
        files: [file],
      },
    });

    expect(onChange).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });
});
