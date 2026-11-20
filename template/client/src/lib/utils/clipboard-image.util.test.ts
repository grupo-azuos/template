import { describe, expect, it } from 'vitest';

import { imageFromClipboard } from './clipboard-image.util';

function clipboardWith(items: { kind: string; type: string; file: File | null }[]): DataTransfer {
  return {
    items: items.map((item) => ({ kind: item.kind, type: item.type, getAsFile: () => item.file })),
  } as unknown as DataTransfer;
}

const NOW = new Date(2026, 8, 16, 9, 5);

describe('imageFromClipboard', () => {
  it('names the pasted image after the moment it was pasted', () => {
    const image = new File(['x'], 'image.png', { type: 'image/png' });

    const file = imageFromClipboard(
      clipboardWith([{ kind: 'file', type: 'image/png', file: image }]),
      NOW,
    );

    expect(file?.name).toBe('print 16-09-2026 09h05.png');
    expect(file?.type).toBe('image/png');
  });

  it('ignores pasted text so the browser keeps pasting it into the field', () => {
    const file = imageFromClipboard(
      clipboardWith([{ kind: 'string', type: 'text/plain', file: null }]),
      NOW,
    );

    expect(file).toBeNull();
  });

  it('ignores a pasted file that is not an image', () => {
    const pdf = new File(['x'], 'a.pdf', { type: 'application/pdf' });

    const file = imageFromClipboard(
      clipboardWith([{ kind: 'file', type: 'application/pdf', file: pdf }]),
      NOW,
    );

    expect(file).toBeNull();
  });

  it('returns null when there is no clipboard data at all', () => {
    expect(imageFromClipboard(null, NOW)).toBeNull();
  });
});
