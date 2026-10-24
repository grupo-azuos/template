import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useRef } from 'react';

import zuzuAlerta from './assets/zuzu-alerta.png';
import zuzuApontando from './assets/zuzu-apontando.png';
import zuzuDebrucado from './assets/zuzu-debrucado.png';
import zuzuDormindo from './assets/zuzu-dormindo.png';
import zuzuFestejando from './assets/zuzu-festejando.png';
import zuzuIdeia from './assets/zuzu-ideia.png';
import zuzuJoinha from './assets/zuzu-joinha.png';
import zuzuLupa from './assets/zuzu-lupa.png';
import zuzuRelogio from './assets/zuzu-relogio.png';
import { prefersReducedMotion } from '../../motion/motion.util';
import { cn } from '../../utils/cn.util';

/**
 * AzuosZuzu, a arara — o mascote da casa, e o rosto que a equipe reconhece.
 *
 * Ele não é enfeite: é o AzuosZuzu que aparece quando uma lista está vazia, e "nenhum resultado"
 * com um mascote lendo é lido como "não há nada aqui", enquanto uma tela em branco é lida
 * como "quebrou". A diferença aparece no chamado que não é aberto.
 *
 * As poses e os movimentos são os MESMOS do sistema atual (`public/zuzu.js`), com os mesmos
 * tempos e as mesmas curvas — `sway` em 3,2s, `float` em 3s, `pulse` em 1,6s. O que mudou é
 * o motor: eram `@keyframes` de CSS injetados em tempo de execução, agora são tweens do
 * GSAP. Reproduzir os tempos não é apego: o AzuosZuzu parado num canto da tela o dia inteiro,
 * pulsando rápido demais, vira distração — e esses valores já passaram por esse teste.
 */
export type AzuosZuzuPose =
  | 'alert'
  | 'pointing'
  | 'leaning'
  | 'sleeping'
  | 'celebrating'
  | 'idea'
  | 'thumbsup'
  | 'magnifier'
  | 'clock';

/** Os movimentos do sistema atual, um por estado de humor. */
export type AzuosZuzuAnim = 'none' | 'sway' | 'float' | 'pulse' | 'breathe' | 'celebrate';

export type AzuosZuzuProps = {
  data?: { pose?: AzuosZuzuPose; anim?: AzuosZuzuAnim };
  ui?: { size?: number; className?: string };
};

const POSES: Record<AzuosZuzuPose, string> = {
  alert: zuzuAlerta,
  pointing: zuzuApontando,
  leaning: zuzuDebrucado,
  sleeping: zuzuDormindo,
  celebrating: zuzuFestejando,
  idea: zuzuIdeia,
  thumbsup: zuzuJoinha,
  magnifier: zuzuLupa,
  clock: zuzuRelogio,
};

export function AzuosZuzu({ data, ui }: AzuosZuzuProps) {
  const size = ui?.size ?? 96;
  const anim = data?.anim ?? 'none';
  const image = useRef<HTMLImageElement>(null);

  useGSAP(
    () => {
      const target = image.current;
      if (!target || anim === 'none') return;

      /* Movimento reduzido no sistema operacional costuma ser enjoo, enxaqueca ou vertigem —
         não preferência estética. Um mascote balançando sem parar é exatamente o que essas
         pessoas pediram para não ver, então aqui não vira "mais devagar": vira parado. */
      if (prefersReducedMotion()) return;

      gsap.set(target, { transformOrigin: TRANSFORM_ORIGINS[anim] ?? 'center center' });

      return animate(anim, target);
    },
    { dependencies: [anim] },
  );

  return (
    <img
      ref={image}
      src={POSES[data?.pose ?? 'leaning']}
      width={size}
      /* `alt` vazio e `aria-hidden` de propósito: o AzuosZuzu acompanha um texto que já diz a
         mesma coisa. Anunciá-lo faria o leitor de tela ler "imagem do AzuosZuzu" antes da frase
         que a pessoa precisa ouvir. */
      alt=""
      aria-hidden="true"
      className={cn('shrink-0 select-none', ui?.className)}
      style={{ width: size, height: 'auto' }}
    />
  );
}

const TRANSFORM_ORIGINS: Partial<Record<AzuosZuzuAnim, string>> = {
  /* Debruçado, ele gira preso pelo alto — girar pelo centro o faria flutuar fora da borda. */
  sway: 'top center',
};

function animate(anim: AzuosZuzuAnim, target: HTMLImageElement): gsap.core.Tween | undefined {
  switch (anim) {
    case 'sway':
      return gsap.to(target, {
        rotate: 4,
        duration: 1.6,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        startAt: { rotate: -4 },
      });

    case 'float':
      return gsap.to(target, {
        y: -8,
        duration: 1.5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });

    /* O "bounce" da saudação quando há alvará vencido: ele chama atenção sem sacudir a
       tela. Escala, e não deslocamento, porque o cartão tem altura fixa — pular de verdade
       empurraria o texto ao lado. */
    case 'pulse':
      return gsap.to(target, {
        keyframes: [
          { scale: 1.07, duration: 0.64, ease: 'sine.out' },
          { scale: 0.98, duration: 0.48, ease: 'sine.inOut' },
          { scale: 1, duration: 0.48, ease: 'sine.in' },
        ],
        repeat: -1,
      });

    case 'breathe':
      return gsap.to(target, {
        scale: 1.03,
        duration: 1.8,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });

    /* Comemoração NÃO se repete: uma vez e para. Mascote festejando em laço vira ruído, e
       ainda por cima festejando algo que a pessoa já leu e resolveu faz cinco minutos. */
    case 'celebrate':
      return gsap.to(target, {
        keyframes: [
          { y: -14, scale: 1.06, duration: 0.33, ease: 'power2.out' },
          { y: 0, scale: 1, duration: 0.33, ease: 'power2.in' },
          { y: -6, scale: 1.02, duration: 0.22, ease: 'power2.out' },
          { y: 0, scale: 1, duration: 0.22, ease: 'power2.in' },
        ],
      });

    default:
      return undefined;
  }
}
