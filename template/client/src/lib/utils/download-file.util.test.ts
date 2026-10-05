import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { triggerBrowserDownload } from './download-file.util';

const createObjectURL = vi.fn(() => 'blob:fake');
const revokeObjectURL = vi.fn();

beforeEach(() => {
  createObjectURL.mockClear();
  revokeObjectURL.mockClear();
  vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('triggerBrowserDownload', () => {
  // feliz
  it('hands the file to the browser with the name it should be saved as', () => {
    const clicks: string[] = [];
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicks.push(this.download);
    });

    triggerBrowserDownload(new Blob(['x']), 'tarefas.csv');

    expect(clicks).toEqual(['tarefas.csv']);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake');

    click.mockRestore();
  });

  // triste
  /**
   * `createObjectURL` prende o arquivo inteiro na memória do navegador até alguém desfazer o
   * endereço. Sem a limpeza no `finally`, um clique que explodisse — bloqueador de pop-up, extensão,
   * navegador antigo — deixaria o relatório preso ali e um link morto pendurado na página, a cada
   * tentativa, e a aba iria engordando sem nada na tela explicando por quê.
   */
  it('cleans up even when the click itself fails', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
      throw new Error('bloqueado');
    });

    expect(() => triggerBrowserDownload(new Blob(['x']), 'tarefas.csv')).toThrow('bloqueado');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake');
    expect(document.querySelector('a[download]')).not.toBeInTheDocument();

    click.mockRestore();
  });
});
