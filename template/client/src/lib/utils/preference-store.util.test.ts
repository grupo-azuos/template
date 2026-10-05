import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createPreferenceStore } from './preference-store.util';

type Size = 'small' | 'large';

function sizeStore(key: string) {
  const applied: Size[] = [];

  const store = createPreferenceStore<Size>({
    key,
    fallback: () => 'small',
    parse: (raw) => (raw === 'small' || raw === 'large' ? raw : null),
    apply: (value) => applied.push(value),
  });

  return { store, applied };
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('createPreferenceStore', () => {
  // feliz
  it('starts from what was saved in the browser', () => {
    window.localStorage.setItem('size-saved', 'large');

    expect(sizeStore('size-saved').store.read()).toBe('large');
  });

  it('writes, saves and tells the listeners', () => {
    const { store } = sizeStore('size-write');
    const listener = vi.fn();
    store.subscribe(listener);

    store.write('large');

    expect(store.read()).toBe('large');
    expect(window.localStorage.getItem('size-write')).toBe('large');
    expect(listener).toHaveBeenCalledOnce();
  });

  /* O efeito colateral roda na CRIAÇÃO também: é o que faz a primeira pintura já sair certa, em vez
     de a tela nascer no tema claro e trocar para o escuro um quadro depois. */
  it('applies the value once at creation, so the first paint is already right', () => {
    window.localStorage.setItem('size-apply', 'large');

    expect(sizeStore('size-apply').applied).toEqual(['large']);
  });

  it('stops telling a listener that cancelled', () => {
    const { store } = sizeStore('size-cancel');
    const listener = vi.fn();
    const cancel = store.subscribe(listener);

    cancel();
    store.write('large');

    expect(listener).not.toHaveBeenCalled();
  });

  // triste
  it('falls back when nothing was saved', () => {
    expect(sizeStore('size-empty').store.read()).toBe('small');
  });

  /* Valor salvo que não vale mais acontece quando uma opção é renomeada numa versão nova: a
     preferência antiga continua gravada no navegador de quem já usava o sistema. */
  it('falls back when what was saved is no longer a valid value', () => {
    window.localStorage.setItem('size-stale', 'huge');

    expect(sizeStore('size-stale').store.read()).toBe('small');
  });

  /* `localStorage` lança em janela privada e com dados de site bloqueados. Preferência que não pode
     ser lida é preferência ausente, não uma tela quebrada. */
  it('survives a browser that refuses to read storage', () => {
    const getItem = vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });

    expect(sizeStore('size-blocked').store.read()).toBe('small');

    getItem.mockRestore();
  });

  it('survives a browser that refuses to write, keeping the choice for this session', () => {
    const setItem = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('cota cheia');
    });
    const { store } = sizeStore('size-readonly');

    store.write('large');

    expect(store.read()).toBe('large');

    setItem.mockRestore();
  });
});
