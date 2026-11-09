import { Paperclip, X } from 'lucide-react';
import { type ClipboardEvent, type DragEvent, useRef, useState } from 'react';

import { cn } from '../../utils/cn.util';
import { AzuosActionButton } from '../azuos-action-button/azuos-action-button.component';
import { fileSizeOf } from '../azuos-attachment-list/azuos-attachment-list.component';

/**
 * A escolha dos arquivos que serão enviados — antes do envio.
 *
 * As REGRAS chegam por props (`data.limits`), não são decididas aqui: quanto cabe e de que tipo é
 * assunto do domínio, e a mesma função que recusa aqui tem de ser a que a API usa para recusar. Com a
 * regra escrita dentro do componente, a tela aceita o que o envio devolve.
 */
export type AzuosAttachmentLimits = {
  /** O `accept` do campo: 'image/*,application/pdf'. */
  accept: string;
  /** Quantos arquivos, ao todo, contando o que já foi enviado. */
  maxCount: number;
  /** O teto de cada arquivo, em bytes. */
  maxBytes: number;
};

export type AzuosAttachmentPickerProps = {
  data: {
    /** Os arquivos já escolhidos, ainda não enviados. */
    files: File[];
    limits: AzuosAttachmentLimits;
    /** Quantos arquivos o registro JÁ TEM. A conta do limite soma os dois. */
    existingCount?: number;
  };
  ui?: { className?: string };
  state?: {
    isDisabled?: boolean;
    /** A recusa da última escolha, em português. */
    error?: string | null;
  };
  actions: {
    onChange: (files: File[]) => void;
    onError: (message: string | null) => void;
  };
};

/** A linha que resume o que cabe, para a pessoa saber ANTES de tentar. */
export function limitsSummary(limits: AzuosAttachmentLimits): string {
  const megabytes = Math.round(limits.maxBytes / (1024 * 1024));

  return `Até ${limits.maxCount} arquivos, de ${megabytes} MB cada`;
}

/**
 * A IDENTIDADE DE UM ARQUIVO: nome, tamanho e data de modificação.
 *
 * É o mais perto de "é o mesmo arquivo" que dá para saber sem abrir o conteúdo — e abrir megabytes de
 * vídeo só para comparar seria pagar caro por uma certeza que ninguém precisa aqui.
 *
 * Exportada porque é a MESMA chave que a lista usa para desenhar: se as duas divergirem, a recusa
 * deixa passar um caso que a lista não sabe desenhar, e a tela cai.
 */
export function identityOf(file: File): string {
  return `${file.name}::${file.size}::${file.lastModified}`;
}

/**
 * Julga os arquivos escolhidos contra o que já existe e o que já foi escolhido.
 *
 * Para no PRIMEIRO problema, e não acumula uma lista: quem escolheu cinco arquivos errados conserta um
 * de cada vez, e cinco frases de erro de uma vez não ajudam ninguém.
 *
 * O MESMO ARQUIVO DE NOVO É RECUSADO. Escolher a mesma nota duas vezes é um clique a mais, não uma
 * intenção: subiria o arquivo duplicado, pagaria o dobro de armazenamento e ocuparia duas vagas da
 * cota. Pior: a lista abaixo é desenhada por `nome + tamanho`, e dois iguais dariam CHAVE REPETIDA —
 * o que não desenha torto, derruba a tela inteira.
 */
export function reviewChoice(
  chosen: readonly File[],
  already: readonly File[],
  limits: AzuosAttachmentLimits,
  existingCount = 0,
): { accepted: File[]; error: string | null } {
  const accepted: File[] = [];
  const seen = already.map(identityOf);
  let total = already.length + existingCount;

  for (const file of chosen) {
    if (seen.includes(identityOf(file))) {
      return { accepted, error: `"${file.name}" já está na lista.` };
    }

    if (file.size > limits.maxBytes) {
      const megabytes = Math.round(limits.maxBytes / (1024 * 1024));

      return { accepted, error: `"${file.name}" passa de ${megabytes} MB.` };
    }

    if (total >= limits.maxCount) {
      return { accepted, error: `Cabem no máximo ${limits.maxCount} arquivos.` };
    }

    accepted.push(file);
    seen.push(identityOf(file));
    total += 1;
  }

  return { accepted, error: null };
}

