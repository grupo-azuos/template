import { accountOrigin } from './account-session.api';

/**
 * A FICHA DE QUEM ESTÁ NA SESSÃO, lida direto do admin-console — a fonte única da conta.
 *
 * O navegador chama com a sessão que a pessoa já tem (`credentials: 'include'`); o admin-console
 * aceita LEITURA destas duas rotas vindas de qualquer sistema do grupo, e só leitura. Editar
 * continua sendo no próprio admin-console.
 */
export type AccountRole = 'admin' | 'manager' | 'user';

export type AccountProfile = {
  name: string;
  email: string;
  role: AccountRole;
  profile: {
    avatarUrl: string | null;
    jobTitle: string | null;
    department: string | null;
    phone: string | null;
    birthDate: string | null;
    bio: string | null;
  };
};

export type AccountSystem = {
  name: string;
  presentation: { url: string };
  access: { role: AccountRole };
};

async function readAccount<T>(path: string): Promise<T> {
  const response = await fetch(new URL(path, accountOrigin()), {
    credentials: 'include',
    headers: { accept: 'application/json' },
    redirect: 'error',
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error('Não consegui ler sua conta no admin-console.');

  return (await response.json()) as T;
}

export const accountProfileApi = {
  me: async (): Promise<AccountProfile> =>
    (await readAccount<{ data: { user: AccountProfile } }>('/api/me/profile')).data.user,
  systems: async (): Promise<AccountSystem[]> =>
    (await readAccount<{ data: { systems: AccountSystem[] } }>('/api/me/systems')).data.systems,
};
