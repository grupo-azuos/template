import { z } from 'zod';

/**
 * O ENDEREÇO DOS DOCUMENTOS — de sócio, da sede e da empresa nas declarações.
 *
 * Os campos vão separados, e não num texto só, porque cada documento escreve o endereço de um
 * jeito ("Rua X, Nº 10, ..., município de Goiânia/GO" no contrato; "Rua X, 10, Bairro Y" na
 * declaração), e montar a frase é trabalho do documento, não de quem digita.
 *
 * Nenhum campo é obrigatório aqui: o formulário mostra a prévia enquanto a pessoa preenche, e
 * a trava de "falta o endereço" é do documento que precisa dele.
 */
const text = z.string().trim().max(200).default('');

/** As 27 UFs, na ordem alfabética da sigla — a lista dos campos de UF. */
export const BRAZILIAN_STATES = [
  'AC',
  'AL',
  'AM',
  'AP',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MG',
  'MS',
  'MT',
  'PA',
  'PB',
  'PE',
  'PI',
  'PR',
  'RJ',
  'RN',
  'RO',
  'RR',
  'RS',
  'SC',
  'SE',
  'SP',
  'TO',
] as const;

export type BrazilianState = (typeof BRAZILIAN_STATES)[number];

/**
 * O nome de cada UF — para a busca do campo achar "goiás" além de "GO". A lista é daqui, e não
 * pedida ao `shared-api` (que publica `/states` para o seletor de município): ela VALIDA o
 * contrato, e a validação do Zod roda na hora, sem rede — e as 27 são fixas.
 */
export const BRAZILIAN_STATE_NAMES: Record<BrazilianState, string> = {
  AC: 'Acre',
  AL: 'Alagoas',
  AM: 'Amazonas',
  AP: 'Amapá',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MG: 'Minas Gerais',
  MS: 'Mato Grosso do Sul',
  MT: 'Mato Grosso',
  PA: 'Pará',
  PB: 'Paraíba',
  PE: 'Pernambuco',
  PI: 'Piauí',
  PR: 'Paraná',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RO: 'Rondônia',
  RR: 'Roraima',
  RS: 'Rio Grande do Sul',
  SC: 'Santa Catarina',
  SE: 'Sergipe',
  SP: 'São Paulo',
  TO: 'Tocantins',
};

/** UF: vazia, ou uma das 27 — "GOI" ou "XX" não chegam ao documento. */
export const brazilianStateSchema = z
  .string()
  .trim()
  .max(2)
  .transform((value) => value.toUpperCase())
  .refine(
    (value) => value === '' || (BRAZILIAN_STATES as readonly string[]).includes(value),
    'UF inválida',
  )
  .default('');

/** CEP: vazio, ou os 8 números (com ou sem a pontuação). */
export const zipCodeSchema = z
  .string()
  .trim()
  .max(10)
  .refine((value) => value === '' || value.replace(/\D/g, '').length === 8, 'O CEP tem 8 números')
  .default('');

export const postalAddressSchema = z.object({
  street: text,
  number: z.string().trim().max(20).default(''),
  complement: text,
  district: text,
  city: text,
  /** Sigla da UF, sempre em maiúscula ("GO"). */
  state: brazilianStateSchema,
  zipCode: zipCodeSchema,
});

export type PostalAddress = z.infer<typeof postalAddressSchema>;

/**
 * O endereço PELA METADE, para a prévia: CEP com 4 números ou UF com uma letra são alguém no
 * meio da digitação, e a prévia não pode recusar por isso. Só os tetos continuam.
 */
const lenient = (max: number) => z.string().trim().max(max).catch('').default('');

export const lenientPostalAddressSchema = z
  .object({
    street: lenient(200),
    number: lenient(20),
    complement: lenient(200),
    district: lenient(200),
    city: lenient(200),
    state: lenient(2),
    zipCode: lenient(10),
  })
  .catch({
    street: '',
    number: '',
    complement: '',
    district: '',
    city: '',
    state: '',
    zipCode: '',
  });

export const EMPTY_POSTAL_ADDRESS: PostalAddress = {
  street: '',
  number: '',
  complement: '',
  district: '',
  city: '',
  state: '',
  zipCode: '',
};
