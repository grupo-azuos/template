import { cn } from '../../utils/cn.util';

/**
 * A LEGENDA de um gráfico de várias séries — o nome ESCRITO ao lado da cor.
 *
 * É HTML nosso, e não a legenda da biblioteca, por dois motivos: ela aparece ANTES de o desenho se
 * medir (então a tela nunca nasce com um gráfico sem explicação), e o projeto exige que a cor nunca
 * seja o único jeito de saber qual série é qual — nenhuma paleta categórica com muitas séries passa
 * no teste de daltonismo.
 */
export type AzuosChartLegendEntry = { key: string; label: string; color: string };

export type AzuosChartLegendProps = {
  data: { series: readonly AzuosChartLegendEntry[] };
  ui?: { className?: string };
};

export function AzuosChartLegend({ data, ui }: AzuosChartLegendProps) {
  /* Legenda de uma série é ruído: o título do bloco já diz o que está desenhado. */
  if (data.series.length < 2) return null;

  return (
    <ul className={cn('flex flex-wrap gap-x-4 gap-y-1', ui?.className)}>
      {data.series.map((series) => (
        <li key={series.key} className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ background: series.color }}
            aria-hidden="true"
          />
          {series.label}
        </li>
      ))}
    </ul>
  );
}
