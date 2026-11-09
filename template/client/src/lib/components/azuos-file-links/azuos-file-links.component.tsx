import { Download, type LucideIcon } from 'lucide-react';

import { cn } from '../../utils/cn.util';
import { azuosActionButton } from '../azuos-action-button/azuos-action-button.component';

/**
 * Os dois caminhos para um arquivo anexado: ABRIR mostra numa aba nova (quem está conferindo quer
 * olhar o atestado sem encher a pasta de downloads) e BAIXAR salva com o nome original (quem vai
 * mandar para a contabilidade precisa do arquivo).
 *
 * O abrir é o texto, porque é o que se faz quase sempre; o baixar é o ícone ao lado, na régua dos
 * outros botões de linha (como a lixeira). Arquivo que o navegador não sabe mostrar (Word, Excel)
 * acaba baixado pelo abrir também — isso é do navegador, não daqui.
 *
 * `rel="noopener noreferrer"` porque o endereço assinado não deve viajar como referência.
 */
export type AzuosFileLinksProps = {
  data: {
    /** O nome do arquivo: vai no nome acessível dos dois links e no arquivo salvo. */
    fileName: string;
    viewUrl: string;
    downloadUrl: string;
    /** O texto do link de abrir. Sem ele, "Abrir". */
    openLabel?: string;
  };
  ui?: {
    /** Um ícone antes do texto de abrir — o clipe, quando o texto é o próprio nome do arquivo. */
    openIcon?: LucideIcon;
    className?: string;
  };
};

export function AzuosFileLinks({ data, ui }: AzuosFileLinksProps) {
  const OpenIcon = ui?.openIcon;

  return (
    <div className={cn('flex min-w-0 items-center gap-1', ui?.className)}>
      <a
        href={data.viewUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Abrir ${data.fileName}`}
        title={`Abrir ${data.fileName}`}
        className="inline-flex min-w-0 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        {OpenIcon ? <OpenIcon className="size-4 shrink-0" aria-hidden="true" /> : null}
        <span className="truncate">{data.openLabel ?? 'Abrir'}</span>
      </a>
      <a
        href={data.downloadUrl}
        download={data.fileName}
        rel="noopener noreferrer"
        aria-label={`Baixar ${data.fileName}`}
        title={`Baixar ${data.fileName}`}
        className={cn(
          azuosActionButton({ variant: 'ghost', size: 'sm', isIconOnly: true }),
          'inline-flex shrink-0 items-center justify-center',
        )}
      >
        <Download className="size-4" aria-hidden="true" />
      </a>
    </div>
  );
}
