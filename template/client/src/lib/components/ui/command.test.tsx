import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from './command';

function Palette({ onSelect = vi.fn() }: { onSelect?: (value: string) => void }) {
  return (
    <Command>
      <CommandInput placeholder="Buscar comando" />
      <CommandList>
        <CommandEmpty>Nada encontrado.</CommandEmpty>
        <CommandGroup heading="Tarefas">
          <CommandItem value="nova" onSelect={onSelect}>
            Nova tarefa
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Ajuda">
          <CommandItem value="atalhos">Atalhos</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

describe('Command', () => {
  // feliz
  it('lists the groups and selects an item', () => {
    const onSelect = vi.fn();
    render(<Palette onSelect={onSelect} />);

    expect(screen.getByText('Tarefas')).toBeInTheDocument();
    expect(screen.getByText('⌘N')).toHaveAttribute('data-slot', 'command-shortcut');
    fireEvent.click(screen.getByText('Nova tarefa'));

    expect(onSelect).toHaveBeenCalledWith('nova');
  });

  it('opens as a dialog with a hidden title for the screen reader', () => {
    render(
      <CommandDialog open title="Paleta" description="Comandos do sistema" showCloseButton={false}>
        <CommandInput placeholder="Buscar" />
        <CommandList>
          <CommandItem>Um</CommandItem>
        </CommandList>
      </CommandDialog>,
    );

    expect(screen.getByRole('dialog', { name: 'Paleta' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });

  // triste
  it('says nothing was found when the search misses', () => {
    render(<Palette />);

    fireEvent.change(screen.getByPlaceholderText('Buscar comando'), { target: { value: 'zzz' } });

    expect(screen.getByText('Nada encontrado.')).toBeInTheDocument();
  });
});
