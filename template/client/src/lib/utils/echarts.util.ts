import { type EChartsOption } from 'echarts';
import type * as EChartsCore from 'echarts/core';

import { hasThemeColor, themeColor } from './theme-color.util';

/**
 * O ECHARTS DO PROJETO — o carregamento, o tema e as cores, num lugar só.
 *
 * **Carrega sob demanda e só o que usamos.** O pacote inteiro passa de 1 MB; importando o núcleo e
 * os poucos tipos de gráfico do projeto, ele cai para uma fração disso, e o `import()` deixa esse
 * peso FORA do carregamento inicial: só a tela que tem gráfico paga por ele, e paga uma vez.
 *
 * **Desenha em SVG, não em Canvas.** Os painéis têm centenas de pontos, não milhões: nessa escala
 * o SVG é tão rápido quanto, fica nítido em qualquer zoom e na impressão, e funciona no jsdom dos
 * testes (que não tem Canvas).
 *
 * **O tema vem dos TOKENS** (`tokens.css`), lidos na hora: o ECharts não enxerga classe do Tailwind
 * nem variável CSS, então as cores do tema claro/escuro são resolvidas aqui e entregues prontas.
 */
export type ChartOption = EChartsOption;

export type EChartsModule = typeof EChartsCore;

let loading: Promise<EChartsModule> | null = null;

export function loadECharts(): Promise<EChartsModule> {
  loading ??= importECharts();

  return loading;
}

async function importECharts(): Promise<EChartsModule> {
  const [core, charts, components, renderers] = await Promise.all([
    import('echarts/core'),
    import('echarts/charts'),
    import('echarts/components'),
    import('echarts/renderers'),
  ]);

  core.use([
    charts.BarChart,
    charts.LineChart,
    charts.PieChart,
    charts.GaugeChart,
    charts.RadarChart,
    charts.SankeyChart,
    charts.TreemapChart,
    charts.HeatmapChart,
    components.GridComponent,
    components.TooltipComponent,
    components.LegendComponent,
    components.CalendarComponent,
    components.VisualMapComponent,
    components.AriaComponent,
    renderers.SVGRenderer,
  ]);

  return core;
}

/** As cores do tema já resolvidas — o que todo gráfico usa para texto, grade e balão. */
export type ChartTheme = {
  foreground: string;
  muted: string;
  border: string;
  surface: string;
  track: string;
  font: string;
  success: string;
  info: string;
  warning: string;
  danger: string;
};

/* A reserva é o tema CLARO lido do próprio `tokens.css` (ver `theme-color.util`): sem navegador
   (teste, servidor) é o que vale, e nenhuma cor fica escrita aqui para descolar de lá. */
const FALLBACK_THEME: ChartTheme = {
  foreground: themeColor('--foreground'),
  muted: themeColor('--muted-foreground'),
  border: themeColor('--border'),
  surface: themeColor('--popover'),
  track: themeColor('--muted'),
  font: 'Inter, system-ui, sans-serif',
  success: themeColor('--success'),
  info: themeColor('--info'),
  warning: themeColor('--warning'),
  danger: themeColor('--destructive'),
};

/** Lê o tema do documento agora. Sem documento (fora do navegador), o tema claro padrão. */
export function readChartTheme(): ChartTheme {
  if (typeof document === 'undefined') return FALLBACK_THEME;

  return {
    foreground: resolveColor('var(--foreground)', FALLBACK_THEME.foreground),
    muted: resolveColor('var(--muted-foreground)', FALLBACK_THEME.muted),
    border: resolveColor('var(--border)', FALLBACK_THEME.border),
    surface: resolveColor('var(--popover)', FALLBACK_THEME.surface),
    track: resolveColor('var(--muted)', FALLBACK_THEME.track),
    font:
      getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim() ||
      FALLBACK_THEME.font,
    success: resolveColor('var(--success)', FALLBACK_THEME.success),
    info: resolveColor('var(--info)', FALLBACK_THEME.info),
    warning: resolveColor('var(--warning)', FALLBACK_THEME.warning),
    danger: resolveColor('var(--destructive)', FALLBACK_THEME.danger),
  };
}

