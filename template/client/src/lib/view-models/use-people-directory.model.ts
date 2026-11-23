import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { usersApi } from '../api/users.api';
import { setPeopleDirectory } from '../utils/people-directory.util';

/**
 * Carrega o diretório de pessoas (com a foto) para o rosto de qualquer tela achar a foto — regra
 * do grupo: pessoa sempre com a foto. Montado UMA vez, na casca. Mesma chave do `usePeopleModel`:
 * nenhuma ida a mais ao servidor. Falhar só deixa as iniciais — nunca quebra a tela.
 */
export function usePeopleDirectoryModel(): void {
  const directory = useQuery({
    queryKey: ['users', 'directory'],
    queryFn: usersApi.list,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  /* A lista da consulta só troca quando chega outra resposta: o efeito não roda a cada desenho. */
  useEffect(() => {
    if (!directory.data) return;
    setPeopleDirectory(
      directory.data.people.map((person) => ({
        id: person.id,
        name: person.name || person.email,
        avatarUrl: person.avatarUrl,
      })),
    );
  }, [directory.data]);
}
