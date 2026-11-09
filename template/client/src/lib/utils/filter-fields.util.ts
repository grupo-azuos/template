/**
 * LEITORES DE CAMPO para o filtro salvo — o `parse` de cada tela, sem repetir a mesma checagem.
 *
 * O salvo vem de fora do programa (o `localStorage` é editável e sobrevive a versões), então
 * cada campo é conferido sozinho: um campo ruim volta ao padrão e os outros continuam valendo.
 * Jogar tudo fora por causa de um campo faria a pessoa perder o recorte inteiro numa troca
 * pequena, como um status que deixou de existir.
 */

export type FieldGuards<TFilters> = {
  [K in keyof TFilters]: (value: unknown) => value is TFilters[K];
};

export const isText = (value: unknown): value is string => typeof value === 'string';

export const isFlag = (value: unknown): value is boolean => typeof value === 'boolean';

export function oneOf<const TValue extends string>(
  ...allowed: readonly TValue[]
): (value: unknown) => value is TValue {
  return (value): value is TValue =>
    typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

/** Guarda apoiada num schema zod do contrato — o enum vive em `@template/shared`, uma vez só. */
export function matches<TValue>(schema: {
  safeParse: (value: unknown) => { success: boolean };
}): (value: unknown) => value is TValue {
  return (value): value is TValue => schema.safeParse(value).success;
}

/**
 * Monta o `parse` do `usePersistedFilters`: objeto → campo a campo; qualquer outra coisa →
 * `null` (ausente). Campo faltando ou inválido assume o valor do padrão.
 */
export function fieldParser<TFilters extends object>(
  defaults: TFilters,
  guards: FieldGuards<TFilters>,
): (raw: unknown) => TFilters | null {
  return (raw) => {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;

    const source = raw as Record<string, unknown>;
    const result = { ...defaults };

    for (const key of Object.keys(guards) as (keyof TFilters)[]) {
      const guard = guards[key];
      const value = source[key as string];

      if (guard(value)) result[key] = value;
    }

    return result;
  };
}

/**
 * O mesmo, para o salvo em SEÇÕES (ex.: `{ filter, sort }`): cada seção tem o seu leitor, e uma
 * seção inválida volta ao padrão sem levar as outras junto.
 */
export function sectionParser<TPrefs extends object>(
  defaults: TPrefs,
  parsers: { [K in keyof TPrefs]: (raw: unknown) => TPrefs[K] | null },
): (raw: unknown) => TPrefs | null {
  return (raw) => {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;

    const source = raw as Record<string, unknown>;
    const result = { ...defaults };

    for (const key of Object.keys(parsers) as (keyof TPrefs)[]) {
      const value = parsers[key](source[key as string]);

      if (value !== null) result[key] = value;
    }

    return result;
  };
}

/** Faz de uma guarda um leitor de seção: o valor serve ou é `null`. */
export function readIf<TValue>(guard: (value: unknown) => value is TValue) {
  return (raw: unknown): TValue | null => (guard(raw) ? raw : null);
}
