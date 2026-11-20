import { z } from 'zod';

/**
 * O ENVELOPE DE TODA RESPOSTA — `data`, `meta` e `links`, nesta ordem. É a mesma forma da
 * API do admin-console, para quem consome as duas não precisar lembrar de duas.
 *
 * - **`data`** traz o recurso com NOME: `data.company`, `data.permits`. Um `items` solto
 *   obriga quem lê o JSON a lembrar de qual rota ele veio para saber o que está olhando.
 * - **`meta`** descreve a resposta, e não o recurso: paginação e os filtros que o servidor de
 *   fato aplicou, já normalizados.
 * - **`links`** fica no fim, como rodapé: para onde ir a partir daqui. Link de ação só aparece
 *   quando quem pediu PODE executá-la, e é decidido pela mesma `lib/policy` que o servidor
 *   usa para recusar. A recusa continua no service de qualquer jeito — um link a menos nunca
 *   é a proteção.
 *
 * Dentro do recurso, os campos se agrupam por CONTEXTO: o núcleo que identifica o registro
 * fica na raiz, e o resto vai em blocos com nome (`identification`, `schedule`, `audit`).
 * Data gerada pelo sistema e autoria vão sempre em `audit` — ninguém edita, e por isso não se
 * misturam com o que a pessoa preenche.
 *
 * Link é URL ABSOLUTA, com a origem de `API_PUBLIC_URL`: é o que o admin-console faz, e um
 * link relativo seria resolvido contra o host de quem lê.
 *
 * Isto vale para as RESPOSTAS. O corpo das requisições continua plano — é o formulário que o
 * monta, campo a campo, e o erro de validação aponta para esse campo.
 */
export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

export type HttpMethod = (typeof HTTP_METHODS)[number];

export const linkSchema = z.object({
  href: z.url(),
  method: z.enum(HTTP_METHODS),
});

export type Link = z.infer<typeof linkSchema>;

export const linksSchema = z.record(z.string(), linkSchema);

export type Links = z.infer<typeof linksSchema>;

export const paginationMetaSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  totalItems: z.number().int().min(0),
  /** `0` quando não há nada: não existe "página 1 de 1" de uma lista vazia. */
  totalPages: z.number().int().min(0),
});

export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

/** Um item de lista com os próprios links — `self` e o que der para fazer com ele. */
export function withLinks<TShape extends z.ZodRawShape>(item: z.ZodObject<TShape>) {
  return item.extend({ links: linksSchema });
}

/** Um recurso só: `{ data: { <key>: … }, links }`. */
export function resourceSchema<TKey extends string, TItem extends z.ZodTypeAny>(
  key: TKey,
  item: TItem,
) {
  return z.object({
    data: z.object({ [key]: item } as { [K in TKey]: TItem }),
    links: linksSchema,
  });
}

/** Lista paginada: `{ data: { <key>: [] }, meta: { pagination, query }, links }`. */
export function pageSchema<
  TKey extends string,
  TItem extends z.ZodTypeAny,
  TQuery extends z.ZodObject,
>(key: TKey, item: TItem, query: TQuery) {
  return z.object({
    data: z.object({ [key]: z.array(item) } as { [K in TKey]: z.ZodArray<TItem> }),
    meta: z.object({ pagination: paginationMetaSchema, query }),
    links: linksSchema,
  });
}

/**
 * Lista curta, sem paginação — os anexos de um alvará. `totalItems` vem mesmo assim: quem lê a
 * resposta não precisa contar o array para saber se está vazia.
 */
export function listSchema<TKey extends string, TItem extends z.ZodTypeAny>(
  key: TKey,
  item: TItem,
) {
  return z.object({
    data: z.object({ [key]: z.array(item) } as { [K in TKey]: z.ZodArray<TItem> }),
    meta: z.object({ totalItems: z.number().int().min(0) }),
    links: linksSchema,
  });
}

/** Lista curta que responde a um filtro — a busca de cidades. O filtro aplicado volta em `meta.query`. */
export function queriedListSchema<
  TKey extends string,
  TItem extends z.ZodTypeAny,
  TQuery extends z.ZodObject,
>(key: TKey, item: TItem, query: TQuery) {
  return z.object({
    data: z.object({ [key]: z.array(item) } as { [K in TKey]: z.ZodArray<TItem> }),
    meta: z.object({ totalItems: z.number().int().min(0), query }),
    links: linksSchema,
  });
}

/**
 * Um relatório: um objeto calculado a partir de um recorte — o painel, os contadores do topo,
 * a premiação do mês. Não é recurso com id, mas o recorte que o gerou importa tanto quanto os
 * números, e por isso volta em `meta.query`.
 */
export function reportSchema<
  TKey extends string,
  TItem extends z.ZodTypeAny,
  TQuery extends z.ZodObject,
>(key: TKey, item: TItem, query: TQuery) {
  return z.object({
    data: z.object({ [key]: item } as { [K in TKey]: TItem }),
    meta: z.object({ query }),
    links: linksSchema,
  });
}

export function toPaginationMeta(page: {
  page: number;
  pageSize: number;
  total: number;
}): PaginationMeta {
  return {
    page: page.page,
    pageSize: page.pageSize,
    totalItems: page.total,
    totalPages: Math.ceil(page.total / page.pageSize),
  };
}
