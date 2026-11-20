import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from './input-group';

/* O grupo inteiro e o adendo têm `role="group"`: o adendo é o que carrega o alinhamento. */
function addon(): HTMLElement {
  const found = document.querySelector('[data-slot="input-group-addon"]');
  if (!found) throw new Error('addon not rendered');

  return found as HTMLElement;
}

describe('InputGroup', () => {
  // feliz
  it('focuses the field when the addon is clicked', () => {
    render(
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>R$</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="Valor" />
      </InputGroup>,
    );

    fireEvent.click(screen.getByText('R$'));

    expect(screen.getByRole('textbox', { name: 'Valor' })).toHaveFocus();
    expect(addon()).toHaveAttribute('data-align', 'inline-start');
  });

  it.each(['inline-end', 'block-start', 'block-end'] as const)(
    'aligns the addon at the %s',
    (align) => {
      render(
        <InputGroup>
          <InputGroupTextarea aria-label="Texto" />
          <InputGroupAddon align={align}>
            <InputGroupButton size="icon-xs" aria-label="Enviar" />
          </InputGroupAddon>
        </InputGroup>,
      );

      expect(addon()).toHaveAttribute('data-align', align);
      expect(screen.getByRole('button', { name: 'Enviar' })).toHaveAttribute(
        'data-size',
        'icon-xs',
      );
    },
  );

  // triste
  /* Clicar no botão dentro do adendo é o clique do botão, não um pedido para focar o campo. */
  it('leaves the focus alone when a button inside the addon is clicked', () => {
    const onClick = vi.fn();
    render(
      <InputGroup>
        <InputGroupInput aria-label="Busca" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="sm" onClick={onClick}>
            Limpar
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Limpar' }));

    expect(onClick).toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: 'Busca' })).not.toHaveFocus();
  });
});
