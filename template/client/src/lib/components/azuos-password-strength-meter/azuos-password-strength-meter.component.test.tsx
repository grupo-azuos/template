import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { toPasswordStrength } from '../../view-models/password-strength.util';
import { AzuosPasswordStrengthMeter } from './azuos-password-strength-meter.component';

function renderFor(password: string) {
  return render(<AzuosPasswordStrengthMeter data={{ strength: toPasswordStrength(password) }} />);
}

describe('AzuosPasswordStrengthMeter', () => {
  it('names the level in words, and not only in colour', () => {
    renderFor('Chuva-De-Verao-2026!');

    expect(screen.getByText('Forte')).toBeInTheDocument();
  });

  it('shows a dash for a password that was not typed yet', () => {
    renderFor('');

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('lists every rule, met or not', () => {
    renderFor('abc');

    expect(screen.getByText('Pelo menos 12 caracteres')).toBeInTheDocument();
    expect(screen.getByText('Tem número')).toBeInTheDocument();
    expect(screen.getByText('Tem símbolo')).toBeInTheDocument();
    expect(screen.getByText('Tem maiúscula e minúscula')).toBeInTheDocument();
  });

  /* A cor não pode ser o único sinal: numa tela em preto e branco, ou para quem não separa
     vermelho de verde, "cumprido" e "falta" ficariam idênticos. */
  it('says in text which rules are met, for whoever does not see the colour', () => {
    renderFor('abacaxicomcaju');

    const met = screen.getByText('Pelo menos 12 caracteres').closest('li');
    const missing = screen.getByText('Tem número').closest('li');

    expect(met).toHaveTextContent('Cumprido:');
    expect(missing).toHaveTextContent('Falta:');
  });

  it('announces the level with its own label to a screen reader', () => {
    renderFor('Abacaxi123');

    expect(screen.getByText('Força da senha:')).toBeInTheDocument();
    expect(screen.getByText('Razoável')).toBeInTheDocument();
  });

  /* CAMINHO TRISTE: comprimento sozinho não é força, e a barra precisa dizer isso — senão
     uma senha longa e toda minúscula passa por boa. */
  it('calls a long lowercase password weak', () => {
    renderFor('abacaxicomcaju');

    expect(screen.getByText('Fraca')).toBeInTheDocument();
  });
});
