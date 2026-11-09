import { describe, expect, it } from 'vitest';

import { archivedFilterSchema, archiveSchema } from './archive.schema';

describe('archivedFilterSchema', () => {
  // feliz
  it('hides archived ones when nothing is asked', () => {
    expect(archivedFilterSchema.parse(undefined)).toBe('hide');
    expect(archivedFilterSchema.parse('only')).toBe('only');
  });

  // triste
  it('rejects an unknown filter', () => {
    expect(archivedFilterSchema.safeParse('all').success).toBe(false);
  });
});

describe('archiveSchema', () => {
  // feliz
  it('accepts records in use and archived ones', () => {
    expect(archiveSchema.parse(null)).toBeNull();
    expect(
      archiveSchema.parse({ archivedAt: '2026-11-07T12:00:00.000Z', archivedBy: null }),
    ).toEqual({ archivedAt: '2026-11-07T12:00:00.000Z', archivedBy: null });
  });

  // triste
  it('rejects an archived record without date', () => {
    expect(archiveSchema.safeParse({ archivedBy: null }).success).toBe(false);
  });
});
