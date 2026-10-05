import { Download } from 'lucide-react';

import { cn } from '../../utils/cn.util';
import { AzuosActionButton } from '../azuos-action-button/azuos-action-button.component';

/**
 * Os botões de "baixar relatório", na mesma forma em qualquer tela que precise deles.
 *
 * Função pura de props: quem baixa o arquivo e mostra o navegador salvando é o view-model que chama
 * `onExport` (com `triggerBrowserDownload`, em `lib/utils/download-file.util.ts`), não este
 * componente.
 *
 * Enquanto um formato baixa, os OUTROS ficam desligados: dois downloads simultâneos do mesmo
 * relatório montam o arquivo duas vezes no servidor, e a segunda resposta costuma chegar como tempo
 * esgotado — num relatório que tinha dado certo.
 */
export type AzuosReportFormat = { value: string; label: string };

export type AzuosReportExportActionsProps = {
  data?: { formats?: readonly AzuosReportFormat[] };
  ui?: { className?: string };
  state: { exportingFormat: string | null };
  actions: { onExport: (format: string) => void };
};

/** Os três formatos que uma pessoa de escritório espera encontrar. */
export const DEFAULT_REPORT_FORMATS: readonly AzuosReportFormat[] = [
  { value: 'xlsx', label: 'Excel' },
  { value: 'docx', label: 'Word' },
  { value: 'pdf', label: 'PDF' },
];

export function AzuosReportExportActions({
  data,
  ui,
  state,
  actions,
}: AzuosReportExportActionsProps) {
  const formats = data?.formats ?? DEFAULT_REPORT_FORMATS;
  const isBusy = state.exportingFormat !== null;

  return (
    /* `items-center` pelo mesmo motivo do `AzuosPageHeader`: sem ele os botões esticam até a altura
       da fileira, e ao lado de um botão maior eles encostam no topo. */
    <div className={cn('flex flex-wrap items-center gap-2', ui?.className)}>
      {formats.map((format) => (
        <AzuosActionButton
          key={format.value}
          data={{ label: format.label, loadingLabel: 'Baixando…' }}
          ui={{ variant: 'secondary', size: 'sm', icon: Download }}
          state={{
            isLoading: state.exportingFormat === format.value,
            isDisabled: isBusy && state.exportingFormat !== format.value,
          }}
          actions={{ onClick: () => actions.onExport(format.value) }}
        />
      ))}
    </div>
  );
}
