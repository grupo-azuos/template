import { createRootRoute, Outlet } from '@tanstack/react-router';

import { AzuosAppShell } from '../lib/components/azuos-app-shell/azuos-app-shell.component';
import { AzuosEmptyState } from '../lib/components/azuos-empty-state/azuos-empty-state.component';
import { useAppShellModel } from '../lib/view-models/use-app-shell.model';

/**
 * A rota raiz só compõe. Nenhuma regra de negócio, nenhum `useQuery` solto — a seção 3 do
 * CONTRIBUTING vale aqui como em qualquer outra rota.
 */
export const Route = createRootRoute({
  component: RootRoute,
  notFoundComponent: RouteNotFound,
});

function RootRoute() {
  const { data, state } = useAppShellModel();

  return (
    <AzuosAppShell data={data} state={state}>
      <Outlet />
    </AzuosAppShell>
  );
}

function RouteNotFound() {
  return (
    <div className="mx-auto w-full max-w-lg px-6 py-16">
      <AzuosEmptyState
        data={{
          title: 'Esta tela não existe',
          description: 'O endereço pode estar errado, ou a tela ainda não foi construída.',
        }}
      />
    </div>
  );
}
