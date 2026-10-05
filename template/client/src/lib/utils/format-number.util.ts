/**
 * Números para a TELA — porcentagem e contagem.
 *
 * Sem casa decimal na porcentagem: "87%" responde a pergunta que se faz; "87,3%" sugere uma
 * precisão que a medida não tem, e dois painéis arredondando diferente passam a discordar.
 */

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';

  return `${value.toFixed(0)}%`;
}

const COUNT = new Intl.NumberFormat('pt-BR');

/** Contagem com o separador de milhar de quem lê: "1.067", não "1067". */
export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';

  return COUNT.format(value);
}
