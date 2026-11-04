import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { AzuosTooltip, type AzuosTooltipProps } from './azuos-tooltip.component';

function renderTooltip(overrides: Partial<AzuosTooltipProps> = {}) {
  render(
    <AzuosTooltip data={{ content: 'O texto inteiro' }} {...overrides}>
      <button type="button">Gatilho</button>
    </AzuosTooltip>,
  );
}

describe('AzuosTooltip', () => {
  // feliz
  it('shows the full text when the mouse stays over the element', async () => {
    renderTooltip();

    await userEvent.hover(screen.getByRole('button', { name: 'Gatilho' }));

    expect(await screen.findByRole('tooltip')).toHaveTextContent('O texto inteiro');
  });

  it('shows the text for keyboard users too, when the element gets the focus', async () => {
    renderTooltip();

    await userEvent.tab();

    expect(await screen.findByRole('tooltip')).toHaveTextContent('O texto inteiro');
  });

  it('does not add a wrapper around the element: the trigger is the element itself', () => {
    renderTooltip();

    expect(screen.getByRole('button', { name: 'Gatilho' })).toHaveAttribute(
      'data-slot',
      'tooltip-trigger',
    );
  });

  // triste
  it('gives back the plain element, with no tooltip, when it is disabled', async () => {
    renderTooltip({ state: { isDisabled: true } });

    await userEvent.hover(screen.getByRole('button', { name: 'Gatilho' }));

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows nothing when there is no text, instead of an empty bubble', async () => {
    renderTooltip({ data: { content: '' } });

    await userEvent.hover(screen.getByRole('button', { name: 'Gatilho' }));

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
