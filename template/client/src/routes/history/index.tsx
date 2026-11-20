import { createFileRoute } from '@tanstack/react-router';

import { AzuosHistoryView } from './components/azuos-history-view/azuos-history-view.component';
import { useHistoryModel } from '../../lib/view-models/use-history.model';

export const Route = createFileRoute('/history/')({
  component: HistoryRoute,
});

/** A rota só compõe: o estado vem do view-model, o desenho vem da tela. */
function HistoryRoute() {
  const { data, state, actions } = useHistoryModel();

  return <AzuosHistoryView data={data} state={state} actions={actions} />;
}
