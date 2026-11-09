import { useEffect, useState } from 'react';

/**
 * O valor, só depois que ele parou de mudar por `delayMs`.
 *
 * Existe para a busca por tecla: sem ele, digitar "Aparecida" disparava nove consultas, e a
 * resposta da quarta podia chegar depois da nona e trocar a lista por uma velha.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
