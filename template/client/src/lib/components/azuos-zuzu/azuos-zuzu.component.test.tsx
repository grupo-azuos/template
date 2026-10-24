import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AzuosZuzu } from './azuos-zuzu.component';

function image(): HTMLImageElement {
  /* `getByRole('img')` não acha: a imagem é `aria-hidden`, e é esse o ponto do teste abaixo. */
  const found = document.querySelector('img');
  if (!found) throw new Error('o Zuzu não desenhou');

  return found;
}

describe('AzuosZuzu', () => {
  // feliz
  it('desenha a pose pedida', () => {
    render(<AzuosZuzu data={{ pose: 'celebrating' }} />);

    expect(image().getAttribute('src')).toContain('festejando');
  });

  it('usa o tamanho pedido, e 96 quando não pedem nenhum', () => {
    const { unmount } = render(<AzuosZuzu ui={{ size: 40 }} />);
    expect(image().width).toBe(40);
    unmount();

    render(<AzuosZuzu />);
    expect(image().width).toBe(96);
  });

  // triste
  /**
   * `alt` vazio e `aria-hidden` são de propósito: o Zuzu acompanha um texto que já diz a mesma
   * coisa, e anunciá-lo faria o leitor de tela ler "imagem do Zuzu" antes da frase que importa.
   * É regra de acessibilidade, não detalhe — por isso tem teste.
   */
  it('não se anuncia para quem usa leitor de tela', () => {
    render(<AzuosZuzu data={{ pose: 'idea' }} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(image()).toHaveAttribute('aria-hidden', 'true');
    expect(image()).toHaveAttribute('alt', '');
  });

  /* Pose desconhecida não existe no tipo, mas o padrão precisa valer quando nada é passado:
     sem pose, ele fica debruçado — e não some. */
  it('cai no debruçado quando não pedem pose', () => {
    render(<AzuosZuzu />);

    expect(image().getAttribute('src')).toContain('debrucado');
  });
});
