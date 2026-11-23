import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { setPeopleDirectory } from '../../utils/people-directory.util';
import { usePersonPhoto } from './use-person-photo';

afterEach(() => setPeopleDirectory([]));

describe('usePersonPhoto', () => {
  // feliz
  it('swaps to the photo as soon as the directory arrives', () => {
    const { result } = renderHook(() => usePersonPhoto({ name: 'Wellington Queiroz' }));
    expect(result.current).toBeNull();

    act(() =>
      setPeopleDirectory([
        { id: 'wq', name: 'Wellington Queiroz', avatarUrl: 'https://cdn/wq.png' },
      ]),
    );

    expect(result.current).toBe('https://cdn/wq.png');
  });

  // triste
  it('stays without a photo for someone outside the directory', () => {
    setPeopleDirectory([{ id: 'wq', name: 'Wellington Queiroz', avatarUrl: 'https://cdn/wq.png' }]);

    const { result } = renderHook(() => usePersonPhoto({ id: 'x', name: 'Outra Pessoa' }));

    expect(result.current).toBeNull();
  });
});
