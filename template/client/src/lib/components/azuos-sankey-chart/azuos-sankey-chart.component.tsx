import {
  type ChartOption,
  type ChartTheme,
  formatCount,
  resolveColor,
  shortenLabel,
} from '../../utils/echarts.util';
import { AzuosEchart } from '../azuos-echart/azuos-echart.component';

/**
 * FLUXO (Sankey) — para onde o volume vai, etapa por etapa.
 *
 * É o gráfico para "de onde vem e onde trava": cada coluna é uma etapa (tipo → responsável →
 * situação, por exemplo) e a espessura de cada faixa é a quantidade que passa por ali. Uma barra
 * responde "quantos com cada um"; o fluxo responde "quantos de QUAL tipo, com quem, parados".
 *
 * **Poucos nós por coluna** (até uns dez). Passou disso, o desenho vira espaguete: quem monta a tela
 * agrupa a cauda em "Outros" antes de entregar. Passar o ponteiro num nó acende só as faixas dele;
 * clicar num nó abre o detalhamento (`actions.onSelect`, com o `id` do nó).
 *
 * O `id` do nó é único no gráfico todo, e o `label` é o que aparece: o mesmo nome pode existir em
 * duas colunas ("N/A" como tipo e como responsável) sem os dois virarem um nó só.
 */
export type SankeyNode = { id: string; label: string; color: string };

export type SankeyLink = { from: string; to: string; value: number };

export type AzuosSankeyChartProps = {
  data: { nodes: readonly SankeyNode[]; links: readonly SankeyLink[]; seriesLabel: string };
  state?: { isLoading?: boolean };
  ui?: { emptyLabel?: string; heightClass?: string };
  actions?: { onSelect?: (nodeId: string) => void };
};

export function AzuosSankeyChart({ data, state, ui, actions }: AzuosSankeyChartProps) {
  const onSelect = actions?.onSelect;
  /* O total é o que ENTRA no fluxo (as faixas da primeira coluna): somar todas as faixas contaria o
     mesmo alvará uma vez por coluna. */
  const targets = new Set(data.links.map((link) => link.to));
  const total = data.links.filter((link) => !targets.has(link.from)).reduce((sum, link) => sum + link.value, 0);

  return (
    <AzuosEchart
      data={{
        option: (theme) => sankeyOption(data, theme),
        description: `${data.seriesLabel}: fluxo de ${formatCount(total)} entre ${data.nodes.length} etapas`,
      }}
      ui={{ heightClass: ui?.heightClass ?? 'h-96', emptyLabel: ui?.emptyLabel }}
      state={{ isLoading: state?.isLoading, isEmpty: data.links.length === 0 }}
      actions={{
        onSelect: onSelect
          ? (selection) => {
              /* Só o nó abre detalhamento: a faixa é "tipo X com a pessoa Y", e o detalhamento filtra
                 uma dimensão por vez. */
              if (selection.kind === 'node') onSelect(selection.name);
            }
          : undefined,
      }}
    />
  );
}

export function sankeyOption(
  data: AzuosSankeyChartProps['data'],
  theme: Pick<ChartTheme, 'foreground' | 'muted'>,
): ChartOption {
  const labels = new Map(data.nodes.map((node) => [node.id, node.label]));

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        const item = params as { dataType: string; name: string; value: number; data: { source?: string; target?: string } };
        if (item.dataType === 'edge') {
          return `${labels.get(item.data.source ?? '') ?? ''} → ${labels.get(item.data.target ?? '') ?? ''}<br/><b>${formatCount(item.value)}</b> ${data.seriesLabel.toLowerCase()}`;
        }

        return `<b>${labels.get(item.name) ?? item.name}</b><br/>${formatCount(item.value)} ${data.seriesLabel.toLowerCase()}`;
      },
    },
    series: [
      {
        type: 'sankey',
        /* Folga à direita: os nomes da última coluna ficam do lado de fora dos nós, e sem ela eram
           cortados na borda do quadro. */
        left: 4,
        right: 96,
        top: 8,
        bottom: 8,
        nodeWidth: 12,
        nodeGap: 8,
        layoutIterations: 32,
        draggable: false,
        emphasis: { focus: 'adjacency' },
        lineStyle: { color: 'gradient', opacity: 0.35, curveness: 0.5 },
        label: {
          color: theme.foreground,
          fontSize: 11,
          formatter: (params: unknown) => shortenLabel(labels.get((params as { name: string }).name) ?? '', 16),
        },
        data: data.nodes.map((node) => ({ name: node.id, itemStyle: { color: resolveColor(node.color), borderWidth: 0 } })),
        links: data.links.map((link) => ({ source: link.from, target: link.to, value: link.value })),
      },
    ],
  };
}
