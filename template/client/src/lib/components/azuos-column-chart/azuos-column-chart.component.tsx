import { Bar, BarChart, Cell, LabelList, XAxis } from 'recharts';

import { type ChartSlice, colorOfSlice } from '../../utils/chart-slice.util';
import { AzuosChartFrame } from '../azuos-chart-frame/azuos-chart-frame.component';
import { AzuosChartTooltip } from '../azuos-chart-tooltip/azuos-chart-tooltip.component';
import { ChartTooltip } from '../ui/chart';

/**
 * Coluna — para comparar quantidades entre categorias (por responsável, por tipo).
 *
 * **Sem legenda** (uma série só; legenda de uma série é ruído), **o valor escrito acima de
 * cada coluna** (no lugar de obrigar a estimar pela altura) e **clique na coluna abrindo o
 * detalhamento**. Sem eixo Y: com o número em cima de cada coluna, a escala à esquerda não
 * acrescenta nada e come largura.
 */
export type AzuosColumnChartProps = {
  data: {
    slices: ChartSlice[];
    /** O nome da série no popover — "Tarefas: 8". Mesmo motivo da rosca. */
    seriesLabel: string;
  };
  state?: { isLoading?: boolean };
  ui?: { emptyLabel?: string; heightClass?: string };
  actions?: { onSelect?: (label: string) => void };
};

export function AzuosColumnChart({ data, state, ui, actions }: AzuosColumnChartProps) {
  /* Carregando e vazio moram na moldura (`AzuosChartFrame`), e não aqui: escritos em cada gráfico,
     o mesmo painel tinha dois cinzas diferentes piscando e duas frases diferentes para o vazio. */
  return (
    <AzuosChartFrame
      data={{ config: { value: { label: data.seriesLabel } } }}
      ui={{ heightClass: ui?.heightClass ?? 'h-full', emptyLabel: ui?.emptyLabel }}
      state={{ isLoading: state?.isLoading, isEmpty: data.slices.length === 0 }}
    >
      {/* Margem lateral maior que o normal: o selo do valor é mais largo que o número
          sozinho, e nas colunas da ponta ele passava da borda do gráfico sem essa folga.
          Margem de baixo também maior: some com a folga que faltava pro rótulo comprido do
          eixo (girado -30°) não vazar por baixo da área do SVG — o `height` do `XAxis` reserva
          espaço para o texto girado, mas sem margem nenhuma o pé do texto encostava na borda
          de baixo e cortava. */}
      <BarChart data={data.slices} margin={{ top: 24, right: 14, left: 14, bottom: 12 }}>
        {/* Mesmo contêiner arredondado e com sombra macia que a rosca usa — os dois
            popovers do dashboard têm que parecer a mesma peça. `labelFormatter` troca o
            título pelo NOME da fatia em vez do rótulo genérico da série: sem ele, o topo do
            popover ficava em branco (o cruzamento de `labelKey`/`config` não resolvia
            sozinho) e só a linha "Tarefas: 6" aparecia — sem dizer de QUAL categoria. */}
        <ChartTooltip
          cursor={{ fill: 'var(--color-muted)' }}
          content={
            <AzuosChartTooltip
              nameKey="value"
              labelFormatter={(_, tooltipPayload) =>
                (tooltipPayload?.[0]?.payload as ChartSlice | undefined)?.label ?? ''
              }
            />
          }
        />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          interval={0}
          height={64}
          angle={-30}
          textAnchor="end"
          tickFormatter={(label: string) => shorten(label)}
        />
        <Bar
          dataKey="value"
          radius={[4, 4, 0, 0]}
          onClick={(bar: unknown) => actions?.onSelect?.(readLabel(bar))}
          className={actions?.onSelect ? 'cursor-pointer' : undefined}
        >
          {data.slices.map((slice, index) => (
            <Cell key={slice.label} fill={colorOfSlice(slice.label, index)} />
          ))}
          {/* Selo na MESMA cor da coluna — não uma cor genérica só pra ele — pra ler como
              parte da própria coluna, não como uma etiqueta colada em cima. */}
          <LabelList
            dataKey="value"
            position="top"
            offset={12}
            content={(props: unknown) => (
              <ColumnValueBadge {...(props as ColumnValueBadgeProps)} slices={data.slices} />
            )}
          />
        </Bar>
      </BarChart>
    </AzuosChartFrame>
  );
}

/** Rótulo longo cortado no eixo; o nome inteiro continua no tooltip. */
function shorten(label: string): string {
  return label.length > 14 ? `${label.slice(0, 13)}…` : label;
}

function readLabel(bar: unknown): string {
  const payload = bar as { label?: string; payload?: { label?: string } };

  return payload.label ?? payload.payload?.label ?? '';
}

type ColumnValueBadgeProps = { x: number; y: number; width: number; value: number; index: number };

/**
 * O selo do valor, desenhado à mão — SVG puro, porque `LabelList` só aceita marcação SVG
 * (`<g>`, `<rect>`, `<text>`), não um componente HTML qualquer por cima do gráfico.
 *
 * Largura calculada pelo tamanho do texto: um selo de largura fixa ou sobra vazio atrás de
 * "1" ou corta o "6" de duas colunas de dois dígitos — nenhuma das opções serve pras duas
 * pontas que a mesma coluna precisa cobrir.
 *
 * A cor vem de `colorOfSlice(slices[index].label, index)` — a MESMA conta que colore a
 * `<Cell>` da coluna logo abaixo — para o selo nunca destoar da coluna que ele rotula.
 */
function ColumnValueBadge({
  x,
  y,
  width,
  value,
  index,
  slices,
}: ColumnValueBadgeProps & { slices: ChartSlice[] }) {
  const text = String(value);
  const pillWidth = Math.max(20, text.length * 6.5 + 12);
  const cx = x + width / 2;
  const fill = colorOfSlice(slices[index]?.label ?? '', index);

  return (
    <g className="pointer-events-none">
      <rect x={cx - pillWidth / 2} y={y - 16} width={pillWidth} height={16} rx={8} fill={fill} />
      <text
        x={cx}
        y={y - 8}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-white text-xs font-semibold"
      >
        {text}
      </text>
    </g>
  );
}
