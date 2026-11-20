import {
  type FilterGroup,
  type FilterRule,
  isFilterGroup,
  ME_VALUE,
} from '@template/shared/schemas/dashboard-board.schema';

/** Uma pessoa como cada fonte pode guardá-la: pelo id, pelo e-mail ou pelo nome. */
export type PersonKeys = { id: string; email: string; name: string };

/** Os campos de pessoa de uma fonte, e o que cada um guarda dela. */
export type PersonFields = Record<string, keyof PersonKeys>;

/**
 * O "EU" DO FILTRO VIRA QUEM ESTÁ VENDO, e a pessoa escolhida vira o que a fonte guarda —
 * antes de a árvore chegar ao SQL. Só nos campos de pessoa: num campo de texto qualquer, "@me"
 * continua sendo texto.
 *
 * O filtro salvo guarda o ID da pessoa (regra `select-standard`). A fonte que guarda e-mail ou
 * nome recebe o de hoje daquele id; o id que não está no diretório segue como veio.
 */
export function bindViewer(
  group: FilterGroup,
  fields: PersonFields,
  viewer: PersonKeys,
  peopleById: ReadonlyMap<string, PersonKeys> = new Map(),
): FilterGroup {
  return {
    ...group,
    rules: group.rules.map((node) =>
      isFilterGroup(node)
        ? bindViewer(node, fields, viewer, peopleById)
        : bindRule(node, fields, viewer, peopleById),
    ),
  };
}

function bindRule(
  rule: FilterRule,
  fields: PersonFields,
  viewer: PersonKeys,
  peopleById: ReadonlyMap<string, PersonKeys>,
): FilterRule {
  const kind = fields[rule.field];
  if (!kind) return rule;
  const swap = (value: string | number) => {
    if (value === ME_VALUE) return viewer[kind];
    if (typeof value !== 'string') return value;

    return peopleById.get(value)?.[kind] ?? value;
  };
  if (Array.isArray(rule.value)) return { ...rule, value: rule.value.map(swap) };
  if (typeof rule.value === 'string') return { ...rule, value: swap(rule.value) };

  return rule;
}