/**
 * Qualquer cor CSS (`var(--chart-1)`, `oklch(...)`, nome) virando uma cor que o SVG do ECharts
 * desenha. O navegador resolve num elemento de prova; o que ele não entende volta no `fallback`.
 */
export function resolveColor(value: string, fallback = FALLBACK_THEME.muted): string {
  if (!value.includes('var(')) return value;

  const resolved = typeof document === 'undefined' ? '' : probeColor(value);
  if (resolved && !resolved.includes('var(')) return resolved;

  /* Sem navegador (ou com um que não resolve `var()`, como o jsdom dos testes), o token é lido
     do `tokens.css` — a mesma cor do tema claro que o navegador daria. */
  const token = /var\((--[\w-]+)\)/.exec(value)?.[1];

  return token && hasThemeColor(token) ? themeColor(token) : fallback;
}

function probeColor(value: string): string {
  const probe = document.createElement('span');
  probe.style.color = value;
  probe.style.display = 'none';
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();

  return resolved ?? '';
}

/**
 * O que TODO gráfico herda: fundo transparente (quem pinta é o cartão), a fonte do sistema, o texto
 * nos tons do tema e o balão com a cara do popover do shadcn. Cada gráfico só escreve o que é dele.
 */
export function withChartTheme(option: ChartOption, theme: ChartTheme): ChartOption {
  const tooltip = Array.isArray(option.tooltip) ? option.tooltip[0] : option.tooltip;

  return {
    backgroundColor: 'transparent',
    animationDuration: 500,
    textStyle: { fontFamily: theme.font, color: theme.foreground },
    aria: { enabled: true },
    ...option,
    tooltip: tooltip
      ? {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderWidth: 1,
          padding: [6, 10],
          textStyle: { color: theme.foreground, fontSize: 12, fontFamily: theme.font },
          /* A sombra é a do card (`--elevation-card`): o balão mora no `body`, onde o token resolve. */
          extraCssText: 'border-radius: 10px; box-shadow: var(--elevation-card);',
          confine: true,
          /* O balão mora no `body`, FORA do gráfico. Dentro dele, num quadro com rolagem própria, o
             balão aparecendo mudava a altura a rolar: a barra de rolagem surgia, a largura mudava,
             o gráfico se redesenhava, o balão sumia — e o ciclo recomeçava, piscando no hover. */
          appendTo: 'body',
          ...tooltip,
        }
      : undefined,
  };
}

/**
 * O que o clique num gráfico entrega: o nome do item, o tipo dele (`node`/`edge` no fluxo) e, no mapa
 * de calor, a linha e a coluna.
 */
export type ChartSelection = { name: string; kind?: string; row?: string; column?: string };

export function selectionOf(params: {
  name?: unknown;
  data?: unknown;
  dataType?: unknown;
}): ChartSelection {
  const data = params.data as { row?: unknown; column?: unknown; id?: unknown } | undefined;
  const name = typeof data?.id === 'string' ? data.id : String(params.name ?? '');

  return {
    name,
    kind: typeof params.dataType === 'string' ? params.dataType : undefined,
    row: typeof data?.row === 'string' ? data.row : undefined,
    column: typeof data?.column === 'string' ? data.column : undefined,
  };
}

/** Rótulo longo cortado no eixo; o nome inteiro continua no balão. */
export function shortenLabel(label: string, max = 14): string {
  if (label.length <= max) return label;

  return `${label.slice(0, max - 1).trimEnd()}…`;
}

/** A porcentagem inteira de uma parte, sem dividir por zero. */
export function shareOf(value: number, total: number): number {
  if (total <= 0) return 0;

  return Math.round((value / total) * 100);
}

/** Número no formato brasileiro: 6.351, não 6351. */
export function formatCount(value: number): string {
  return value.toLocaleString('pt-BR');
}
