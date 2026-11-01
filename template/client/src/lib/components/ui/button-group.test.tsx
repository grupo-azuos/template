import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from './button';
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText, buttonGroupVariants } from './button-group';

describe('ButtonGroup', () => {
  // feliz
  it('groups the buttons side by side with a separator and a text', () => {
    render(
      <ButtonGroup orientation="horizontal" aria-label="Paginação">
        <Button>Anterior</Button>
        <ButtonGroupSeparator />
        <ButtonGroupText>1 de 3</ButtonGroupText>
        <Button>Próxima</Button>
      </ButtonGroup>,
    );

    const group = screen.getByRole('group', { name: 'Paginação' });
    expect(group).toHaveAttribute('data-orientation', 'horizontal');
    expect(group.className).toBe(buttonGroupVariants({ orientation: 'horizontal' }));
    expect(group.querySelector('[data-slot="button-group-separator"]')).toHaveAttribute(
      'data-orientation',
      'vertical',
    );
    expect(screen.getByText('1 de 3')).toBeInTheDocument();
  });

  it('stacks vertically and lends the text look to a label', () => {
    render(
      <ButtonGroup orientation="vertical" aria-label="Ações">
        <ButtonGroupText asChild>
          <label htmlFor="q">Buscar</label>
        </ButtonGroupText>
        <ButtonGroupSeparator orientation="horizontal" />
      </ButtonGroup>,
    );

    expect(screen.getByRole('group', { name: 'Ações' })).toHaveAttribute('data-orientation', 'vertical');
    expect(screen.getByText('Buscar').tagName).toBe('LABEL');
  });

  // triste
  it('renders an empty group without failing', () => {
    render(<ButtonGroup aria-label="Vazio" />);

    expect(screen.getByRole('group', { name: 'Vazio' })).toBeEmptyDOMElement();
  });
});
