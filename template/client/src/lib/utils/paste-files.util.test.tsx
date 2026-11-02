import { fireEvent, render, screen } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { pasteFilesIntoInput } from './paste-files.util';

/* O jsdom não tem `DataTransfer`; este faz o mínimo que o navegador faz. */
class FakeDataTransfer {
  private readonly list: File[] = [];
  readonly items = { add: (file: File) => this.list.push(file) };
  get files() {
    return this.list as unknown as FileList;
  }
}

function Area({ multiple = false, disabled = false, onPick = vi.fn() }) {
  return (
    <div onPaste={pasteFilesIntoInput}>
      <button type="button">Anexar</button>
      <input
        aria-label="Arquivo"
        type="file"
        multiple={multiple}
        disabled={disabled}
        onChange={(event) => onPick(Array.from(event.target.files ?? []))}
      />
    </div>
  );
}

const print = new File(['png'], 'print.png', { type: 'image/png' });
const pdf = new File(['pdf'], 'nota.pdf', { type: 'application/pdf' });

/* O jsdom só aceita um `FileList` de verdade em `input.files`, e não deixa criar um: no teste, o
   campo guarda a lista que receber, como o navegador faz. */
const original = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'files');

beforeAll(() => {
  Object.defineProperty(HTMLInputElement.prototype, 'files', {
    configurable: true,
    get(this: HTMLInputElement & { pasted?: FileList }) {
      return this.pasted ?? null;
    },
    set(this: HTMLInputElement & { pasted?: FileList }, value: FileList) {
      this.pasted = value;
    },
  });
});

afterAll(() => {
  if (original) Object.defineProperty(HTMLInputElement.prototype, 'files', original);
});

describe('pasteFilesIntoInput', () => {
  afterEach(() => vi.unstubAllGlobals());

  // feliz
  it('hands the pasted files to the same file field', () => {
    vi.stubGlobal('DataTransfer', FakeDataTransfer);
    const onPick = vi.fn();
    render(<Area multiple onPick={onPick} />);

    fireEvent.paste(screen.getByRole('button', { name: 'Anexar' }), {
      clipboardData: { files: [print, pdf] },
    });

    expect(onPick).toHaveBeenCalledWith([print, pdf]);
  });

  // feliz
  it('keeps only the first file in a single-file field', () => {
    vi.stubGlobal('DataTransfer', FakeDataTransfer);
    const onPick = vi.fn();
    render(<Area onPick={onPick} />);

    fireEvent.paste(screen.getByRole('button', { name: 'Anexar' }), {
      clipboardData: { files: [print, pdf] },
    });

    expect(onPick).toHaveBeenCalledWith([print]);
  });

  // triste
  it('ignores text, a disabled field and a browser without DataTransfer', () => {
    const onPick = vi.fn();
    vi.stubGlobal('DataTransfer', FakeDataTransfer);
    const { unmount } = render(<Area disabled onPick={onPick} />);
    fireEvent.paste(screen.getByRole('button', { name: 'Anexar' }), {
      clipboardData: { files: [print] },
    });
    unmount();

    render(<Area onPick={onPick} />);
    fireEvent.paste(screen.getByRole('button', { name: 'Anexar' }), {
      clipboardData: { files: [] },
    });
    vi.stubGlobal('DataTransfer', undefined);
    fireEvent.paste(screen.getByRole('button', { name: 'Anexar' }), {
      clipboardData: { files: [print] },
    });

    expect(onPick).not.toHaveBeenCalled();
  });
});
