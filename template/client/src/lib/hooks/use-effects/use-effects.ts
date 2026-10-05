import { useSyncExternalStore } from 'react';

import { createPreferenceStore } from '../../utils/preference-store.util';

/**
 * O NÍVEL DE EFEITOS VISUAIS do sistema: `full` (animações completas) ou `lite` (o mesmo
 * resultado, sem a animação). Existe para a tela se ajustar à máquina, como um aplicativo de
 * desktop faz — o preenchimento no hover que é liso num PC com placa de vídeo engasga num acesso
 * remoto ou numa máquina virtual, e ali ele vira uma troca de cor simples.
 *
 * Como o tema (`lib/theme`), é uma preferência do sistema inteiro: o valor vai para o `<html>` em
 * `data-effects`, que é o que o CSS lê (`lib/theme/tokens.css`).
 *
 * Quem decide, em ordem:
 *  1. a escolha da pessoa (o botão de efeitos do menu), se ela já escolheu — nunca erra;
 *  2. a MEDIÇÃO: se as animações de verdade estão saindo travadas, cai para `lite`;
 *  3. o palpite da abertura: sem aceleração de vídeo, ou máquina muito modesta, começa em `lite`.
 *
 * "Reduzir movimento" do sistema operacional e tela de toque são tratados no próprio CSS.
 */

export type EffectsLevel = 'full' | 'lite';

const STORAGE_KEY = 'azuos-effects';

/** Abaixo disto, a animação já parece travada a olho. */
const SLOW_FPS = 30;
/** Uma medição ruim pode ser só a aba ocupada com outra coisa; duas seguidas é a máquina. */
const SLOW_SAMPLES_TO_DOWNGRADE = 2;
/** Depois de tantas medições boas, a máquina está aprovada: para de medir. */
const MAX_SAMPLES = 6;

/** Nomes que o navegador dá ao desenho POR SOFTWARE, quando não há placa de vídeo em uso. */
const SOFTWARE_RENDERERS = /swiftshader|llvmpipe|software|basic render/i;

/** O nome de quem desenha a tela, ou `null` onde não dá para perguntar. */
function rendererName(): string | null {
  if (typeof OffscreenCanvas === 'undefined') return null;

  try {
    const gl = new OffscreenCanvas(1, 1).getContext('webgl');
    if (!gl) return null;

    const info = gl.getExtension('WEBGL_debug_renderer_info');

    return String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
  } catch {
    return null;
  }
}

/** O palpite da abertura. Na dúvida é `full`: a medição corrige depois, se precisar. */
export function detectLevel(): EffectsLevel {
  if (typeof navigator === 'undefined') return 'full';

  const renderer = rendererName();
  if (renderer && SOFTWARE_RENDERERS.test(renderer)) return 'lite';

  if ((navigator.hardwareConcurrency ?? 8) <= 2) return 'lite';

  /* Só existe no Chrome e no Edge, e vem arredondado; onde não existe, não conta contra. */
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (memory !== undefined && memory <= 2) return 'lite';

  return 'full';
}

/**
 * A escolha da pessoa é um valor à parte do nível detectado: `null` significa "ninguém escolheu,
 * o sistema está decidindo". Guardar só o nível final apagaria essa diferença — e a medição
 * passaria a contrariar quem já tinha clicado no botão.
 */
const chosen = createPreferenceStore<EffectsLevel | null>({
  key: STORAGE_KEY,
  fallback: () => null,
  parse: (raw) => (raw === 'full' || raw === 'lite' ? raw : null),
});

let detected: EffectsLevel = detectLevel();
const detectedListeners = new Set<() => void>();

function currentLevel(): EffectsLevel {
  return chosen.read() ?? detected;
}

function apply(level: EffectsLevel): void {
  if (typeof document === 'undefined') return;

  document.documentElement.setAttribute('data-effects', level);
}

apply(currentLevel());

/** Os dois lados (escolha e detecção) acordam quem está ouvindo; a tela lê o nível resultante. */
function subscribe(onChange: () => void): () => void {
  const cancelChosen = chosen.subscribe(onChange);
  detectedListeners.add(onChange);

  return () => {
    cancelChosen();
    detectedListeners.delete(onChange);
  };
}

let samples = 0;
let slowSamples = 0;
let isSampling = false;

/** Conta os quadros que a máquina entrega enquanto uma animação de `durationMs` acontece. */
function sampleFrames(durationMs: number): void {
  if (chosen.read() !== null || detected === 'lite') return;
  if (isSampling || samples >= MAX_SAMPLES) return;
  if (typeof requestAnimationFrame === 'undefined') return;

  isSampling = true;
  const start = performance.now();
  let frames = 0;

  const tick = (now: number) => {
    frames += 1;
    if (now - start < durationMs) {
      requestAnimationFrame(tick);

      return;
    }

    isSampling = false;
    recordSample((frames * 1000) / (now - start));
  };

  requestAnimationFrame(tick);
}

function recordSample(fps: number): void {
  samples += 1;
  slowSamples = fps < SLOW_FPS ? slowSamples + 1 : 0;
  if (slowSamples < SLOW_SAMPLES_TO_DOWNGRADE) return;

  /* Quem já escolheu no botão não é contrariado pela medição. */
  if (chosen.read() !== null) return;

  detected = 'lite';
  apply('lite');
  for (const listener of [...detectedListeners]) listener();
}

export type EffectsModel = {
  /** O nível que está valendo agora. */
  level: EffectsLevel;
  /** `true` enquanto ninguém escolheu no botão: o sistema está decidindo sozinho. */
  isAutomatic: boolean;
  actions: {
    onToggle: () => void;
    /** Chamado por quem começa uma animação, para a máquina ser medida durante ela. */
    onAnimationStart: (durationMs: number) => void;
    /** Para quem já mediu por conta própria (e para os testes). */
    onFrameRateMeasured: (fps: number) => void;
  };
};

export function useEffects(): EffectsModel {
  const level = useSyncExternalStore(subscribe, currentLevel, () => 'full' as const);
  const isAutomatic = useSyncExternalStore(
    subscribe,
    () => chosen.read() === null,
    () => true,
  );

  return {
    level,
    isAutomatic,
    actions: {
      onToggle: () => {
        const next: EffectsLevel = currentLevel() === 'full' ? 'lite' : 'full';
        chosen.write(next);
        apply(next);
      },
      onAnimationStart: sampleFrames,
      onFrameRateMeasured: recordSample,
    },
  };
}

/** Para quem precisa medir fora de um componente (o preenchimento no hover, por exemplo). */
export const effectsActions = {
  onAnimationStart: sampleFrames,
  onFrameRateMeasured: recordSample,
  readLevel: currentLevel,
};
