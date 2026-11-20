/**
 * O PACOTE .ZIP DO PROCESSO, montado no navegador — sem compressão ("store").
 *
 * Os arquivos do pacote (PDF, foto, Word) já vêm comprimidos: comprimir de novo quase não diminui
 * nada, e trazer uma biblioteca inteira para isso seria uma dependência a mais para manter. O
 * formato "store" é o mais simples que todo descompactador abre — Windows, macOS, celular.
 *
 * Os documentos ficam no computador da pessoa: o pacote nasce aqui, e nada sobe ao servidor só
 * para ser empacotado (há RG, CNH e comprovante de endereço lá dentro).
 *
 * Referência do formato: APPNOTE.TXT (PKWARE), seções 4.3.7 (cabeçalho local), 4.3.12 (diretório
 * central) e 4.3.16 (fim do diretório central). O nome vai em UTF-8 com o bit 11 ligado, que é o
 * que faz "Contrato Social - AÇÃO.docx" chegar com acento.
 */
export type ZipEntry = { name: string; data: Uint8Array };

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }

  return table;
})();

export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) crc = (CRC_TABLE[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);

  return (crc ^ 0xffffffff) >>> 0;
}

/** Data e hora no formato do MS-DOS, que é o que o .zip guarda. */
function dosDateTime(date: Date): { time: number; day: number } {
  const time =
    (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();

  return { time, day };
}

type Header = { name: Uint8Array; crc: number; size: number; offset: number };

const UTF8_FLAG = 0x0800;

function localHeader(header: Header, stamp: { time: number; day: number }): Uint8Array {
  const bytes = new Uint8Array(30 + header.name.length);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, UTF8_FLAG, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, stamp.time, true);
  view.setUint16(12, stamp.day, true);
  view.setUint32(14, header.crc, true);
  view.setUint32(18, header.size, true);
  view.setUint32(22, header.size, true);
  view.setUint16(26, header.name.length, true);
  bytes.set(header.name, 30);

  return bytes;
}

function centralHeader(header: Header, stamp: { time: number; day: number }): Uint8Array {
  const bytes = new Uint8Array(46 + header.name.length);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, UTF8_FLAG, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, stamp.time, true);
  view.setUint16(14, stamp.day, true);
  view.setUint32(16, header.crc, true);
  view.setUint32(20, header.size, true);
  view.setUint32(24, header.size, true);
  view.setUint16(28, header.name.length, true);
  view.setUint32(42, header.offset, true);
  bytes.set(header.name, 46);

  return bytes;
}

function endOfCentralDirectory(count: number, size: number, offset: number): Uint8Array {
  const bytes = new Uint8Array(22);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(8, count, true);
  view.setUint16(10, count, true);
  view.setUint32(12, size, true);
  view.setUint32(16, offset, true);

  return bytes;
}

/**
 * Dois arquivos com o mesmo nome no pacote viram um só ao descompactar — o segundo some sem aviso.
 * O repetido ganha " (2)", " (3)" antes da extensão.
 */
export function uniqueNames(names: string[]): string[] {
  const seen = new Map<string, number>();

  return names.map((name) => {
    const key = name.toLowerCase();
    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);
    if (count === 1) return name;

    const dot = name.lastIndexOf('.');
    if (dot <= 0) return `${name} (${count})`;

    return `${name.slice(0, dot)} (${count})${name.slice(dot)}`;
  });
}

export function createZipArchive(entries: ZipEntry[], now: Date = new Date()): Blob {
  const stamp = dosDateTime(now);
  const encoder = new TextEncoder();
  const names = uniqueNames(entries.map((entry) => entry.name));
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  entries.forEach((entry, index) => {
    const header = {
      name: encoder.encode(names[index]),
      crc: crc32(entry.data),
      size: entry.data.length,
      offset,
    };
    const local = localHeader(header, stamp);
    parts.push(local, entry.data);
    central.push(centralHeader(header, stamp));
    offset += local.length + entry.data.length;
  });

  const centralSize = central.reduce((sum, part) => sum + part.length, 0);
  const end = endOfCentralDirectory(entries.length, centralSize, offset);

  return new Blob([...parts, ...central, end] as BlobPart[], { type: 'application/zip' });
}
