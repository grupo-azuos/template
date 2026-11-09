import { describe, expect, it } from 'vitest';

import { crc32, createZipArchive, uniqueNames } from './zip-archive.util';

const bytes = (text: string) => new TextEncoder().encode(text);

describe('crc32', () => {
  // feliz
  it('matches the format reference value', () => {
    expect(crc32(bytes('123456789'))).toBe(0xcbf43926);
  });
});

describe('createZipArchive', () => {
  // feliz
  it('builds a .zip with the files, UTF-8 names and the directory at the end', async () => {
    const blob = createZipArchive(
      [
        { name: 'Contrato Social - AÇÃO.docx', data: bytes('word') },
        { name: 'FCN.pdf', data: bytes('%PDF-') },
      ],
      new Date(2026, 9, 14, 10, 30),
    );
    const data = new Uint8Array(await blob.arrayBuffer());
    const view = new DataView(data.buffer);

    expect(view.getUint32(0, true)).toBe(0x04034b50);
    expect(new TextDecoder().decode(data)).toContain('Contrato Social - AÇÃO.docx');
    const end = data.length - 22;
    expect(view.getUint32(end, true)).toBe(0x06054b50);
    expect(view.getUint16(end + 10, true)).toBe(2);
    expect(blob.type).toBe('application/zip');
  });

  // triste
  it('keeps an empty package a valid .zip (only the directory end)', async () => {
    const blob = createZipArchive([]);

    expect(blob.size).toBe(22);
  });
});

describe('uniqueNames', () => {
  // triste
  it('numbers a repeated name so no file vanishes when unzipping', () => {
    expect(uniqueNames(['RG.pdf', 'rg.pdf', 'RG.pdf', 'sem-extensao', 'sem-extensao'])).toEqual([
      'RG.pdf',
      'rg (2).pdf',
      'RG (3).pdf',
      'sem-extensao',
      'sem-extensao (2)',
    ]);
  });
});
