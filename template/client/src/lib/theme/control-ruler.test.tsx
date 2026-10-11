import { render, screen } from '@testing-library/react';
import { type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosComboboxField } from '../components/azuos-combobox-field/azuos-combobox-field.component';
import { AzuosDatePicker } from '../components/azuos-date-picker/azuos-date-picker.component';
import { AzuosInputGroup } from '../components/azuos-input-group/azuos-input-group.component';
import { AzuosSelectField } from '../components/azuos-select-field/azuos-select-field.component';
import { AzuosTextAreaField } from '../components/azuos-text-area-field/azuos-text-area-field.component';
import { AzuosTextField } from '../components/azuos-text-field/azuos-text-field.component';

/**
 * A RÉGUA DOS CAMPOS, CONFERIDA NO RESULTADO.
 *
 * Todo campo de formulário e de filtro tem o canto `rounded-control` e a altura `control-lg`
 * (`tokens.css`). O `check:design` confere que a classe certa está ESCRITA no componente; este
 * teste confere que ela é a ÚNICA que sobra no elemento depois de montado.
 *
 * A diferença importa porque um campo montado sobre componente baixado (`lib/components/ui`)
 * herda o canto e a altura dele (`rounded-md`, `h-9`). Se o merge de classes não derrubar os dois,
 * o elemento fica com dois cantos e duas alturas e quem vence é o baixado: o código está certo e a
 * tela, errada. Só olhando o elemento pronto se pega isso.
 *
 * O jsdom não calcula CSS, então não há pixel para medir aqui. O que se confere é que não sobrou
 * nenhuma classe concorrente — que é a causa de o pixel sair errado.
 *
 * CAMPO NOVO ENTRA NA LISTA `FIELDS` LÁ EMBAIXO.
 */

const RADIUS = 'rounded-control';
const HEIGHT = 'control-lg';
/** A altura da régua escrita dentro de uma variante, para vencer a do componente baixado. */
const HEIGHT_IN_VARIANT = 'h-(--control-lg)';

/** Separa `data-[size=default]:h-9` em variantes e utilitário, sem cortar o `:` de dentro de `[]`. */
function splitVariants(token: string): { variants: string[]; utility: string } {
  const parts: string[] = [];
  let depth = 0;
  let current = '';

  for (const char of token) {
    if (char === '[' || char === '(') depth += 1;
    if (char === ']' || char === ')') depth -= 1;
    if (char === ':' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += char;
  }

  return { variants: parts, utility: current };
}

/**
 * Variante que não fala do campo em repouso, e por isso fica fora da conferência:
 * - mira um FILHO (`[&_svg]:size-4`, `*:flex`): é o tamanho do ícone, não o do campo;
 * - depende do que há DENTRO (`has-[>textarea]:h-auto`): é outro arranjo do componente baixado,
 *   que só liga quando o filho existe — e os nossos campos não montam esse filho.
 */
function isOutOfScope(variants: string[]): boolean {
  return variants.some(
    (variant) => variant.startsWith('[&') || variant.startsWith('*') || variant.startsWith('has-'),
  );
}

/**
 * Variante `data-[size=sm]:…` só vale quando o elemento TEM `data-size="sm"`. O gatilho do seletor
 * baixado carrega a altura dos dois tamanhos, e só a do tamanho montado disputa com a régua.
 */
function isInactiveDataVariant(variants: string[], element: HTMLElement): boolean {
  return variants.some((variant) => {
    const match = /^data-\[([a-z-]+)=([^\]]+)\]$/.exec(variant);
    if (!match) return false;

    return element.getAttribute(`data-${match[1]}`) !== match[2];
  });
}

function ownTokens(element: HTMLElement): { token: string; utility: string }[] {
  return element.className
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => ({ token, ...splitVariants(token) }))
    .filter(({ variants }) => !isOutOfScope(variants))
    .filter(({ variants }) => !isInactiveDataVariant(variants, element));
}

/** Todo canto do elemento que não é o `rounded-control` puro. */
function competingRadius(element: HTMLElement): string[] {
  return ownTokens(element)
    .filter(({ utility }) => /^rounded(-|$)/.test(utility))
    .filter(({ token }) => token !== RADIUS)
    .map(({ token }) => token);
}

/** Toda altura do elemento que não é a da régua. */
function competingHeight(element: HTMLElement): string[] {
  return ownTokens(element)
    .filter(({ utility }) => /^(h|size|control)-/.test(utility))
    .filter(({ token, utility }) => token !== HEIGHT && utility !== HEIGHT_IN_VARIANT)
    .map(({ token }) => token);
}

