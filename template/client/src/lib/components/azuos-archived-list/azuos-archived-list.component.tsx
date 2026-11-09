import { ArchiveRestore } from 'lucide-react';

import { formatDateTime } from '../../utils/format-date.util';
import { AzuosActionButton } from '../azuos-action-button/azuos-action-button.component';
import { AzuosCollapsible } from '../azuos-collapsible/azuos-collapsible.component';

/**
 * O QUE FOI REMOVIDO — e pode voltar.
 *
 * Nada se apaga no sistema: remover ARQUIVA. O arquivado some da tela, e é aqui que ele
 * aparece de novo, só quando a pessoa pede (o bloco nasce fechado). Cada linha diz o que era,
 * quando saiu, e tem o "Desfazer" — que só aparece para quem pode desfazer.
 *
 * Genérico de propósito: o alvará (conversas, protocolos, anexos), as tags e os documentos do
 * contrato mostram os removidos do mesmo jeito.
 */
export type AzuosArchivedItem = {
  /** Único na lista, mesmo misturando tipos (`conversation:5`, `attachment:9`). */
  key: string;
  /** O que era — o texto, o nome do arquivo, o protocolo. */
  label: string;
  /** O tipo, quando a lista mistura (`Conversa`, `Anexo`). */
  kind?: string;
  archivedAt: string;
  canRestore: boolean;
};

export type AzuosArchivedListProps = {
  data: { title: string; items: AzuosArchivedItem[] };
  ui?: { className?: string };
  state: { isLoading: boolean; restoringKey: string | null; error: string | null };
  actions: {
    /** Avisa a tela que o bloco abriu — é quando ela busca os removidos. */
    onOpenChange: (isOpen: boolean) => void;
    onRestore: (key: string) => void;
  };
};

export function AzuosArchivedList({ data, ui, state, actions }: AzuosArchivedListProps) {
  return (
    <AzuosCollapsible
      data={{ title: data.title }}
      ui={{ className: ui?.className }}
      actions={{ onOpenChange: actions.onOpenChange }}
    >
      <ArchivedContent data={data} state={state} actions={actions} />
    </AzuosCollapsible>
  );
}

function ArchivedContent({ data, state, actions }: Omit<AzuosArchivedListProps, 'ui'>) {
  if (state.error) {
    return (
      <p role="alert" className="text-sm font-medium text-hue-red">
        {state.error}
      </p>
    );
  }
  if (state.isLoading) return <p className="text-sm text-ink-500">Carregando os removidos…</p>;
  if (data.items.length === 0) return <p className="text-sm text-ink-500">Nada foi removido.</p>;

  return (
    <ul className="divide-y divide-border/60">
      {data.items.map((item) => (
        <li key={item.key} className="flex items-center justify-between gap-3 py-2">
          <span className="min-w-0">
            <span className="block truncate text-sm text-ink-900">
              {item.kind ? <span className="text-ink-500">{item.kind} · </span> : null}
              {item.label}
            </span>
            <span className="block text-xs text-ink-500">
              Removido em {formatDateTime(item.archivedAt)}
            </span>
          </span>
          {item.canRestore ? (
            <AzuosActionButton
              data={{ label: 'Desfazer', loadingLabel: 'Desfazendo…' }}
              ui={{ variant: 'secondary', size: 'sm', icon: ArchiveRestore }}
              state={{
                isLoading: state.restoringKey === item.key,
                isDisabled: state.restoringKey !== null,
              }}
              actions={{ onClick: () => actions.onRestore(item.key) }}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}
