import 'reflect-metadata';

import { describe, expect, it } from 'vitest';

import { IS_PUBLIC, Public } from './public.decorator';
import { REQUIRED_ROLES, Roles } from './roles.decorator';

describe('@Roles and @Public', () => {
  // feliz
  it('records the required roles for the guard to read', () => {
    class Probe {}
    Roles('admin', 'manager')(Probe);

    expect(Reflect.getMetadata(REQUIRED_ROLES, Probe)).toEqual(['admin', 'manager']);
  });

  it('marks a route as public', () => {
    class Probe {}
    Public()(Probe);

    expect(Reflect.getMetadata(IS_PUBLIC, Probe)).toBe(true);
  });

  // triste
  it('leaves an undecorated class without any requirement', () => {
    class Probe {}

    expect(Reflect.getMetadata(REQUIRED_ROLES, Probe)).toBeUndefined();
    expect(Reflect.getMetadata(IS_PUBLIC, Probe)).toBeUndefined();
  });
});
