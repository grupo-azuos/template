import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useMediaQueryBelow, XL_BREAKPOINT } from './use-media-query';

/** Um `matchMedia` de mentira, que responde o que o teste mandar. */
function stubMatchMedia(matches: boolean) {
  const listeners = new Set<() => void>();

  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches,
      media: query,
      addEventListener: (_: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
    })),
  );

  return listeners;
}

function Probe({ breakpoint }: { breakpoint: number }) {
  return <span>{useMediaQueryBelow(breakpoint) ? 'estreita' : 'larga'}</span>;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useMediaQueryBelow', () => {
  // feliz
  /* O valor já sai certo no PRIMEIRO render: com `useState` + `useEffect`, a tela renderizaria uma
     vez com o palpite errado e corrigiria depois — na largura em que a tabela vira cartões, isso é um
     salto visível a cada abertura. */
  it('is right on the first render, with no second pass', () => {
    stubMatchMedia(true);

    render(<Probe breakpoint={XL_BREAKPOINT} />);

    expect(screen.getByText('estreita')).toBeInTheDocument();
  });

  it('says the window is wide when the query does not match', () => {
    stubMatchMedia(false);

    render(<Probe breakpoint={XL_BREAKPOINT} />);

    expect(screen.getByText('larga')).toBeInTheDocument();
  });

  it('listens for changes, so a resize is noticed', () => {
    const listeners = stubMatchMedia(false);

    render(<Probe breakpoint={XL_BREAKPOINT} />);

    expect(listeners.size).toBe(1);
  });

  // triste
  /* Sem `matchMedia` (ambiente de teste mais pobre, render no servidor) o padrão é "não é estreito":
     a tela nasce no formato completo. O contrário — nascer compacta e crescer — é o mesmo salto por
     outro caminho. */
  it('assumes a wide window where matchMedia does not exist', () => {
    vi.stubGlobal('matchMedia', undefined);

    render(<Probe breakpoint={XL_BREAKPOINT} />);

    expect(screen.getByText('larga')).toBeInTheDocument();
  });
});

describe('XL_BREAKPOINT', () => {
  /* Fixar o número no teste é o que impede alguém de mudá-lo sem pensar: é o mesmo ponto em que a
     lista troca de tabela para cartões, e os dois têm de continuar casados. */
  it('is the point where the table becomes cards', () => {
    expect(XL_BREAKPOINT).toBe(1280);
  });
});
