import { render, screen } from '@testing-library/react';
import { FileText } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { AzuosTimelineStep } from './azuos-timeline-step.component';

describe('AzuosTimelineStep', () => {
  // feliz
  it('shows the title as a heading, the description and the content', () => {
    render(
      <AzuosTimelineStep
        data={{ title: 'Dados', description: 'Título e descrição', icon: FileText }}
      >
        <p>os campos</p>
      </AzuosTimelineStep>,
    );

    expect(screen.getByRole('heading', { level: 3, name: 'Dados' })).toBeInTheDocument();
    expect(screen.getByText('Título e descrição')).toBeInTheDocument();
    expect(screen.getByText('os campos')).toBeInTheDocument();
  });

  // triste
  /* A última etapa não tem linha: um traço saindo dela aponta para um lugar que não existe. */
  it('draws no connecting line on the last step', () => {
    const { container } = render(
      <AzuosTimelineStep data={{ title: 'Conferir', icon: FileText }} ui={{ isLast: true }}>
        <p>o resumo</p>
      </AzuosTimelineStep>,
    );

    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
  });

  it('draws the line on a step that is not the last', () => {
    const { container } = render(
      <AzuosTimelineStep data={{ title: 'Dados', icon: FileText }}>
        <p>os campos</p>
      </AzuosTimelineStep>,
    );

    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
  });

  it('draws no description paragraph when there is no description', () => {
    render(
      <AzuosTimelineStep data={{ title: 'Dados', icon: FileText }}>
        <p>os campos</p>
      </AzuosTimelineStep>,
    );

    expect(screen.getAllByText(/./, { selector: 'p' })).toHaveLength(1);
  });
});