/** Um elemento solto, para provar que a conferência acusa o que deve. */
function elementWith(className: string, attributes: Record<string, string> = {}): HTMLElement {
  const element = document.createElement('div');
  element.className = className;
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);

  return element;
}

type Field = {
  name: string;
  element: ReactElement;
  find: () => HTMLElement;
  /** Área de texto: a altura é o número de linhas, então só o canto é conferido. */
  hasFreeHeight?: boolean;
};

const options = [
  { value: 'ana', label: 'Ana' },
  { value: 'bia', label: 'Bia' },
];

const FIELDS: Field[] = [
  {
    name: 'AzuosTextField',
    element: <AzuosTextField data={{ label: 'Nome', name: 'name', value: '' }} />,
    find: () => screen.getByRole('textbox', { name: 'Nome' }),
  },
  {
    name: 'AzuosSelectField',
    element: (
      <AzuosSelectField
        data={{ value: 'ana', options }}
        ui={{ ariaLabel: 'Responsável' }}
        actions={{ onChange: vi.fn() }}
      />
    ),
    find: () => screen.getByRole('combobox', { name: 'Responsável' }),
  },
  {
    name: 'AzuosComboboxField',
    element: (
      <AzuosComboboxField
        data={{ value: 'ana', options }}
        ui={{ ariaLabel: 'Etiqueta' }}
        actions={{ onChange: vi.fn() }}
      />
    ),
    find: () => screen.getByRole('combobox', { name: 'Etiqueta' }),
  },
  {
    name: 'AzuosDatePicker',
    element: (
      <AzuosDatePicker
        data={{ name: 'dueDate', value: null }}
        ui={{ ariaLabel: 'Prazo' }}
        actions={{ onChange: vi.fn() }}
      />
    ),
    find: () => screen.getByRole('button', { name: 'Prazo' }),
  },
  {
    name: 'AzuosInputGroup',
    element: <AzuosInputGroup data={{ label: 'Valor', name: 'amount', value: '' }} prefix="R$" />,
    /* O canto e a altura ficam na moldura em volta do texto, não no `<input>` de dentro. */
    find: () => {
      const frame = screen.getByRole('textbox', { name: 'Valor' }).closest('[data-slot="input-group"]');
      if (!(frame instanceof HTMLElement)) throw new Error('input group frame not found');

      return frame;
    },
  },
  {
    name: 'AzuosTextAreaField',
    element: <AzuosTextAreaField data={{ label: 'Observação', name: 'notes', value: '' }} />,
    find: () => screen.getByRole('textbox', { name: 'Observação' }),
    hasFreeHeight: true,
  },
];

describe('régua dos campos', () => {
  // feliz
  it.each(FIELDS)('$name sai com o canto de controle e nenhum outro', ({ element, find }) => {
    render(element);
    const field = find();

    expect(field).toHaveClass(RADIUS);
    expect(competingRadius(field)).toEqual([]);
  });

  // feliz
  it.each(FIELDS.filter((field) => !field.hasFreeHeight))(
    '$name sai com a altura da régua e nenhuma outra',
    ({ element, find }) => {
      render(element);
      const field = find();

      expect(field).toHaveClass(HEIGHT);
      expect(competingHeight(field)).toEqual([]);
    },
  );

  // triste
  it('acusa o canto do componente baixado que sobrou ao lado do nosso', () => {
    expect(competingRadius(elementWith('rounded-md border rounded-control'))).toEqual([
      'rounded-md',
    ]);
  });

  // triste
  it('acusa a altura solta que sobrou ao lado da régua', () => {
    expect(competingHeight(elementWith('h-9 control-lg'))).toEqual(['h-9']);
  });

  // triste
  it('acusa a altura que o componente baixado impõe pela variante que está ligada', () => {
    const trigger = elementWith('data-[size=default]:h-9 data-[size=sm]:h-8 control-lg', {
      'data-size': 'default',
    });

    expect(competingHeight(trigger)).toEqual(['data-[size=default]:h-9']);
  });

  // triste
  it('não confunde o tamanho do ícone de dentro com a altura do campo', () => {
    expect(competingHeight(elementWith("control-lg [&_svg:not([class*='size-'])]:size-4"))).toEqual(
      [],
    );
  });

  // triste
  it('não acusa o arranjo que só liga quando há um filho que o campo não monta', () => {
    expect(competingHeight(elementWith('control-lg has-[>textarea]:h-auto'))).toEqual([]);
  });
});
