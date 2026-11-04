import { describe, expect, it } from 'vitest';

import {
  formatTaxId,
  handleTaxIdInput,
  isValidTaxId,
  maskTaxId,
  normalizeTaxId,
  taxIdCheckDigits,
} from './tax-id.util';

describe('tax-id.util', () => {
  // feliz
  it('validates and formats a numeric and an alphanumeric CNPJ', () => {
    expect(normalizeTaxId('11.222.333/0001-81')).toBe('11222333000181');
    expect(taxIdCheckDigits('112223330001')).toBe('81');
    expect(isValidTaxId('11.222.333/0001-81')).toBe(true);
    expect(formatTaxId('11222333000181')).toBe('11.222.333/0001-81');
    expect(maskTaxId('112223')).toBe('11.222.3');
    const base = '12ABC34501DE';
    expect(isValidTaxId(`${base}${taxIdCheckDigits(base)}`)).toBe(true);
  });

  // feliz
  it('masks what is typed and says when it is complete', () => {
    const result = handleTaxIdInput({ value: '11222333000181' });

    expect(result.value).toBe('11.222.333/0001-81');
    expect(result.isComplete).toBe(true);
    expect(result.isValid).toBe(true);
  });

  // triste
  it('refuses a wrong check digit, a short value and nothing at all', () => {
    expect(isValidTaxId('11.222.333/0001-82')).toBe(false);
    expect(isValidTaxId('11222333')).toBe(false);
    expect(isValidTaxId(null)).toBe(false);
    expect(handleTaxIdInput({ value: '1122' }).isComplete).toBe(false);
  });

  // feliz
  /* Resto menor que 2 vira dígito 0 — a regra da Receita, e a que mais se erra ao copiar. */
  it('writes a zero check digit when the remainder is below two', () => {
    expect(taxIdCheckDigits('000000070001')).toBe('03');
    expect(isValidTaxId('00.000.007/0001-03')).toBe(true);
  });

  it('masks a partial value piece by piece while it is typed', () => {
    expect(maskTaxId('1')).toBe('1');
    expect(maskTaxId('112')).toBe('11.2');
    expect(maskTaxId('11222333')).toBe('11.222.333');
    expect(maskTaxId('112223330001')).toBe('11.222.333/0001');
    expect(maskTaxId('1122233300018199')).toBe('11.222.333/0001-81');
  });

  // triste
  it('gives no check digits for a base of the wrong size', () => {
    expect(taxIdCheckDigits('1122')).toBe('');
    expect(taxIdCheckDigits('')).toBe('');
  });

  it('refuses letters in the check digits and a value made of one repeated character', () => {
    expect(isValidTaxId('12ABC34501DEAB')).toBe(false);
    expect(isValidTaxId('11111111111111')).toBe(false);
  });

  it('returns what it got when there is nothing to format', () => {
    expect(formatTaxId('1122')).toBe('1122');
    expect(formatTaxId(null)).toBe('');
    expect(formatTaxId(undefined)).toBe('');
  });
});
