import { LayoutGrid, Table } from 'lucide-react';

import { useTableView } from '../../hooks/use-table-view/use-table-view';
import { AzuosActionButton } from '../azuos-action-button/azuos-action-button.component';

/**
 * Tabela ou cartões — ao lado de cada lista que tem os dois formatos. Cuida da própria preferência
 * (`lib/hooks/use-table-view`), do mesmo jeito que o `AzuosThemeToggle` cuida do próprio tema: a
 * tela não guarda estado nenhum, só coloca o controle.
 *
 * São DOIS botões lado a lado, e não um ícone que troca: com um ícone só, a pessoa via o formato
 * para onde IRIA, apagado no canto, e não o formato em que ESTAVA. Aqui os dois aparecem sempre,
 * dentro de uma moldura, e o que está valendo fica preenchido com a cor principal — dá para ler o
 * estado sem clicar.
 *
 * Some abaixo de `xl`: no celular e no tablet a lista é sempre em cartões, então não há o que
 * escolher — e um "Tabela" marcado ali seria mentira.
 */
export function AzuosTableViewToggle() {
  const tableView = useTableView();

  /* Clicar no formato que já está valendo não faz nada: sem esta guarda, a troca inverteria a
     preferência e o botão marcado apagaria sozinho. */
  const choose = (wantsCards: boolean) => {
    if (tableView.forceCards === wantsCards) return;

    tableView.actions.onToggle();
  };

  return (
    <div
      role="group"
      aria-label="Formato da lista"
      className="border-border bg-card rounded-control hidden items-center gap-0.5 border p-0.5 shadow-xs xl:inline-flex"
    >
      <AzuosActionButton
        data={{ label: 'Ver em tabela' }}
        ui={{
          variant: tableView.forceCards ? 'ghost' : 'primary',
          size: 'sm',
          icon: Table,
          isIconOnly: true,
          /* Filho de uma moldura `rounded-control`: o raio de dentro é menor que o de fora. */
          className: 'rounded-box shadow-none',
        }}
        state={{ isPressed: !tableView.forceCards }}
        actions={{ onClick: () => choose(false) }}
      />
      <AzuosActionButton
        data={{ label: 'Ver em cartões' }}
        ui={{
          variant: tableView.forceCards ? 'primary' : 'ghost',
          size: 'sm',
          icon: LayoutGrid,
          isIconOnly: true,
          className: 'rounded-box shadow-none',
        }}
        state={{ isPressed: tableView.forceCards }}
        actions={{ onClick: () => choose(true) }}
      />
    </div>
  );
}
