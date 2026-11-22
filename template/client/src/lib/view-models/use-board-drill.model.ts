import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { type BoardDrill, drillSummary } from '@template/shared/schemas/board-drill.schema';
import { ME_VALUE, type SavedFilter } from '@template/shared/schemas/dashboard-board.schema';

import { dashboardBoardsApi } from '../api/dashboard-boards.api';
import { type PersonOption, usePeopleModel } from './use-people.model';

/**
 * O RECORTE DO PAINEL NUMA TELA DE DESTINO — o que veio do clique num item do Dashboard
 * (`?drill=`). Zero JSX.
 *
 * Com recorte, a tela abre SÓ com ele: os filtros dela ficam de lado e voltam no "Limpar recorte".
 * A faixa do recorte fica à vista enquanto ele valer.
 *
 * Se o filtro salvo do recorte não existe mais (apagado, arquivado), a tela abre SEM o recorte e
 * avisa — em vez de dar erro.
 */
export type BoardDrillModel = {
  /** O recorte que vale: nulo sem recorte, ou com o filtro salvo dele sumido. */
  drill: BoardDrill | null;
  /** A faixa: o recorte em palavras, ou o aviso de que ele não valeu. Nula sem recorte. */
  banner: { summary: string[]; notice: string | null } | null;
  onClear: () => void;
  /** De volta ao Dashboard. */
  onBack: () => void;
};

export const DRILL_FILTER_GONE =
  'O filtro salvo deste recorte do painel não existe mais: a tela abriu sem o recorte.';

/** `path`: a tela de destino, sem o recorte — para onde o "Limpar recorte" volta. */
export function useBoardDrillModel(drill: BoardDrill | undefined, path: string): BoardDrillModel {
  const navigate = useNavigate();
  const { people } = usePeopleModel();
  const filters = useQuery({
    queryKey: ['dashboard-filters', 'hide'],
    queryFn: () => dashboardBoardsApi.filters('hide'),
    enabled: Boolean(drill?.filterId),
  });
  /* Sem recorte no endereço: a tela volta ao que é dela. */
  const onClear = () => void navigate({ to: path, search: {} } as Parameters<typeof navigate>[0]);
  const onBack = () => void navigate({ to: '/dashboard' });
  if (!drill) return { drill: null, banner: null, onClear, onBack };

  const saved = savedFilterOf(drill, filters.data?.data.filters ?? []);
  /* Só se sabe que sumiu depois de ler a lista; falhar ao ler não é "sumiu". */
  if (drill.filterId && filters.isSuccess && !saved) {
    return { drill: null, banner: { summary: [], notice: DRILL_FILTER_GONE }, onClear, onBack };
  }
  const names = { person: personName(drill.person, people), filter: saved?.name ?? null };

  return { drill, banner: { summary: drillSummary(drill, names), notice: null }, onClear, onBack };
}

/** O filtro salvo do recorte, entre os que a pessoa vê — e da mesma fonte. */
function savedFilterOf(drill: BoardDrill, filters: readonly SavedFilter[]): SavedFilter | undefined {
  if (!drill.filterId) return undefined;

  return filters.find((filter) => filter.id === drill.filterId && filter.source === drill.source);
}

/** O nome da pessoa do recorte: "Eu" para quem vê, o nome do diretório, ou o id que veio. */
function personName(person: string | null, people: readonly PersonOption[]): string | null {
  if (!person) return null;
  if (person === ME_VALUE) return 'Eu';

  return people.find((option) => option.id === person)?.name ?? person;
}
