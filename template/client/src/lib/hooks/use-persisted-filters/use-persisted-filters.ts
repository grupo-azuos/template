import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import { mockAuth } from '../../auth/mock-user';
import {
  clearScreenFilters,
  loadScreenFilters,
  saveScreenFilters,
} from '../../utils/filter-storage.util';

export type PersistedFiltersOptions<TFilters> = {
  /** O nome da tela na chave. Estável: renomear faz todo mundo perder o filtro salvo. */
  screen: string;
  /** Os filtros quando não há preferência válida — e para onde "limpar" volta. */
  defaults: TFilters;
  /**
   * Reconhece o que veio do armazenamento (tipo desconhecido) e devolve filtros bem formados,
   * ou `null` quando não serve. É a única porta de entrada do dado salvo na tela.
   */
  parse: (raw: unknown) => TFilters | null;
  /**
   * Ajusta o que foi restaurado ao que a pessoa pode HOJE: um escopo que ela perdeu desde a
   * última visita volta ao permitido, em vez de a tela pedir ao servidor o que ele vai recusar.
   */
  sanitize?: (filters: TFilters) => TFilters;
  /**
   * Filtros explícitos de fora (a URL). Se vierem, ganham do salvo; os campos não informados
   * continuam com o salvo ou o padrão.
   */
  override?: Partial<TFilters>;
  /** O UUID da pessoa logada. Se omitido, lê da sessão do sistema. */
  userId?: string;
};

export type PersistedFilters<TFilters> = {
  filters: TFilters;
  /** Aceita o objeto novo ou uma função do anterior, como o `setState`. Grava na hora. */
  setFilters: (next: TFilters | ((previous: TFilters) => TFilters)) => void;
  /** "Limpar filtros": apaga a preferência salva e volta ao padrão da tela. */
  clearFilters: () => void;
};

/**
 * OS FILTROS DE UMA TELA, que sobrevivem ao F5, ao ir e voltar e ao fechar o navegador.
 *
 * O estado inicial é calculado de forma SÍNCRONA, no primeiro render: a leitura do
 * `localStorage` não tem espera, então a primeira consulta já sai com o recorte salvo. Ordem
 * de prioridade: URL (`override`) > salvo (validado e saneado) > padrão.
 *
 * Quem escreve é o handler, e não um `useEffect`: um efeito gravaria o padrão no primeiro
 * render e, depois do "limpar", gravaria de novo — a preferência nunca estaria ausente.
 */
export function usePersistedFilters<TFilters>(
  options: PersistedFiltersOptions<TFilters>,
): PersistedFilters<TFilters> {
  const userId = options.userId ?? mockAuth.getUser().id;
  const { screen, defaults } = options;

  const [filters, setState] = useState<TFilters>(() => restore(userId, options));
  const current = useRef(filters);

  /* Se a identidade foi resolvida após a montagem inicial, reidrata no próprio render. */
  const [prevUserId, setPrevUserId] = useState(userId);
  if (userId !== prevUserId) {
    setPrevUserId(userId);
    const rehydrated = restore(userId, options);
    setState(rehydrated);
  }

  useLayoutEffect(() => {
    current.current = filters;
  }, [filters]);

  const setFilters = useCallback(
    (next: TFilters | ((previous: TFilters) => TFilters)) => {
      const resolved =
        typeof next === 'function' ? (next as (p: TFilters) => TFilters)(current.current) : next;

      current.current = resolved;
      setState(resolved);
      if (userId) {
        saveScreenFilters(userId, screen, resolved);
      }
    },
    [userId, screen],
  );

  const clearFilters = useCallback(() => {
    current.current = defaults;
    setState(defaults);
    if (userId) {
      clearScreenFilters(userId, screen);
    }
  }, [userId, screen, defaults]);

  return { filters, setFilters, clearFilters };
}

function restore<TFilters>(
  userId: string | undefined,
  options: PersistedFiltersOptions<TFilters>,
): TFilters {
  const saved = userId ? options.parse(loadScreenFilters(userId, options.screen)) : null;
  const base = saved ?? options.defaults;

  const merged = { ...base, ...options.override };

  return options.sanitize?.(merged) ?? merged;
}
