import { type HistoryChange } from '@template/shared/schemas/history.schema';

/**
 * Compara o antes e o depois, campo por campo.
 *
 * Só entra no histórico o que MUDOU. Gravar o registro inteiro em cada edição faria a
 * tela mostrar 20 campos idênticos e um diferente, e a pessoa teria que achar qual — o
 * que é o mesmo que não ter histórico.
 */
export function diffFields<T extends Record<string, unknown>>(
  before: T,
  after: Partial<T>,
  labels: Partial<Record<keyof T, string>> = {},
): HistoryChange[] {
  const changes: HistoryChange[] = [];

  for (const key of Object.keys(after) as (keyof T)[]) {
    const from = normalize(before[key]);
    const to = normalize(after[key]);
    if (from === to) continue;

    changes.push({ field: String(labels[key] ?? key), from, to });
  }

  return changes;
}

/** Nulo, `undefined` e string vazia são a mesma coisa para quem lê: "estava em branco". */
function normalize(value: unknown): string | null {
  if (value == null) return null;
  if (Array.isArray(value)) return value.length ? value.join(', ') : null;
  const text = String(value).trim();

  return text === '' ? null : text;
}
