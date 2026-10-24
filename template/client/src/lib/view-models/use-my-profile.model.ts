import { useQuery } from '@tanstack/react-query';

import {
  type AccountProfile,
  type AccountRole,
  type AccountSystem,
  accountProfileApi,
} from '../api/account-profile.api';
import { accountProfileUrl } from '../api/account-session.api';
import {
  type AzuosMyProfileViewProps,
  type MyProfilePerson,
} from '../components/azuos-my-profile-view/azuos-my-profile-view.component';
import { useTheme } from '../theme/theme';

/**
 * O que a tela "Meu perfil" precisa, IGUAL nos 13 sistemas.
 *
 * A ficha vem do admin-console (a fonte única da conta: foto, cargo, telefone, nascimento, bio
 * e os sistemas que a pessoa abre). O sistema só entrega o que SÓ ele sabe — o papel da pessoa
 * aqui — e uma ficha mínima de reserva para quando o admin-console não responde (o
 * desenvolvimento local, sem sessão no domínio).
 */
export type MyProfileSource = {
  person: MyProfilePerson | null;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
};

export type MyProfileModel = {
  data: AzuosMyProfileViewProps['data'];
  state: { isLoading: boolean; error: string | null };
  actions: { onToggleTheme: () => void; onRetry: () => void };
};

export const ACCOUNT_ROLE_LABELS: Record<AccountRole, string> = {
  admin: 'Administrador',
  manager: 'Gestor',
  user: 'Usuário',
};

export function useMyProfileModel(source: MyProfileSource): MyProfileModel {
  const { theme, actions } = useTheme();
  const account = useQuery({
    queryKey: ['account', 'me', 'profile'],
    queryFn: accountProfileApi.me,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
  const systems = useQuery({
    queryKey: ['account', 'me', 'systems'],
    queryFn: accountProfileApi.systems,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const person = mergePerson(source.person, account.data, systems.data);
  const isWaiting = person === null && (source.isLoading || account.isPending);

  return {
    data: { person, accountUrl: accountProfileUrl(), theme },
    state: {
      isLoading: isWaiting,
      error: person === null ? (source.error ?? readError(account.error)) : null,
    },
    actions: {
      onToggleTheme: actions.onToggle,
      onRetry: () => {
        source.onRetry?.();
        void account.refetch();
        void systems.refetch();
      },
    },
  };
}

/** A conta manda nos dados da pessoa; o papel é sempre o DESTE sistema, quando ele sabe. */
export function mergePerson(
  local: MyProfilePerson | null,
  account: AccountProfile | undefined,
  systems: AccountSystem[] | undefined,
): MyProfilePerson | null {
  if (!account) return local ? { ...local, systems: systems ? toSystems(systems) : undefined } : null;

  return {
    name: account.name,
    email: account.email,
    roleLabel: local?.roleLabel || ACCOUNT_ROLE_LABELS[account.role],
    avatarUrl: account.profile.avatarUrl,
    jobTitle: account.profile.jobTitle,
    department: account.profile.department,
    phone: account.profile.phone,
    birthDateLabel: toBirthDateLabel(account.profile.birthDate),
    bio: account.profile.bio,
    systems: systems ? toSystems(systems) : undefined,
  };
}

function toSystems(systems: AccountSystem[]) {
  return systems.map((system) => ({
    name: system.name,
    url: system.presentation.url,
    roleLabel: ACCOUNT_ROLE_LABELS[system.access.role],
  }));
}

/** "1990-03-25" → "25/03/1990". Sem fuso: data de nascimento é dia, não instante. */
export function toBirthDateLabel(value: string | null): string | null {
  const match = value ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;

  return match ? `${match[3]}/${match[2]}/${match[1]}` : null;
}

function readError(error: unknown): string | null {
  return error ? 'Não consegui carregar seu perfil. Tente novamente.' : null;
}
