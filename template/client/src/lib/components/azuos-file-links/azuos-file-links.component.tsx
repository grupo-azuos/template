import {
  Download,
  ExternalLink,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  type LucideIcon,
  Trash2,
} from 'lucide-react';

import { type AzuosCardTone, cardToneClasses } from '../../utils/card-tone.util';
import { cn } from '../../utils/cn.util';
import { AzuosActionButton } from '../azuos-action-button/azuos-action-button.component';

/**
 * Os dois caminhos para um arquivo anexado: ABRIR mostra numa aba nova (quem está conferindo quer
 * olhar o atestado sem encher a pasta de downloads) e BAIXAR salva com o nome original (quem vai
 * mandar para a contabilidade precisa do arquivo).
 *
 * No padrão Apple os dois são PÍLULAS CINZA iguais, cada uma com o seu ícone e o seu verbo — nada
 * de um link azul solto ao lado de um ícone sem nome, que obrigava a adivinhar o que o ícone faz.
 * Duas formas:
 *
 * - `inline` (padrão): só as duas pílulas, para a linha de tabela e de lista.
 * - `card`: a linha do arquivo inteira — o ícone do tipo (PDF vermelho, planilha verde, imagem
 *   roxa), o nome e o tipo embaixo, e as duas pílulas à direita. Para a ficha e o detalhe. Com
 *   `actions.onRemove`, ganha a lixeira no fim, em vermelho (perigo). É a linha do
 *   `AzuosAttachmentList`.
 *
 * Arquivo que o navegador não sabe mostrar (Word, Excel) acaba baixado pelo abrir também — isso é
 * do navegador, não daqui. `rel="noopener noreferrer"` porque o endereço assinado não deve viajar
 * como referência.
 */
export type AzuosFileLinksProps = {
  data: {
    /** O nome do arquivo: vai no nome acessível dos dois links, no arquivo salvo e no `card`. */
    fileName: string;
    viewUrl: string;
    downloadUrl: string;
    /** O texto do link de abrir. Sem ele, "Abrir". */
    openLabel?: string;
    /** O tamanho já escrito ("182 KB"), mostrado no `card` ao lado do tipo. */
    sizeLabel?: string;
    /** A linha de baixo do `card`, escrita por quem chama ("Documento · 2,3 MB · anexado pelo
        time"). Sem ela, o tipo pela extensão e o tamanho. */
    detail?: string;
  };
  ui?: {
    /** `inline`: só as duas pílulas. `card`: a linha do arquivo com ícone, nome e as pílulas. */
    layout?: 'inline' | 'card';
    /** O ícone da pílula de abrir. Sem ele, a seta de "abrir em nova aba". */
    openIcon?: LucideIcon;
    className?: string;
  };
  /** `isRemoving`: a lixeira gira enquanto o arquivo é excluído. */
  state?: { isRemoving?: boolean };
  /** Ausente quando quem está olhando não pode excluir: a lixeira nem aparece. */
  actions?: { onRemove?: () => void };
};

type FileKind = { icon: LucideIcon; tone: AzuosCardTone; label: string };

/** O tipo do arquivo pela extensão: o ícone e o tom do quadradinho do `card`. */
const KINDS: { match: RegExp; kind: FileKind }[] = [
  { match: /\.pdf$/i, kind: { icon: FileText, tone: 'red', label: 'PDF' } },
  {
    match: /\.(xlsx?|csv|ods)$/i,
    kind: { icon: FileSpreadsheet, tone: 'green', label: 'Planilha' },
  },
  {
    match: /\.(png|jpe?g|gif|webp|heic|svg)$/i,
    kind: { icon: FileImage, tone: 'plum', label: 'Imagem' },
  },
  { match: /\.(docx?|odt|txt|rtf)$/i, kind: { icon: FileText, tone: 'blue', label: 'Documento' } },
];

const OTHER_KIND: FileKind = { icon: File, tone: 'slate', label: 'Arquivo' };

export function fileKindOf(fileName: string): FileKind {
  return KINDS.find((item) => item.match.test(fileName))?.kind ?? OTHER_KIND;
}

const PILL =
  'inline-flex control-sm shrink-0 items-center gap-1.5 rounded-button bg-muted px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none';

export function AzuosFileLinks({ data, ui, state, actions }: AzuosFileLinksProps) {
  if (ui?.layout === 'card')
    return <FileCard data={data} ui={ui} state={state} actions={actions} />;

  return <FilePills data={data} ui={ui} className={ui?.className} />;
}

/** As duas pílulas: abrir (com o rótulo, que pode ser o nome do arquivo) e baixar. */
function FilePills({
  data,
  ui,
  className,
}: Pick<AzuosFileLinksProps, 'data' | 'ui'> & { className?: string }) {
  const OpenIcon = ui?.openIcon ?? ExternalLink;

  return (
    <div className={cn('flex min-w-0 items-center gap-1.5', className)}>
      <a
        href={data.viewUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Abrir ${data.fileName}`}
        title={`Abrir ${data.fileName}`}
        className={cn(PILL, 'min-w-0 shrink')}
      >
        <OpenIcon className="text-primary size-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{data.openLabel ?? 'Abrir'}</span>
      </a>
      <a
        href={data.downloadUrl}
        download={data.fileName}
        rel="noopener noreferrer"
        aria-label={`Baixar ${data.fileName}`}
        title={`Baixar ${data.fileName}`}
        className={PILL}
      >
        <Download className="text-primary size-4 shrink-0" aria-hidden="true" />
        Baixar
      </a>
    </div>
  );
}

/** A linha do arquivo: o ícone do tipo, o nome e o tipo, e as duas pílulas à direita. */
function FileCard({ data, ui, state, actions }: AzuosFileLinksProps) {
  const kind = fileKindOf(data.fileName);
  const KindIcon = kind.icon;
  const details = data.detail ?? [kind.label, data.sizeLabel].filter(Boolean).join(' · ');

  return (
    <div
      data-slot="file-card"
      className={cn(
        'rounded-surface bg-card shadow-card flex min-w-0 flex-wrap items-center gap-3 p-3',
        ui?.className,
      )}
    >
      <span
        className={cn(
          'rounded-icon flex size-10 shrink-0 items-center justify-center',
          cardToneClasses(kind.tone).dot,
        )}
      >
        <KindIcon className="size-5" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-foreground truncate text-sm font-semibold" title={data.fileName}>
          {data.fileName}
        </span>
        <span className="text-muted-foreground text-xs">{details}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        <FilePills data={data} ui={{ openIcon: ui?.openIcon }} />
        {actions?.onRemove ? (
          <AzuosActionButton
            data={{ label: `Excluir ${data.fileName}` }}
            ui={{ variant: 'danger-soft', size: 'sm', icon: Trash2, isIconOnly: true }}
            state={{ isLoading: state?.isRemoving }}
            actions={{ onClick: actions.onRemove }}
          />
        ) : null}
      </span>
    </div>
  );
}
