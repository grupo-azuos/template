import { describe, expect, it } from 'vitest';

import { cn } from './cn.util';

describe('cn', () => {
  // feliz
  it('o canto da casa derruba o canto do componente baixado', () => {
    expect(cn('rounded-md border', 'rounded-control')).toBe('border rounded-control');
  });

  // feliz
  it('os quatro papéis de canto são a mesma família', () => {
    expect(cn('rounded-surface', 'rounded-box')).toBe('rounded-box');
    expect(cn('rounded-lg', 'rounded-chip')).toBe('rounded-chip');
  });

  // feliz
  it('a altura da régua derruba a altura e o respiro lateral que vieram antes', () => {
    expect(cn('h-9 px-4 text-sm', 'control-lg')).toBe('text-sm control-lg');
  });

  // feliz
  it('um degrau da régua troca o outro', () => {
    expect(cn('control-lg', 'control-sm')).toBe('control-sm');
  });

  // feliz
  it('o degrau de ícone derruba altura, largura e tamanho que vieram antes', () => {
    expect(cn('size-9', 'control-icon-md')).toBe('control-icon-md');
    expect(cn('h-8 w-8', 'control-icon-sm')).toBe('control-icon-sm');
  });

  // feliz
  it('o respiro escrito depois da régua continua valendo', () => {
    expect(cn('control-lg', 'px-0!')).toBe('control-lg px-0!');
  });

  // triste
  it('não resolve altura imposta por variante: ela precisa ser vencida na mesma variante', () => {
    /* É o caso do `ui/select`: a altura dele vem como `data-[size=default]:h-9`, e uma classe sem
       variante não a derruba. Quem envolve tem de escrever a altura na mesma variante. */
    expect(cn('data-[size=default]:h-9', 'control-lg')).toBe('data-[size=default]:h-9 control-lg');
    expect(cn('data-[size=default]:h-9', 'data-[size=default]:h-(--control-lg)')).toBe(
      'data-[size=default]:h-(--control-lg)',
    );
  });

  // triste
  it('ignora valores vazios e falsos', () => {
    expect(cn('rounded-control', undefined, null, false, '')).toBe('rounded-control');
  });
});
