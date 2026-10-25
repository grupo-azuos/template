import { type ChartSlice, colorOfSlice } from '../../utils/chart-slice.util';
import { cn } from '../../utils/cn.util';
import { type ChartOption, type ChartTheme, formatCount, shareOf } from '../../utils/echarts.util';
import { AzuosEchart } from '../azuos-echart/azuos-echart.component';

/**
 * Rosca — para mostrar como um todo se divide (situação, categoria, cidade).
 *
 * Três coisas fazem o gráfico ser USADO e não só olhado:
 *
 *  1. **Legenda ao lado, com o nome escrito** — com o valor e a porcentagem junto.
 *  2. **Anel limpo**: a fatia não leva número escrito em cima. Valor e porcentagem aparecem na
 *     legenda e, ao passar o mouse, no balão — número dentro da fatia poluía o desenho e virava
 *     borrão nas fatias pequenas.
 *  3. **Clique na fatia abre o detalhamento** (`actions.onSelect`). O gráfico é o caminho para
 *     a lista, não um enfeite: é assim que alguém sai de "42 em andamento" para "quais 42".
 *
 * O total no MEIO do anel poupa a soma de cabeça.
 */
export type AzuosDonutChartProps = {
  data: {
    slices: ChartSlice[];
    /**
     * O nome da SÉRIE, que aparece dentro do popover: "Status: 10", e embaixo do total no
     * meio do anel.
     */
    seriesLabel: string;
  };
  state?: { isLoading?: boolean };
  ui?: { emptyLabel?: string };
  actions?: { onSelect?: (label: string) => void };
};

export function AzuosDonutChart({ data, state, ui, actions }: AzuosDonutChartProps) {
  if (state?.isLoading || data.slices.length === 0) {
    return (
      <AzuosEchart
        data={{ option: {}, description: data.seriesLabel }}
        ui={{ heightClass: 'h-full', emptyLabel: ui?.emptyLabel }}
        state={{ isLoading: state?.isLoading, isEmpty: data.slices.length === 0 }}
      />
    );
  }

  const total = data.slices.reduce((sum, slice) => sum + slice.value, 0);
  const onSelect = actions?.onSelect;

  return (
    /* No celular o anel vai EM CIMA e a legenda embaixo: lado a lado, numa tela de 360px, sobrava
       um anel do tamanho de uma moeda e uma legenda com os nomes cortados. */
    <div className="flex h-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      {/* Quadrado próprio para a rosca: sem ele, a legenda ao lado empurra o centro do
          anel para fora do meio visual do cartão, e o total sobreposto fica desalinhado. */}
      <div className="relative mx-auto aspect-square h-40 shrink-0 sm:h-full">
        <AzuosEchart
          data={{
            option: (theme) => donutOption(data.slices, data.seriesLabel, theme),
            description: `${data.seriesLabel}: ${formatCount(total)} no total`,
          }}
          ui={{ heightClass: 'h-full' }}
          actions={{ onSelect: onSelect ? (selection) => onSelect(selection.name) : undefined }}
        />

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-foreground text-xl leading-tight font-bold">
            {formatCount(total)}
          </span>
          <span className="text-muted-foreground text-xs tracking-wide uppercase">
            {data.seriesLabel}
          </span>
        </div>
      </div>

      {/* `self-stretch`: sem isso a lista fica `items-center` do pai, que dá a ela só a
          própria altura de conteúdo — e com 13 status o `overflow-y-auto` nunca entra em
          ação, e a lista extravasa o cartão por baixo. */}
      <ul className="min-h-0 min-w-0 flex-1 space-y-2.5 self-stretch overflow-y-auto pr-1">
        {data.slices.map((slice, index) => (
          <li key={slice.label}>
            <LegendItem
              data={{
                slice,
                color: colorOfSlice(slice.label, index),
                percent: shareOf(slice.value, total),
              }}
              actions={{ onSelect: actions?.onSelect }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Uma linha da legenda. Botão só quando o clique abre alguma coisa: sem `onSelect` ela é texto — um
 * botão que não faz nada atrapalha quem navega por teclado e confunde o leitor de tela.
 */
function LegendItem({
  data,
  actions,
}: {
  data: { slice: ChartSlice; color: string; percent: number };
  actions: { onSelect?: (label: string) => void };
}) {
  const row = <LegendRow data={data} />;
  const className = 'rounded-chip flex w-full items-center gap-2 px-1 py-0.5 text-left text-xs';
  const onSelect = actions.onSelect;

  if (!onSelect) return <div className={className}>{row}</div>;

  return (
    <button
      type="button"
      onClick={() => onSelect(data.slice.label)}
      className={cn(className, 'hover:bg-muted')}
    >
      {row}
    </button>
  );
}

function LegendRow({ data }: { data: { slice: ChartSlice; color: string; percent: number } }) {
  return (
    <>
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: data.color }}
        aria-hidden="true"
      />
      <span className="text-muted-foreground w-20 shrink-0 truncate" title={data.slice.label}>
        {data.slice.label}
      </span>
      {/* Barrinha de progresso — não é `AzuosProgressBar` (esse componente é pra "quanto já foi
          cumprido de uma obrigação", com tom por faixa de conclusão). Aqui a cor tem que ser a
          mesma do ponto e da fatia — a identidade da categoria, não "isso está bom ou ruim". */}
      <span className="bg-muted h-1.5 min-w-8 flex-1 overflow-hidden rounded-full">
        <span
          className="block h-full rounded-full"
          style={{ width: `${data.percent}%`, backgroundColor: data.color }}
        />
      </span>
      <span className="text-foreground shrink-0 font-semibold">
        {formatCount(data.slice.value)}
      </span>
      <span className="text-muted-foreground w-9 shrink-0 text-right">{data.percent}%</span>
    </>
  );
}

/**
 * O anel: fatias separadas por um fio da cor do cartão (sem ele, dois tons próximos encostam e viram
 * uma fatia só), sem número escrito em cima — o valor e a porcentagem estão na legenda e no balão.
 */
export function donutOption(
  slices: readonly ChartSlice[],
  seriesLabel: string,
  theme: Pick<ChartTheme, 'surface'>,
): ChartOption {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        const { name, value } = params as { name: string; value: number };

        return `<b>${name}</b><br/>${seriesLabel}: ${formatCount(value)} (${shareOf(value, total)}%)`;
      },
    },
    series: [
      {
        type: 'pie',
        name: seriesLabel,
        radius: ['62%', '100%'],
        padAngle: 1,
        itemStyle: { borderColor: theme.surface, borderWidth: 2 },
        label: { show: false },
        emphasis: { scaleSize: 4 },
        data: slices.map((slice, index) => ({
          name: slice.label,
          value: slice.value,
          itemStyle: { color: colorOfSlice(slice.label, index) },
        })),
      },
    ],
  };
}
