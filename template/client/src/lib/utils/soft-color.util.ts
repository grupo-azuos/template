/**
 * A VERSÃO SUAVE de uma cor livre (a cor que a pessoa escolheu para a empresa, a cor de uma
 * fatia) — o mesmo papel do token `-soft` dos tons do grupo.
 *
 * Card colorido do grupo usa fundo suave, nunca a cor cheia nem borda: o texto continua escuro e
 * legível em cima, nos dois temas, porque a mistura é feita com o próprio fundo do card.
 */
export const SOFT_COLOR_PERCENT = 18;

export function softColorOf(color: string, percent = SOFT_COLOR_PERCENT): string {
  return `color-mix(in srgb, ${color} ${percent}%, var(--card))`;
}
