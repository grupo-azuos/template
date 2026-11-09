import { LayoutGrid, Table } from 'lucide-react';

import { useTableView } from '../../hooks/use-table-view/use-table-view';
import { useSlidingIndicator } from '../../motion/use-sliding-indicator';
import { cn } from '../../utils/cn.util';
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
/** O escolhido: o fundo é o destaque que desliza; aqui só o texto claro sobre ele. */
const ACTIVE = 'text-primary-foreground hover:bg-transparent hover:text-primary-foreground';

export function AzuosTableViewToggle() {
  const tableView = useTableView();

  /* Clicar no formato que já está valendo não faz nada: sem esta guarda, a troca inverteria a
     preferência e o botão marcado apagaria sozinho. */
  const choose = (wantsCards: boolean) => {
    if (tableView.forceCards === wantsCards) return;

    tableView.actions.onToggle();
  };

  /* O preenchimento do formato escolhido desliza até o outro na troca. */
  const ref = useSlidingIndicator<HTMLDivElement>({
    selector: '[aria-pressed="true"]',
    indicatorClass: 'rounded-box bg-primary',
    attributes: ['aria-pressed'],
  });

  return (
    <div
      ref={ref}
      role="group"
      aria-label="Formato da lista"
      className="hidden items-center gap-0.5 rounded-control border border-border bg-card p-0.5 shadow-xs xl:inline-flex"
    >
      <AzuosActionButton
        data={{ label: 'Ver em tabela' }}
        ui={{
          variant: 'ghost',
          size: 'sm',
          icon: Table,
          isIconOnly: true,
          /* Filho de uma moldura `rounded-control`: o raio de dentro é menor que o de fora. */
          className: cn('rounded-box shadow-none', !tableView.forceCards && ACTIVE),
        }}
        state={{ isPressed: !tableView.forceCards }}
        actions={{ onClick: () => choose(false) }}
      />
      <AzuosActionButton
        data={{ label: 'Ver em cartões' }}
        ui={{
          variant: 'ghost',
          size: 'sm',
          icon: LayoutGrid,
          isIconOnly: true,
          className: cn('rounded-box shadow-none', tableView.forceCards && ACTIVE),
        }}
        state={{ isPressed: tableView.forceCards }}
        actions={{ onClick: () => choose(true) }}
      />
    </div>
  );
}
