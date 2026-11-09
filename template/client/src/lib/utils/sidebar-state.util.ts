/**
 * A BARRA LATERAL ABRE COMO A PESSOA A DEIXOU.
 *
 * O componente baixado já grava a escolha num cookie (`sidebar_state`) a cada recolher ou
 * expandir, mas não a lê de volta: sem isto, quem trabalha com a barra recolhida a via abrir
 * inteira a cada recarga e tinha de recolhê-la de novo. Ler o cookie é o que fecha o ciclo.
 *
 * Sem cookie, ou com um valor que não é `true`/`false`, a barra abre — é o padrão do componente
 * e o jeito de quem nunca mexeu nela descobrir o menu.
 */
const SIDEBAR_COOKIE_NAME = 'sidebar_state';

export function sidebarOpenFromCookie(cookie: string): boolean {
  const entry = cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SIDEBAR_COOKIE_NAME}=`));

  return entry?.slice(SIDEBAR_COOKIE_NAME.length + 1) !== 'false';
}
