import { render, screen } from '@testing-library/react';
import { FileText } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { AzuosTimelineStep } from '../azuos-timeline-step/azuos-timeline-step.component';
import { AzuosTimeline } from './azuos-timeline.component';

describe('AzuosTimeline', () => {
  // feliz
  it('shows every step in the order it was given', () => {
    render(
      <AzuosTimeline>
        <AzuosTimelineStep data={{ title: 'Dados', icon: FileText }}>
          <p>primeiro</p>
        </AzuosTimelineStep>
        <AzuosTimelineStep data={{ title: 'Conferir', icon: FileText }} ui={{ isLast: true }}>
          <p>segundo</p>
        </AzuosTimelineStep>
      </AzuosTimeline>,
    );

    const headings = screen.getAllByRole('heading', { level: 3 });

    expect(headings.map((heading) => heading.textContent)).toEqual(['Dados', 'Conferir']);
  });

  // triste
  it('draws an empty column when there is no step', () => {
    const { container } = render(<AzuosTimeline>{null}</AzuosTimeline>);

    expect(container.firstElementChild?.className).toContain('flex-col');
    expect(container.firstElementChild?.children).toHaveLength(0);
  });
});
