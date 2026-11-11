import { describe, expect, it } from 'vitest';

import { themeColor } from './theme-color.util';
import {
  formatCount,
  resolveColor,
  selectionOf,
  shareOf,
  shortenLabel,
  withChartTheme,
} from './echarts.util';

const THEME = {
  foreground: '#111111',
  muted: '#666666',
  border: '#dddddd',
  surface: '#ffffff',
  track: '#f3f4f6',
  font: 'Inter',
  success: '#047857',
  info: '#1d4ed8',
  warning: '#ffdc00',
  danger: '#e11d48',
};

describe('echarts.util', () => {
  // feliz
  it('keeps a plain colour as it is', () => {
    expect(resolveColor('#3b82f6')).toBe('#3b82f6');
  });

  /* Todo gráfico herda o balão com a cara do popover: quem chama só escreve o que é dele. */
  it('dresses the tooltip with the theme and keeps what the chart asked for', () => {
    const option = withChartTheme({ tooltip: { trigger: 'item' } }, THEME);
    const tooltip = option.tooltip as {
      trigger: string;
      backgroundColor: string;
      confine: boolean;
    };

    expect(tooltip).toMatchObject({ trigger: 'item', backgroundColor: '#ffffff', confine: true });
    expect(option.backgroundColor).toBe('transparent');
  });

  /* REGRESSÃO: dentro de um quadro com rolagem, o balão no próprio gráfico fazia a barra de
     rolagem aparecer e sumir, e o gráfico piscava no hover. O balão mora no `body`. */
  it('puts the tooltip in the page body, outside any scrolling box', () => {
    const tooltip = withChartTheme({ tooltip: { trigger: 'item' } }, THEME).tooltip as {
      appendTo: string;
    };

    expect(tooltip.appendTo).toBe('body');
  });

  it('reads the clicked item, with row and column on a heatmap cell', () => {
    expect(selectionOf({ name: 'Goiânia', dataType: 'node' })).toEqual({
      name: 'Goiânia',
      kind: 'node',
    });
    expect(selectionOf({ name: '', data: { row: 'Ana', column: 'Parado' } })).toMatchObject({
      row: 'Ana',
      column: 'Parado',
    });
  });

  it('writes counts the Brazilian way and cuts long names with an ellipsis', () => {
    expect(formatCount(6351)).toBe('6.351');
    expect(shortenLabel('Departamento Jurídico', 13)).toBe('Departamento…');
  });

  // triste
  it('does not divide by zero for the share of an empty total', () => {
    expect(shareOf(5, 0)).toBe(0);
  });

  it('draws no tooltip when the chart asked for none', () => {
    expect(withChartTheme({}, THEME).tooltip).toBeUndefined();
  });

  // feliz
  /* O jsdom não resolve `var()`: a cor sai do `tokens.css`, a mesma do tema claro no navegador. */
  it('resolves a token colour from the tokens file when the browser cannot', () => {
    expect(resolveColor('var(--primary)')).toBe(themeColor('--primary'));
  });

  it('reads the clicked item by its id when it has one, and by name otherwise', () => {
    expect(selectionOf({ name: 'Outros (2)', data: { id: '__others__' } }).name).toBe('__others__');
    expect(selectionOf({ name: 'Goiânia', data: { id: 7 } }).name).toBe('Goiânia');
    expect(selectionOf({}).name).toBe('');
  });

  it('dresses the first tooltip when the chart gave a list of them', () => {
    const option = withChartTheme({ tooltip: [{ trigger: 'axis' }] }, THEME);

    expect(option.tooltip).toMatchObject({ trigger: 'axis' });
  });

  // triste
  it('falls back when the token does not exist', () => {
    expect(resolveColor('var(--does-not-exist)', 'fallback')).toBe('fallback');
    expect(resolveColor('var(--does-not-exist)')).toBe(THEME_FALLBACK_MUTED);
  });
});

/* O `muted` padrão de `FALLBACK_THEME`, lido pelo mesmo caminho do util. */
const THEME_FALLBACK_MUTED = themeColor('--muted-foreground');
