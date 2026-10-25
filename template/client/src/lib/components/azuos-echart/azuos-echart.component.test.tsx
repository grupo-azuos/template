import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AzuosEchart } from './azuos-echart.component';

const OPTION = { series: [{ type: 'bar' as const, data: [1, 2, 3] }] };

describe('AzuosEchart', () => {
  // feliz
  /* O desenho é uma imagem com descrição: quem usa leitor de tela ouve o que o gráfico mostra. */
  it('draws the chart as an image with a description', () => {
    render(<AzuosEchart data={{ option: OPTION, description: 'Tarefas por mês' }} />);

    expect(screen.getByRole('img', { name: 'Tarefas por mês' })).toBeInTheDocument();
  });

  it('looks clickable only when a click opens something', () => {
    const { container, rerender } = render(<AzuosEchart data={{ option: OPTION, description: 'x' }} />);
    expect(container.querySelector('.cursor-pointer')).not.toBeInTheDocument();

    rerender(<AzuosEchart data={{ option: OPTION, description: 'x' }} actions={{ onSelect: () => undefined }} />);
    expect(container.querySelector('.cursor-pointer')).toBeInTheDocument();
  });

  /* Desenho maior que a caixa: a caixa vira janela e o desenho rola dentro dela. */
  it('scrolls a drawing taller than its box', () => {
    render(<AzuosEchart data={{ option: OPTION, description: 'x' }} ui={{ heightClass: 'h-40', scrollHeight: 900 }} />);

    expect(screen.getByRole('img')).toHaveStyle({ height: '900px' });
    expect(screen.getByRole('img').parentElement).toHaveClass('overflow-y-auto', 'h-40');
  });

  // triste
  it('says there is no data instead of drawing an empty box', () => {
    render(
      <AzuosEchart data={{ option: OPTION, description: 'x' }} state={{ isEmpty: true }} ui={{ emptyLabel: 'Nada aqui' }} />,
    );

    expect(screen.getByText('Nada aqui')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('keeps the box while loading, so the panel does not reflow', () => {
    const { container } = render(
      <AzuosEchart data={{ option: OPTION, description: 'x' }} state={{ isLoading: true }} ui={{ heightClass: 'h-40' }} />,
    );

    expect(container.querySelector('[aria-busy="true"]')).toHaveClass('h-40');
  });
});
