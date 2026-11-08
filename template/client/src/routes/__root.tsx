import { createRootRoute, Outlet } from '@tanstack/react-router';

import { AzuosAppShell } from '../lib/components/azuos-app-shell/azuos-app-shell.component';
import { AzuosEmptyState } from '../lib/components/azuos-empty-state/azuos-empty-state.component';
import { AzuosNotificationBell } from '../lib/components/azuos-notification-bell/azuos-notification-bell.component';
import { AzuosNotificationDialog } from '../lib/components/azuos-notification-dialog/azuos-notification-dialog.component';
import { AzuosToaster } from '../lib/components/azuos-toaster/azuos-toaster.component';
import { useAppShellModel } from '../lib/view-models/use-app-shell.model';
import { useNotificationCenterModel } from '../lib/view-models/use-notification-center.model';

/**
 * A rota raiz só compõe. Nenhuma regra de negócio, nenhum `useQuery` solto — a seção 3 do
 * CONTRIBUTING vale aqui como em qualquer outra rota.
 */
export const Route = createRootRoute({
  component: RootRoute,
  notFoundComponent: RouteNotFound,
});

function RootRoute() {
  const { data, state, actions } = useAppShellModel();
  const notifications = useNotificationCenterModel();

  /* O sininho mora na casca, logo acima do perfil; o diálogo de entrada e o toast do tempo real
     ficam por cima de qualquer tela. */
  return (
    <AzuosAppShell
      data={data}
      ui={{
        notifications: (placement) => (
          <AzuosNotificationBell
            data={notifications.data}
            ui={{ placement }}
            state={notifications.state}
            actions={notifications.actions}
          />
        ),
      }}
      state={state}
      actions={actions}
    >
      <Outlet />
      <AzuosNotificationDialog
        data={{ items: notifications.data.dialogItems }}
        state={{ isOpen: notifications.state.isDialogOpen }}
        actions={{
          onOpen: notifications.actions.onOpen,
          onMarkRead: notifications.actions.onMarkRead,
          onClose: notifications.actions.onCloseDialog,
        }}
      />
      <AzuosToaster ui={{ position: 'top-right' }} />
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
