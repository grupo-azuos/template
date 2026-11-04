import { render, screen } from '@testing-library/react';
import { Siren } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { themeColor } from '../../utils/theme-color.util';

import { AzuosStatusBadge } from './azuos-status-badge.component';

describe('AzuosStatusBadge', () => {
  // feliz
  it('shows the label', () => {
    render(<AzuosStatusBadge data={{ label: 'Em andamento' }} />);

    expect(screen.getByText('Em andamento')).toBeInTheDocument();
  });

  /* O token de estado, e não a paleta crua: `bg-emerald-100` escrito aqui não acompanharia a
     troca de tema, e no escuro o selo ficaria claro com texto claro. */
  it('paints the tone it was given, with the state token', () => {
    const { container } = render(
      <AzuosStatusBadge data={{ label: 'Concluída' }} ui={{ tone: 'success' }} />,
    );

    expect(container.firstElementChild?.className).toContain('bg-muted');
    expect(container.firstElementChild?.className).toContain('text-hue-green');
  });

  it('falls back to neutral when no tone was given, instead of having no color', () => {
    const { container } = render(<AzuosStatusBadge data={{ label: 'A fazer' }} />);

    expect(container.firstElementChild?.className).toContain('bg-muted');
  });

  // triste
  /* Um selo cinza escrito "—" faria parecer que alguém respondeu algo. */
  it('does not draw a badge for an empty status: says it was not filled', () => {
    render(<AzuosStatusBadge data={{ label: null }} />);

    expect(screen.getByText('Não preenchido')).toBeInTheDocument();
  });

  it('treats empty string and undefined as not filled', () => {
    const { rerender } = render(<AzuosStatusBadge data={{ label: '' }} />);
    expect(screen.getByText('Não preenchido')).toBeInTheDocument();

    rerender(<AzuosStatusBadge data={{ label: undefined }} />);
    expect(screen.getByText('Não preenchido')).toBeInTheDocument();
  });

  it('accepts an extra class without losing its own', () => {
    const { container } = render(
      <AzuosStatusBadge
        data={{ label: 'Concluída' }}
        ui={{ tone: 'success', className: 'ml-4' }}
      />,
    );

    expect(container.firstElementChild?.className).toContain('ml-4');
    expect(container.firstElementChild?.className).toContain('bg-muted');
  });

  // feliz
  /* Cor livre (a da etapa cadastrada pela pessoa): o fundo é a mesma cor diluída, para o texto
     continuar legível sem escolher uma segunda cor à mão. */
  it('turns a free colour into the nearest hue of the card palette, and draws the icon', () => {
    const color = themeColor('--primary');
    const { container } = render(
      <AzuosStatusBadge data={{ label: 'Triagem' }} ui={{ color, icon: Siren, size: 'sm' }} />,
    );

    const badge = container.firstElementChild as HTMLElement;
    expect(badge.className).toMatch(/text-hue-[a-z]+/);
    expect(badge.getAttribute('style')).toBeNull();
    expect(badge.querySelector('svg')).not.toBeNull();
  });

  // triste
  it('ignores an empty colour and draws no icon when none was given', () => {
    const { container } = render(
      <AzuosStatusBadge data={{ label: 'Triagem' }} ui={{ color: null }} />,
    );

    const badge = container.firstElementChild as HTMLElement;
    expect(badge.getAttribute('style')).toBeNull();
    expect(badge.querySelector('svg')).toBeNull();
  });
});
