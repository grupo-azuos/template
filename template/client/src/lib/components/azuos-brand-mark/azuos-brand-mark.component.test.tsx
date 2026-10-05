import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AzuosBrandMark } from './azuos-brand-mark.component';

describe('AzuosBrandMark', () => {
  // feliz
  /* A marca é uma IMAGEM, e imagem precisa de texto alternativo: sem ele, quem usa leitor de tela
     ouve o nome do arquivo no lugar do nome da empresa. */
  it('names the brand for a screen reader', () => {
    render(<AzuosBrandMark />);

    expect(screen.getByRole('img', { name: 'Grupo Azuos' })).toBeInTheDocument();
  });

  it('uses the official file, not a hand-drawn copy', () => {
    render(<AzuosBrandMark />);

    expect(screen.getByRole('img')).toHaveAttribute('src', expect.stringContaining('azuos-logo'));
  });

  it('changes width by size, keeping the height proportional', () => {
    const { rerender } = render(<AzuosBrandMark ui={{ size: 'sm' }} />);
    const small = screen.getByRole('img').getAttribute('width');

    rerender(<AzuosBrandMark ui={{ size: 'lg' }} />);

    expect(Number(screen.getByRole('img').getAttribute('width'))).toBeGreaterThan(Number(small));
    expect(screen.getByRole('img').className).toContain('h-auto');
  });

  // triste
  /* Sem tamanho escolhido ela não nasce sem largura: uma imagem sem largura salta de tamanho quando
     o arquivo termina de carregar, e o cabeçalho da barra pula junto. */
  it('has a default width when no size was given', () => {
    render(<AzuosBrandMark />);

    expect(screen.getByRole('img')).toHaveAttribute('width');
  });

  it('accepts an extra class without losing the proportional height', () => {
    render(<AzuosBrandMark ui={{ className: 'opacity-80' }} />);

    expect(screen.getByRole('img').className).toContain('opacity-80');
    expect(screen.getByRole('img').className).toContain('h-auto');
  });
});
