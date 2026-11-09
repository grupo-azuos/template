import { Check, Dot } from 'lucide-react';

import {
  STRENGTH_HINTS,
  STRENGTH_LABELS,
  STRENGTH_RULES,
  type PasswordStrength,
} from '../../view-models/password-strength.util';
import { cn } from '../../utils/cn.util';

/**
 * A BARRA DE FORÇA — quatro blocos e uma lista do que falta.
 *
 * Ela informa, e não tranca. O botão de enviar obedece ao schema do `shared`, que é o mesmo
 * que o servidor confere; esta barra diz à pessoa o quanto a senha resiste enquanto ela
 * digita. Travar o envio aqui criaria uma regra de senha que só existe na tela.
 *
 * A lista embaixo existe porque a barra sozinha não ensina: "Fraca" faz a pessoa acrescentar
 * um `1` no fim e tentar de novo. Com os quatro itens à vista ela vê qual deles falta, e a
 * senha que sai daqui é melhor por um motivo que ela entendeu.
 *
 * A cor NUNCA é o único sinal: cada item tem ícone e o rótulo diz o nível por extenso. Numa
 * tela em preto e branco, ou para quem não separa vermelho de verde, a barra continua
 * legível.
 */
export type AzuosPasswordStrengthMeterProps = {
  data: { strength: PasswordStrength };
  ui?: { className?: string };
};

/* Um bloco por critério cumprido. A cor sobe junto: um critério é vermelho, dois e três
   amarelo, os quatro verde. */
const FILL: Record<number, string> = {
  1: 'bg-destructive',
  2: 'bg-brand-yellow-500',
  3: 'bg-brand-yellow-500',
  4: 'bg-success',
};

export function AzuosPasswordStrengthMeter({ data, ui }: AzuosPasswordStrengthMeterProps) {
  const { score, level, met } = data.strength;

  return (
    <div className={cn('flex flex-col gap-2.5', ui?.className)}>
      <div className="flex items-center gap-3">
        {/* Decoração do que o texto ao lado já diz — por isso `aria-hidden`. O leitor de tela
            lê "Força da senha: Boa", e não quatro divs sem nome. */}
        <div aria-hidden className="flex flex-1 gap-1.5">
          {[1, 2, 3, 4].map((block) => (
            <div
              key={block}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                block <= score ? FILL[score] : 'bg-ink-300',
              )}
            />
          ))}
        </div>

        <p className="w-20 text-right text-xs font-medium text-ink-500">
          <span className="sr-only">Força da senha: </span>
          {STRENGTH_LABELS[level]}
        </p>
      </div>

      <ul className="grid gap-1 sm:grid-cols-2">
        {STRENGTH_RULES.map((rule) => (
          <li
            key={rule}
            className={cn(
              'flex items-center gap-1 text-xs',
              met[rule] ? 'text-success' : 'text-ink-500',
            )}
          >
            {met[rule] ? (
              <Check className="size-3.5 shrink-0" aria-hidden />
            ) : (
              <Dot className="size-3.5 shrink-0" aria-hidden />
            )}
            {/* O estado vai no TEXTO, e não só no ícone e na cor: sem isto, o leitor de tela
                lê os quatro itens iguais, cumpridos ou não. */}
            <span className="sr-only">{met[rule] ? 'Cumprido: ' : 'Falta: '}</span>
            {STRENGTH_HINTS[rule]}
          </li>
        ))}
      </ul>
    </div>
  );
}
