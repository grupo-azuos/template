import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type * as EffectsModuleType from './use-effects';
import { detectLevel, effectsActions, useEffects } from './use-effects';

type EffectsModule = typeof EffectsModuleType;

function Probe() {
  const effects = useEffects();

  return (
    <button type="button" onClick={effects.actions.onToggle}>
      {effects.level}
    </button>
  );
}

describe('detectLevel', () => {
  // feliz
  /* Na dúvida é `full`: a medição corrige depois, se precisar. Começar no leve numa máquina boa
     entrega menos do que ela aguenta, e ninguém percebe que havia mais. */
  it('answers one of the two levels', () => {
    expect(['full', 'lite']).toContain(detectLevel());
  });
});

describe('useEffects', () => {
  // feliz
  it('writes the level on the html element, which is what the CSS reads', () => {
    render(<Probe />);

    expect(document.documentElement.getAttribute('data-effects')).toMatch(/^(full|lite)$/);
  });

  it('lets the person override what the system guessed', () => {
    render(<Probe />);
    const button = screen.getByRole('button');
    const before = button.textContent;

    act(() => button.click());

    expect(button.textContent).not.toBe(before);
    expect(document.documentElement.getAttribute('data-effects')).toBe(button.textContent);
  });

  // triste
  /* Quem já escolheu no botão NÃO é contrariado pela medição: a máquina pode engasgar, mas a escolha
     da pessoa continua valendo — do contrário o modo completo que ela ligou cairia sozinho e
     pareceria que o botão não funciona. */
  it('does not let a slow measurement override the person choice', () => {
    render(<Probe />);
    act(() => screen.getByRole('button').click());
    const chosen = screen.getByRole('button').textContent;

    act(() => {
      effectsActions.onFrameRateMeasured(5);
      effectsActions.onFrameRateMeasured(5);
    });

    expect(screen.getByRole('button').textContent).toBe(chosen);
  });
});

/* O nível detectado, as medições e a escolha vivem no escopo do MÓDULO: para exercitar o caminho
   em que "ninguém escolheu ainda", cada teste abaixo importa uma cópia nova do módulo, com o
   `localStorage` limpo — do contrário a escolha feita no teste anterior calaria a medição. */
describe('useEffects measuring the machine', () => {
  let queuedFrames: FrameRequestCallback[] = [];

  async function freshModule(chosen: 'full' | 'lite' | null = null): Promise<EffectsModule> {
    vi.resetModules();
    window.localStorage.removeItem('azuos-effects');
    if (chosen) window.localStorage.setItem('azuos-effects', chosen);

    return import('./use-effects');
  }

  /* Quadros sob controle: cada chamada entrega o tempo que o teste manda, e não o do relógio. */
  function runFrames(times: number[]) {
    for (const now of times) {
      const frame = queuedFrames.shift();
      if (!frame) throw new Error('no frame was scheduled');

      frame(now);
    }
  }

  beforeEach(() => {
    queuedFrames = [];
    /* O runner do CI tem 2 núcleos, e com isso o palpite já nasceria `lite`, sem medir nada. */
    vi.spyOn(navigator, 'hardwareConcurrency', 'get').mockReturnValue(8);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      queuedFrames.push(callback);

      return queuedFrames.length;
    });
    vi.spyOn(performance, 'now').mockReturnValue(0);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    window.localStorage.removeItem('azuos-effects');
  });

  // feliz
  it('counts the frames of an animation and keeps full while the machine keeps up', async () => {
    const { effectsActions } = await freshModule();

    effectsActions.onAnimationStart(100);
    /* 7 quadros em 100ms = 70 fps: a máquina acompanha. */
    runFrames([16, 32, 48, 64, 80, 96, 112]);

    expect(effectsActions.readLevel()).toBe('full');
    expect(queuedFrames).toHaveLength(0);
  });

  /* Uma medição ruim pode ser só a aba ocupada; DUAS seguidas é a máquina — e aí o nível cai
     sozinho, avisando quem está na tela. */
  it('drops to lite after two slow animations in a row and tells the screen', async () => {
    const { effectsActions, useEffects } = await freshModule();

    function FreshProbe() {
      const effects = useEffects();

      return <output>{`${effects.level}:${effects.isAutomatic ? 'auto' : 'chosen'}`}</output>;
    }

    render(<FreshProbe />);
    expect(screen.getByRole('status')).toHaveTextContent('full:auto');

    act(() => {
      effectsActions.onAnimationStart(100);
      /* 2 quadros em 100ms = 20 fps: travado. */
      runFrames([50, 100]);
      effectsActions.onAnimationStart(100);
      runFrames([50, 100]);
    });

    expect(screen.getByRole('status')).toHaveTextContent('lite:auto');
    expect(document.documentElement.getAttribute('data-effects')).toBe('lite');
    expect(effectsActions.readLevel()).toBe('lite');
  });

  it('forgets a single slow animation once a good one follows', async () => {
    const { effectsActions } = await freshModule();

    effectsActions.onFrameRateMeasured(10);
    effectsActions.onFrameRateMeasured(60);
    effectsActions.onFrameRateMeasured(10);

    expect(effectsActions.readLevel()).toBe('full');
  });

  // triste
  it('does not start a second measurement while one is running', async () => {
    const { effectsActions } = await freshModule();

    effectsActions.onAnimationStart(100);
    effectsActions.onAnimationStart(100);

    expect(queuedFrames).toHaveLength(1);
  });

  /* Depois de aprovada, a máquina para de ser medida: medir para sempre é gastar o que a medição
     existe para poupar. */
  it('stops measuring once the machine is approved', async () => {
    const { effectsActions } = await freshModule();

    for (let sample = 0; sample < 6; sample += 1) effectsActions.onFrameRateMeasured(60);
    effectsActions.onAnimationStart(100);

    expect(queuedFrames).toHaveLength(0);
  });

  it('does not measure once the level is already lite', async () => {
    const { effectsActions } = await freshModule();

    effectsActions.onFrameRateMeasured(5);
    effectsActions.onFrameRateMeasured(5);
    effectsActions.onAnimationStart(100);

    expect(effectsActions.readLevel()).toBe('lite');
    expect(queuedFrames).toHaveLength(0);
  });

  it('does not measure where animation frames do not exist', async () => {
    vi.stubGlobal('requestAnimationFrame', undefined);
    const { effectsActions } = await freshModule();

    expect(() => effectsActions.onAnimationStart(100)).not.toThrow();
  });

  it('does not measure after the person has chosen', async () => {
    const { effectsActions } = await freshModule('full');

    effectsActions.onAnimationStart(100);

    expect(queuedFrames).toHaveLength(0);
  });
});

