/**
 * A imagem colada (Ctrl+V), já com um nome legível — ou `null` quando o que se colou é texto.
 *
 * Pedido da equipe no sistema anterior: tirar o print e colar direto no alvará, em vez de
 * salvar em Downloads, procurar o arquivo, anexar e apagar da pasta. A área de transferência
 * não traz nome de arquivo, e sem um nome a lista vira "image.png" repetido, onde ninguém
 * sabe qual é qual.
 */
export function imageFromClipboard(clipboard: DataTransfer | null, now: Date): File | null {
  const item = Array.from(clipboard?.items ?? []).find(
    (entry) => entry.kind === 'file' && entry.type.startsWith('image/'),
  );
  const file = item?.getAsFile();
  if (!file) return null;

  const extension = file.type.split('/')[1]?.replace(/[^a-z0-9]/gi, '') || 'png';

  return new File([file], `print ${stamp(now)}.${extension}`, { type: file.type });
}

function stamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}h${pad(date.getMinutes())}`;
}
