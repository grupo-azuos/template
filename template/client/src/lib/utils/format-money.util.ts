/**
 * Dinheiro para a TELA, sempre em real e no formato de quem lê ("R$ 1.840").
 *
 * **Sem centavos, de propósito.** Todo valor que passa por aqui é estimativa, e "R$ 1.840,00" tem
 * cara de cotação fechada — o centavo dá a uma faixa de pesquisa uma precisão que ela não tem.
 * Valor que PRECISA de centavo (um preço de verdade, um total a pagar) pede uma função própria,
 * com nome próprio, para ninguém arredondar dinheiro de alguém por descuido.
 */
const MONEY = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

/** Sem valor vira travessão, e não "R$ 0": zero é uma informação, ausência é outra. */
export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';

  return MONEY.format(Math.round(value));
}

/** Uma faixa de preço em uma frase: "R$ 920 a R$ 1.720". */
export function formatMoneyRange(min: number, max: number): string {
  return `${formatMoney(min)} a ${formatMoney(max)}`;
}
