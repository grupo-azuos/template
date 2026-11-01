import { describe, expect, it } from 'vitest';

import { ENV } from './env.token';

describe('ENV token', () => {
  // feliz
  it('is a stable, named key for the injector', () => {
    expect(ENV).toBe('TEMPLATE_ENV');
  });
});
