import { createFileRoute } from '@tanstack/react-router';
import { drillSearchSchema } from '@template/shared/schemas/board-drill.schema';

import { AzuosHistoryView } from './components/azuos-history-view/azuos-history-view.component';
import { AzuosBoardDrillBanner } from '../../lib/components/azuos-board-drill-banner/azuos-board-drill-banner.component';
import { useHistoryModel } from '../../lib/view-models/use-history.model';

export const Route = createFileRoute('/history/')({
  /* O recorte de um clique num bloco de Movimento do painel. Valor torto vira "sem recorte". */
  validateSearch: drillSearchSchema,
  component: HistoryRoute,
});

/** A rota só compõe: o estado vem do view-model, o desenho vem da tela. */
function HistoryRoute() {
  const { data, state, actions } = useHistoryModel(Route.useSearch());

  return (
    <>
      {data.drillBanner ? (
        <AzuosBoardDrillBanner
          data={data.drillBanner}
          actions={{ onClear: actions.onClearDrill, onBack: actions.onBackToBoard }}
        />
      ) : null}
      <AzuosHistoryView data={data} state={state} actions={actions} />
    </>
  );
}
