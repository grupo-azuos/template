import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AzuosUsageMeter, usageTone } from './azuos-usage-meter.component';

describe('usageTone', () => {
  // feliz
  /* AQUI CHEIO É RUIM. Um corte trocado pinta de verde justamente a capacidade que vai estourar. */
  it('turns critical from 90% up', () => {
    expect(usageTone(90)).toBe('critical');
    expect(usageTone(99.9)).toBe('critical');
  });

  it('warns from 75% to just under 90%', () => {
    expect(usageTone(75)).toBe('attention');
    expect(usageTone(89)).toBe('attention');
  });

  it('stays calm below 75%', () => {
    expect(usageTone(0)).toBe('calm');
    expect(usageTone(74)).toBe('calm');
  });
});

describe('AzuosUsageMeter', () => {
  // feliz
  it('shows the label, the percentage and the detail', () => {
    render(
      <AzuosUsageMeter data={{ label: 'Disco', percentage: 42, detail: '6,7 GB de 16 GB' }} />,
    );

    expect(screen.getByText('Disco')).toBeInTheDocument();
    expect(screen.getByText('42%')).toBeInTheDocument();
    expect(screen.getByText('6,7 GB de 16 GB')).toBeInTheDocument();
  });

  it('announces the reading to a screen reader, not only to the eye', () => {
    render(<AzuosUsageMeter data={{ label: 'Memória', percentage: 68 }} />);

    const bar = screen.getByRole('progressbar', { name: 'Memória' });

    expect(bar).toHaveAttribute('aria-valuenow', '68');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  // triste
  /* Medida torta acontece (leitura parcial, divisão por total errado). A barra tem de continuar
     dentro do bloco: vazando, ela cobre o texto do vizinho e a tela parece quebrada. */
  it('clamps a reading above 100% instead of overflowing', () => {
    render(<AzuosUsageMeter data={{ label: 'Cota', percentage: 142 }} />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('clamps a negative reading at zero instead of disappearing to the left', () => {
    render(<AzuosUsageMeter data={{ label: 'Cota', percentage: -5 }} />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('draws no detail line when there is no detail', () => {
    const { container } = render(<AzuosUsageMeter data={{ label: 'Disco', percentage: 10 }} />);

    expect(container.querySelector('p')).not.toBeInTheDocument();
  });
});
