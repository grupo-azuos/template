import { z } from 'zod';
import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  paginatedSchema,
  paginationQuerySchema,
  paginationRange,
  sortDirectionSchema,
} from './pagination.schema';

describe('paginationQuerySchema', () => {
  // feliz
  it('fills the first page with the default size when nothing is sent', () => {
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, pageSize: DEFAULT_PAGE_SIZE });
  });

  it('reads the numbers the URL sends as text', () => {
    expect(paginationQuerySchema.parse({ page: '3', pageSize: '20' })).toEqual({
      page: 3,
      pageSize: 20,
    });
  });

  // triste
  it('refuses a page before the first and a size above the ceiling', () => {
    expect(paginationQuerySchema.safeParse({ page: 0 }).success).toBe(false);
    expect(paginationQuerySchema.safeParse({ pageSize: MAX_PAGE_SIZE + 1 }).success).toBe(false);
  });
});

describe('paginatedSchema', () => {
  // feliz
  it('describes a page of the given item', () => {
    const page = paginatedSchema(z.object({ id: z.number() }));

    expect(page.parse({ items: [{ id: 1 }], total: 1, page: 1, pageSize: 50 })).toEqual({
      items: [{ id: 1 }],
      total: 1,
      page: 1,
      pageSize: 50,
    });
  });

  // triste
  it('refuses a negative total', () => {
    const page = paginatedSchema(z.object({ id: z.number() }));

    expect(page.safeParse({ items: [], total: -1, page: 1, pageSize: 50 }).success).toBe(false);
  });
});

describe('paginationRange', () => {
  // feliz
  it('turns page and size into the first and last row positions', () => {
    expect(paginationRange({ page: 1, pageSize: 50 })).toEqual({ from: 0, to: 49 });
    expect(paginationRange({ page: 3, pageSize: 20 })).toEqual({ from: 40, to: 59 });
  });
});

describe('sortDirectionSchema', () => {
  // triste
  it('accepts only asc and desc', () => {
    expect(sortDirectionSchema.parse('asc')).toBe('asc');
    expect(sortDirectionSchema.safeParse('up').success).toBe(false);
  });
});
