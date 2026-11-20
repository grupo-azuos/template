import { describe, expect, it } from 'vitest';

import { EMPTY_POSTAL_ADDRESS } from '@template/shared/schemas/postal-address.schema';

import { completeCep, withCepAddress } from './cep-address.util';

// Endereço inventado.
const FOUND = {
  street: 'Rua das Acácias',
  district: 'Setor Exemplo',
  city: 'Goiânia',
  state: 'GO',
};

describe('withCepAddress', () => {
  // feliz
  it('replaces street, district, city and state, keeping number and complement', () => {
    const typed = {
      ...EMPTY_POSTAL_ADDRESS,
      street: 'Rua Velha',
      number: '10',
      complement: 'Qd 1',
      zipCode: '74000-000',
    };

    expect(withCepAddress(typed, FOUND)).toEqual({
      ...typed,
      street: 'Rua das Acácias',
      district: 'Setor Exemplo',
      city: 'Goiânia',
      state: 'GO',
    });
  });

  // triste
  it('keeps the typed street for a generic CEP, and ignores an odd state', () => {
    const typed = { ...EMPTY_POSTAL_ADDRESS, street: 'Rua Digitada', state: 'GO' };

    expect(
      withCepAddress(typed, { street: '', district: '', city: 'Cidade', state: 'XX' }),
    ).toMatchObject({
      street: 'Rua Digitada',
      city: 'Cidade',
      state: 'GO',
    });
  });
});

describe('completeCep', () => {
  // feliz
  it('turns a masked CEP into its 8 digits', () => {
    expect(completeCep('74.000-123')).toBe('74000123');
  });

  // triste
  it('does not look up a half CEP', () => {
    expect(completeCep('7400-0')).toBe('');
  });
});
