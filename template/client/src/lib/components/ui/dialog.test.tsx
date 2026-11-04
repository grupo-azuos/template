import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';

describe('Dialog', () => {
  // feliz
  it('opens from the trigger and closes from its own button', () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog onOpenChange={onOpenChange}>
        <DialogTrigger>Excluir</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir tarefa?</DialogTitle>
            <DialogDescription>Não dá para desfazer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose>Cancelar</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('dialog', { name: 'Excluir tarefa?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  // triste
  it('can hide the corner close button', () => {
    render(
      <Dialog open>
        <DialogContent showCloseButton={false}>
          <DialogTitle>Aguarde</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });
});
