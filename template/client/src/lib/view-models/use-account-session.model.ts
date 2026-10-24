import { useMutation, useQueryClient } from '@tanstack/react-query';

import { leaveAccountSession, signOutAccount } from '../api/account-session.api';

/** Só apaga os dados locais depois de o provedor confirmar que encerrou a sessão. */
export function useAccountSessionModel() {
  const queryClient = useQueryClient();
  const signOut = useMutation({
    mutationFn: signOutAccount,
    onSuccess: async () => {
      await queryClient.cancelQueries();
      queryClient.clear();
      leaveAccountSession();
    },
  });
  return {
    state: {
      isSigningOut: signOut.isPending,
      error: signOut.isError ? 'Não consegui encerrar a sessão. Tente novamente.' : null,
    },
    actions: { onSignOut: () => signOut.mutate() },
  };
}
