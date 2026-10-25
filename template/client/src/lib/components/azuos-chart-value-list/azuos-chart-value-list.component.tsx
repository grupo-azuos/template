import { type ChartSlice } from '../../utils/chart-slice.util';
import { formatCount } from '../../utils/echarts.util';

/**
 * Os valores de um gráfico em TEXTO, só para leitor de tela.
 *
 * Um desenho não se lê em voz alta: sem esta lista, quem usa leitor de tela ouve "imagem" e nada
 * mais. Fica escondida da vista (`sr-only`) — quem enxerga já tem o rótulo escrito no próprio
 * gráfico.
 */
export type AzuosChartValueListProps = {
  data: { slices: readonly ChartSlice[] };
};

export function AzuosChartValueList({ data }: AzuosChartValueListProps) {
  if (data.slices.length === 0) return null;

  return (
    <ul className="sr-only">
      {data.slices.map((slice) => (
        <li key={slice.label}>
          {slice.label}: {formatCount(slice.value)}
        </li>
      ))}
    </ul>
  );
}
