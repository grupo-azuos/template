import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { listSchema, pageSchema, resourceSchema, toPaginationMeta } from './envelope.schema';

describe('toPaginationMeta', () => {
  it('counts the pages from the total and the page size', () => {
    expect(toPaginationMeta({ page: 2, pageSize: 20, total: 57 })).toEqual({
      page: 2,
      pageSize: 20,
      totalItems: 57,
      totalPages: 3,
    });
  });

  it('does not round a full last page up to an empty one', () => {
    expect(toPaginationMeta({ page: 1, pageSize: 20, total: 40 }).totalPages).toBe(2);
  });

  /* "Página 1 de 1" numa lista vazia prometeria uma página que não existe. */
  it('says there are no pages when there is nothing', () => {
    expect(toPaginationMeta({ page: 1, pageSize: 20, total: 0 }).totalPages).toBe(0);
  });
});

describe('resourceSchema', () => {
  const schema = resourceSchema('company', z.object({ id: z.number() }));

  it('names the resource inside data and keeps the links', () => {
    const body = {
      data: { company: { id: 1 } },
      links: { self: { href: 'http://localhost:3333/api/v1/companies/1', method: 'GET' } },
    };

    expect(schema.parse(body)).toEqual(body);
  });

  it('refuses a relative link, which would be resolved against the reader host', () => {
    const result = schema.safeParse({
      data: { company: { id: 1 } },
      links: { self: { href: '/api/v1/companies/1', method: 'GET' } },
    });

    expect(result.success).toBe(false);
  });

  it('refuses a resource that came without its name', () => {
    expect(schema.safeParse({ data: { id: 1 }, links: {} }).success).toBe(false);
  });
});

describe('pageSchema', () => {
  const schema = pageSchema(
    'companies',
    z.object({ id: z.number() }),
    z.object({ search: z.string().nullable() }),
  );

  it('reads the list, the pagination and the applied filters', () => {
    const body = {
      data: { companies: [{ id: 1 }] },
      meta: {
        pagination: { page: 1, pageSize: 50, totalItems: 1, totalPages: 1 },
        query: { search: null },
      },
      links: {},
    };

    expect(schema.parse(body)).toEqual(body);
  });

  it('refuses the old flat page', () => {
    expect(schema.safeParse({ items: [], total: 0, page: 1, pageSize: 50 }).success).toBe(false);
  });
});

describe('listSchema', () => {
  it('counts the items without paginating', () => {
    const schema = listSchema('cities', z.object({ id: z.number() }));
    const body = { data: { cities: [] }, meta: { totalItems: 0 }, links: {} };

    expect(schema.parse(body)).toEqual(body);
  });
});
