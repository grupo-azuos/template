import { useQuery } from '@tanstack/react-query';

import { usersApi } from '../api/users.api';

export type PersonOption = { id: string; name: string; photo: string | null };

export type PeopleModel = {
  /** Quem pode ser escolhido, com o id e a foto. O campo de pessoa GUARDA O ID. */
  people: PersonOption[];
  /** A integração com o admin-console ainda não foi ligada pelo suporte: só a pessoa logada. */
  isConnected: boolean;
  /** A leitura falhou. Quem monta um seletor precisa saber que a lista está curta por erro. */
  isUnavailable: boolean;
};

/**
 * AS PESSOAS QUE PODEM SER ESCOLHIDAS NESTE SISTEMA — a fonte de TODO campo de pessoa
 * (`AzuosPersonPickerField` e `AzuosPersonMultiPickerField`).
 *
 * A chave da consulta é uma só para a aplicação inteira: a lista é a mesma em toda tela, e o
 * TanStack Query a busca uma vez e entrega a todas.
 */
export function usePeopleModel(): PeopleModel {
  const people = useQuery({
    queryKey: ['users', 'directory'],
    queryFn: usersApi.list,
    retry: false,
    /* Muda quando alguém entra ou sai da empresa — não a cada troca de tela. */
    staleTime: 5 * 60 * 1000,
  });

  return {
    people: (people.data?.people ?? [])
      .filter((person) => person.name || person.email)
      .map((person) => ({
        id: person.id,
        name: person.name || person.email,
        photo: person.avatarUrl,
      })),
    isConnected: people.data?.isConnected ?? false,
    isUnavailable: people.isError,
  };
}