describe('detectLevel guessing from the hardware', () => {
  async function freshModule(): Promise<EffectsModule> {
    vi.resetModules();
    window.localStorage.removeItem('azuos-effects');

    return import('./use-effects');
  }

  function stubRenderer(name: string | null) {
    const gl = {
      RENDERER: 'RENDERER',
      getExtension: () => ({ UNMASKED_RENDERER_WEBGL: 'UNMASKED' }),
      getParameter: () => name,
    };

    vi.stubGlobal(
      'OffscreenCanvas',
      class {
        getContext() {
          return name === null ? null : gl;
        }
      },
    );
  }

  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.removeItem('azuos-effects');
  });

  // feliz
  it('starts full on a machine with a real graphics card', async () => {
    stubRenderer('ANGLE (NVIDIA, Test GPU)');
    vi.stubGlobal('navigator', { hardwareConcurrency: 8 });
    const { detectLevel } = await freshModule();

    expect(detectLevel()).toBe('full');
  });

  // triste
  /* Desenho por software (acesso remoto, máquina virtual) é onde o preenchimento no hover
     engasga: começa no leve sem esperar a medição. */
  it('starts lite when the browser is drawing by software', async () => {
    stubRenderer('Google SwiftShader');
    const { detectLevel } = await freshModule();

    expect(detectLevel()).toBe('lite');
  });

  it('starts lite on a machine with very few cores', async () => {
    stubRenderer('ANGLE (NVIDIA, Test GPU)');
    vi.stubGlobal('navigator', { hardwareConcurrency: 2 });
    const { detectLevel } = await freshModule();

    expect(detectLevel()).toBe('lite');
  });

  it('starts lite on a machine with very little memory', async () => {
    stubRenderer('ANGLE (NVIDIA, Test GPU)');
    vi.stubGlobal('navigator', { hardwareConcurrency: 8, deviceMemory: 2 });
    const { detectLevel } = await freshModule();

    expect(detectLevel()).toBe('lite');
  });

  it('does not hold it against the machine when the renderer cannot be asked', async () => {
    stubRenderer(null);
    vi.stubGlobal('navigator', { hardwareConcurrency: 8 });
    const { detectLevel } = await freshModule();

    expect(detectLevel()).toBe('full');
  });

  it('treats a renderer that throws as unknown', async () => {
    vi.stubGlobal(
      'OffscreenCanvas',
      class {
        getContext(): never {
          throw new Error('webgl unavailable');
        }
      },
    );
    vi.stubGlobal('navigator', { hardwareConcurrency: 8 });
    const { detectLevel } = await freshModule();

    expect(detectLevel()).toBe('full');
  });
});
