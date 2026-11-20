import {
  BRAZILIAN_STATES,
  type PostalAddress,
} from '@template/shared/schemas/postal-address.schema';

import { type CepAddress } from '../api/cep.api';

/** O CEP completo (8 números) — só ele vale uma consulta. Incompleto volta vazio. */
export function completeCep(value: string): string {
  const digits = value.replace(/\D/g, '');

  return digits.length === 8 ? digits : '';
}

/**
 * O endereço com o que o CEP devolveu — como no Gestão RH: rua, bairro, cidade e UF passam a ser
 * os do CEP; número e complemento ficam como estão (o CEP não sabe deles, e apagar o que a pessoa
 * já digitou seria pior que não ajudar). CEP de rua genérica (cidade pequena) vem sem rua: aí a
 * rua digitada fica.
 */
export function withCepAddress(address: PostalAddress, found: CepAddress): PostalAddress {
  const state = (BRAZILIAN_STATES as readonly string[]).includes(found.state)
    ? found.state
    : address.state;

  return {
    ...address,
    street: found.street || address.street,
    district: found.district || address.district,
    city: found.city || address.city,
    state,
  };
}
