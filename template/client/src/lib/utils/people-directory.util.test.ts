import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  normalizePersonName,
  personPhotoOf,
  setPeopleDirectory,
  subscribePeopleDirectory,
} from './people-directory.util';

afterEach(() => setPeopleDirectory([]));

describe('people directory', () => {
  // feliz
  it('finds the photo by id, and by the name when the record kept only the name', () => {
    setPeopleDirectory([{ id: 'wq', name: 'Wellington Queiroz', avatarUrl: 'https://cdn/wq.png' }]);

    expect(personPhotoOf({ id: 'wq' })).toBe('https://cdn/wq.png');
    expect(personPhotoOf({ name: '  wellington   QUEIROZ ' })).toBe('https://cdn/wq.png');
  });

  // feliz
  it('tells whoever listens when the directory changes, until they leave', () => {
    const listener = vi.fn();
    const leave = subscribePeopleDirectory(listener);

    setPeopleDirectory([]);
    leave();
    setPeopleDirectory([]);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  // triste
  it('gives no photo for someone unknown or without a photo', () => {
    setPeopleDirectory([{ id: 'ana', name: 'Ana', avatarUrl: null }]);

    expect(personPhotoOf({ id: 'ana', name: 'Ana' })).toBeNull();
    expect(personPhotoOf({ id: 'x', name: 'Ninguém' })).toBeNull();
    expect(personPhotoOf({})).toBeNull();
    expect(normalizePersonName('Ângela  Souza')).toBe('angela souza');
  });
});
