import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { setPeopleDirectory } from '../../utils/people-directory.util';
import { AzuosPersonAvatar } from './azuos-person-avatar.component';

/**
 * O `Avatar` do Radix decide se a imagem carregou lendo `image.complete` /
 * `image.naturalWidth` logo depois de atribuir `image.src` — num `new Image()` próprio, fora
 * da árvore do DOM. Sem este stub, o jsdom nunca marca a imagem como completa e a foto fica
 * presa nas iniciais para sempre, mesmo com `avatarUrl` preenchido.
 */
class InstantLoadImage {
  complete = false;
  naturalWidth = 0;

  addEventListener() {}
  removeEventListener() {}

  set src(_value: string) {
    this.complete = true;
    this.naturalWidth = 1;
  }
}

describe('AzuosPersonAvatar', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setPeopleDirectory([]);
  });

  // feliz
  /* Regra do grupo: o registro que só guardou o nome ("Wellington Queiroz") mostra a foto. */
  it('finds the photo in the people directory by the name when no photo is given', async () => {
    vi.stubGlobal('Image', InstantLoadImage);
    setPeopleDirectory([
      { id: 'wq', name: 'Wellington Queiroz', avatarUrl: 'https://example.com/wq.jpg' },
    ]);

    const { container } = render(<AzuosPersonAvatar name="wellington queiroz" />);

    const image = await vi.waitUntil(() => container.querySelector('[data-slot="avatar-image"]'));
    expect(image).toHaveAttribute('src', 'https://example.com/wq.jpg');
  });

  // feliz
  it('finds the photo by the person id', async () => {
    vi.stubGlobal('Image', InstantLoadImage);
    setPeopleDirectory([
      { id: 'wq', name: 'Wellington Queiroz', avatarUrl: 'https://example.com/wq.jpg' },
    ]);

    const { container } = render(<AzuosPersonAvatar name="W. Queiroz" personId="wq" />);

    const image = await vi.waitUntil(() => container.querySelector('[data-slot="avatar-image"]'));
    expect(image).toHaveAttribute('src', 'https://example.com/wq.jpg');
  });

  // feliz
  it('shows initials without a photo', () => {
    render(<AzuosPersonAvatar name="Rafael Camargo" />);

    expect(screen.getByText('RC')).toBeInTheDocument();
  });

  // feliz
  it('uses the photo when avatarUrl is filled', async () => {
    vi.stubGlobal('Image', InstantLoadImage);

    const { container } = render(
      <AzuosPersonAvatar name="Camila" avatarUrl="https://example.com/camila.jpg" />,
    );

    const image = await vi.waitUntil(() => container.querySelector('[data-slot="avatar-image"]'));
    expect(image).toHaveAttribute('src', 'https://example.com/camila.jpg');
  });

  /* Duas iniciais bastam; nome com vários sobrenomes não pode virar mais que isso. */
  it('cuts initials to two letters even for compound names', () => {
    render(<AzuosPersonAvatar name="Maria Fernanda Albuquerque Nascimento" />);

    expect(screen.getByText('MF')).toBeInTheDocument();
  });

  // triste
  it('gives a one-word name a single initial', () => {
    render(<AzuosPersonAvatar name="Bia" />);

    expect(screen.getByText('B')).toBeInTheDocument();
  });
});