function extractFilesFromClipboard(clipboardData: DataTransfer | null): File[] {
  if (!clipboardData) return [];
  if (clipboardData.files && clipboardData.files.length > 0) {
    return Array.from(clipboardData.files);
  }

  const files: File[] = [];
  const items = clipboardData.items ?? [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item || item.kind !== 'file') continue;
    const file = item.getAsFile();
    if (file) files.push(file);
  }
  return files;
}

export function AzuosAttachmentPicker({ data, ui, state, actions }: AzuosAttachmentPickerProps) {
  /* O `<input type="file">` não deixa tirar um arquivo da seleção por código sem limpar o campo
     inteiro, então ele é zerado a cada escolha e quem guarda a lista é o view-model. */
  const inputRef = useRef<HTMLInputElement>(null);
  const isDisabled = state?.isDisabled === true;
  const [isDragOver, setIsDragOver] = useState(false);

  const choose = (chosen: File[]) => {
    if (inputRef.current) inputRef.current.value = '';
    if (chosen.length === 0) return;

    const review = reviewChoice(chosen, data.files, data.limits, data.existingCount ?? 0);

    actions.onError(review.error);
    if (review.accepted.length > 0) actions.onChange([...data.files, ...review.accepted]);
  };

  const drop = (file: File) => {
    actions.onError(null);
    actions.onChange(data.files.filter((chosen) => chosen !== file));
  };

  /** Captura arquivos colados da área de transferência (Ctrl+V) ou itens de print/imagem. */
  const handlePaste = (event: ClipboardEvent<HTMLElement>) => {
    if (isDisabled) return;
    const clipboardFiles = extractFilesFromClipboard(event.clipboardData);
    if (clipboardFiles.length === 0) return;

    event.preventDefault();
    choose(clipboardFiles);
  };

  const handleDragOver = (event: DragEvent<HTMLElement>) => {
    if (isDisabled) return;
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    if (isDisabled) return;
    event.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(event.dataTransfer?.files ?? []);
    if (droppedFiles.length > 0) {
      choose(droppedFiles);
    }
  };

  return (
    <div className={cn('relative flex flex-col gap-2', ui?.className)} onPaste={handlePaste}>
      <label
        htmlFor="azuos-attachments"
        aria-label="Escolher arquivos"
        tabIndex={isDisabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'flex control-lg cursor-pointer items-center justify-between rounded-control border border-dashed border-input px-3 text-sm transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          isDragOver && 'border-ring bg-muted',
          isDisabled && 'pointer-events-none opacity-60',
        )}
      >
        <div className="flex items-center gap-2">
          <Paperclip className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="font-medium text-foreground">Escolher arquivos</span>
        </div>
        <span className="text-xs text-muted-foreground">ou cole com Ctrl+V</span>
      </label>

      <input
        ref={inputRef}
        id="azuos-attachments"
        className="sr-only"
        type="file"
        multiple
        accept={data.limits.accept}
        disabled={isDisabled}
        onChange={(event) => choose(Array.from(event.target.files ?? []))}
      />

      <p className="text-xs text-muted-foreground">{limitsSummary(data.limits)}</p>

      {state?.error ? (
        <p className="text-xs text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      {data.files.length > 0 ? (
        <ul className="divide-y divide-border rounded-box border border-border">
          {data.files.map((file, index) => (
            /* A chave leva a POSIÇÃO junto com a identidade. A recusa acima já barra o mesmo arquivo
               duas vezes, mas chave repetida derruba a tela inteira — e nenhuma lista de anexos vale
               uma tela em branco. Cinto e suspensório, de propósito. */
            <li
              key={`${identityOf(file)}-${index}`}
              className="flex items-center justify-between gap-2 p-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">{fileSizeOf(file.size)}</p>
              </div>

              <AzuosActionButton
                data={{ label: `Tirar ${file.name}` }}
                ui={{ variant: 'ghost', size: 'sm', icon: X, isIconOnly: true }}
                state={{ isDisabled }}
                actions={{ onClick: () => drop(file) }}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
