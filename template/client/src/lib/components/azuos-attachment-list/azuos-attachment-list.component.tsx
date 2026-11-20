import { AzuosFileLinks } from '../azuos-file-links/azuos-file-links.component';
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

  if (state?.isLoading)
    return <p className="text-muted-foreground text-sm">Carregando os anexos…</p>;

  if (data.attachments.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">{ui?.emptyLabel ?? 'Nenhum arquivo anexado.'}</p>
    );
  }

  /* Cada arquivo é a linha de arquivo da casa (`AzuosFileLinks` no formato `card`): o ícone do
     tipo, o nome, de quem é, as pílulas de abrir e baixar e, quando pode, a lixeira em vermelho.
     De quem é o arquivo vai ESCRITO na linha: sem isso, a única pista de por que uns têm lixeira
     e outros não seria a ausência dela — e ausência não explica nada a quem está olhando. */
  return (
    <ul className="flex flex-col gap-2">
      {data.attachments.map((attachment) => (
        <li key={attachment.id}>
          <AzuosFileLinks
            data={{
              fileName: attachment.fileName,
              viewUrl: attachment.viewUrl,
              downloadUrl: attachment.downloadUrl,
              detail: [
                attachment.kindLabel,
                fileSizeOf(attachment.sizeBytes),
                attachment.originLabel,
              ]
                .filter(Boolean)
                .join(' · '),
            }}
            ui={{ layout: 'card' }}
            state={{ isRemoving: state?.removingId === attachment.id }}
            actions={{
              onRemove:
                attachment.canRemove && actions?.onRemove
                  ? () => actions.onRemove?.(attachment)
                  : undefined,
            }}
          />
        </li>
      ))}
    </ul>
  );
}
