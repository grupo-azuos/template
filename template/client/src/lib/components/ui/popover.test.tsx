import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from './popover';

describe('Popover', () => {
  // feliz
  it('opens from the trigger with a header, a title and a description', () => {
    const onOpenChange = vi.fn();
    render(
      <Popover onOpenChange={onOpenChange}>
        <PopoverAnchor>
          <span>âncora</span>
        </PopoverAnchor>
        <PopoverTrigger>Filtros</PopoverTrigger>
        <PopoverContent align="start" sideOffset={8}>
          <PopoverHeader>
            <PopoverTitle>Filtrar</PopoverTitle>
            <PopoverDescription>Escolha o período.</PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }));

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.getByText('Filtrar')).toHaveAttribute('data-slot', 'popover-title');
    expect(screen.getByText('Escolha o período.')).toHaveAttribute(
      'data-slot',
      'popover-description',
    );
    expect(screen.getByText('Filtrar').parentElement).toHaveAttribute(
      'data-slot',
      'popover-header',
    );
  });

  // triste
  it('shows nothing while closed', () => {
    render(
      <Popover>
        <PopoverTrigger>Filtros</PopoverTrigger>
        <PopoverContent>conteúdo</PopoverContent>
      </Popover>,
    );

    expect(screen.queryByText('conteúdo')).not.toBeInTheDocument();
  });
});
