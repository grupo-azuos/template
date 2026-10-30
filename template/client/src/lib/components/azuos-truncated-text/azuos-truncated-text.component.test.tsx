import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AzuosTruncatedText } from './azuos-truncated-text.component';

/* O jsdom não desenha: sem layout, toda caixa mede 0. O corte é simulado nas medidas. */
function fakeWidths(scrollWidth: number, clientWidth: number) {
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(scrollWidth);
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(clientWidth);
}

afterEach(() => vi.restoreAllMocks());

describe('AzuosTruncatedText', () => {
  // feliz
  it('shows the whole text in a tooltip when it was cut', async () => {
    fakeWidths(300, 100);
    render(
      <AzuosTruncatedText data={{ text: 'Reprovado - Triagem' }} ui={{ className: 'truncate' }} />,
    );

    await userEvent.hover(screen.getByText('Reprovado - Triagem'));

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Reprovado - Triagem');
  });

  it('shows what it is given in the cell', () => {
    render(
      <AzuosTruncatedText data={{ text: 'Aguardando' }}>
        <b>selo</b>
      </AzuosTruncatedText>,
    );

    expect(screen.getByText('selo')).toBeInTheDocument();
  });

  // triste
  it('opens no tooltip when the text fits', async () => {
    fakeWidths(80, 100);
    render(<AzuosTruncatedText data={{ text: 'Indeed' }} ui={{ className: 'truncate' }} />);

    await userEvent.hover(screen.getByText('Indeed'));

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
