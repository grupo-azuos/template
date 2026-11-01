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

const MONEY_WITH_CENTS = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Dinheiro de VERDADE, em centavos inteiros (`R$ 1.234,56`): o valor de um lançamento, e não uma
 * estimativa — aqui o centavo importa. Sem valor vira travessão, pelo mesmo motivo do `formatMoney`.
 */
export function formatMoneyCents(cents: number | null | undefined): string {
  if (cents === null || cents === undefined || Number.isNaN(cents)) return '—';

  return MONEY_WITH_CENTS.format(cents / 100);
}

/**
 * O mesmo valor COM SINAL escrito: `+R$ 1.234,56` a favor, `−R$ 1.234,56` contra, zero sem sinal.
 * Cor sozinha não diz se o dinheiro entra ou sai — quem não distingue verde de vermelho lê o sinal.
 */
export function formatSignedMoneyCents(cents: number | null | undefined): string {
  if (cents === null || cents === undefined || Number.isNaN(cents)) return '—';
  if (cents === 0) return formatMoneyCents(0);

  return `${cents > 0 ? '+' : '−'}${formatMoneyCents(Math.abs(cents))}`;
}
