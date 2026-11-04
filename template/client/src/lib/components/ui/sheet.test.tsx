import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './sheet';

describe('Sheet', () => {
  // feliz
  it('opens from the trigger and closes from its own buttons', () => {
    const onOpenChange = vi.fn();
    render(
      <Sheet onOpenChange={onOpenChange}>
        <SheetTrigger>Abrir</SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription>Refine a lista.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose>Pronto</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('dialog', { name: 'Filtros' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Pronto' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it.each(['top', 'right', 'bottom', 'left'] as const)('slides in from the %s', (side) => {
    render(
      <Sheet open>
        <SheetContent side={side}>
          <SheetTitle>Menu</SheetTitle>
        </SheetContent>
      </Sheet>,
    );

    expect(screen.getByRole('dialog', { name: 'Menu' })).toBeInTheDocument();
  });

  // triste
  it('can hide the close button when the screen offers its own', () => {
    render(
      <Sheet open>
        <SheetContent showCloseButton={false}>
          <SheetTitle>Menu</SheetTitle>
        </SheetContent>
      </Sheet>,
    );

    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });
});
