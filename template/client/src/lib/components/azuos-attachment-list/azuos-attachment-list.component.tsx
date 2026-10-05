import { Download, ExternalLink, Trash2 } from 'lucide-react';

import { AzuosActionButton } from '../azuos-action-button/azuos-action-button.component';
import { AzuosErrorState } from '../azuos-error-state/azuos-error-state.component';

/**
 * A lista de arquivos de um registro, com abrir, baixar e (quando permitido) excluir.
 *
 * Função pura de props: QUEM PODE EXCLUIR é decidido fora, no view-model, e chega em
 * `canRemove` por arquivo. O componente não conhece dono, perfil nem permissão — é o que permite
 * a mesma lista servir à tela de quem atende e à consulta pública, que não apaga nada.
 *
 * Esconder o botão é CONVENIÊNCIA; a recusa do servidor é a que vale.
 */
export type AzuosAttachment = {
  id: number | string;
  fileName: string;
  sizeBytes: number;
  /** O grupo do arquivo, em português: "Imagem", "Documento", "Vídeo". */
  kindLabel: string;
  /** De onde ele veio, em português: "enviado por quem abriu", "anexado pelo time". */
  originLabel?: string;
  viewUrl: string;
  downloadUrl: string;
  /** Decidido pelo view-model, nunca aqui. */
  canRemove?: boolean;
};

export type AzuosAttachmentListProps = {
  data: { attachments: AzuosAttachment[] };
  ui?: {
    /** O texto quando não há nenhum arquivo. Cada tela diz isso do jeito dela. */
    emptyLabel?: string;
  };
  state?: {
    isLoading?: boolean;
    /** Qual está sendo excluído agora — trava só a linha dele, não a lista inteira. */
    removingId?: number | string | null;
    error?: string | null;
  };
  actions?: {
    /** Ausente quando quem está olhando não pode excluir nada. */
    onRemove?: (attachment: AzuosAttachment) => void;
  };
};

/** O tamanho em palavras. Arquivo é coisa de MB: byte cru não diz nada a ninguém. */
export function fileSizeOf(bytes: number): string {
  const megabytes = bytes / (1024 * 1024);
  if (megabytes >= 1) return `${megabytes.toFixed(1).replace('.', ',')} MB`;

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function AzuosAttachmentList({ data, ui, state, actions }: AzuosAttachmentListProps) {
  /* Estados na frente, conteúdo por último e sem aninhamento. */
  if (state?.error) {
    return (
      <AzuosErrorState data={{ title: 'Não consegui excluir o anexo', message: state.error }} />
    );
  }

  if (state?.isLoading) return <p className="text-ink-500 text-sm">Carregando os anexos…</p>;

  if (data.attachments.length === 0) {
    return <p className="text-ink-500 text-sm">{ui?.emptyLabel ?? 'Nenhum arquivo anexado.'}</p>;
  }

  return (
    <ul className="rounded-box divide-y border">
      {data.attachments.map((attachment) => (
        <li key={attachment.id} className="flex items-center justify-between gap-3 p-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-ink-900 truncate text-sm">{attachment.fileName}</p>
            {/* De quem é o arquivo vai ESCRITO na linha. Sem isso, a única pista de por que uns têm
                botão de excluir e outros não seria a ausência do botão — e ausência não explica
                nada a quem está olhando. */}
            <p className="text-ink-500 text-xs">
              {[attachment.kindLabel, fileSizeOf(attachment.sizeBytes), attachment.originLabel]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {/*
              Dois caminhos para o mesmo arquivo, de propósito: ABRIR mostra na tela (quem está
              atendendo quer olhar a foto sem encher a pasta de downloads) e BAIXAR entrega o
              arquivo com o nome original (quem vai anexar num processo precisa dele).
              `rel="noreferrer"` porque o endereço assinado não deve viajar como referência.
            */}
            <a
              className="text-ink-700 hover:bg-muted rounded-chip inline-flex items-center gap-1 px-2 py-1 text-xs"
              href={attachment.viewUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="size-3.5" aria-hidden="true" />
              Abrir
            </a>

            <a
              className="text-ink-700 hover:bg-muted rounded-chip inline-flex items-center gap-1 px-2 py-1 text-xs"
              href={attachment.downloadUrl}
              download={attachment.fileName}
              rel="noopener noreferrer"
            >
              <Download className="size-3.5" aria-hidden="true" />
              Baixar
            </a>

            {attachment.canRemove && actions?.onRemove ? (
              <AzuosActionButton
                data={{ label: `Excluir ${attachment.fileName}` }}
                ui={{ variant: 'ghost', size: 'sm', icon: Trash2, isIconOnly: true }}
                state={{ isLoading: state?.removingId === attachment.id }}
                actions={{ onClick: () => actions.onRemove?.(attachment) }}
              />
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
