/** O endereço que o CEP sabe: rua, bairro, cidade e UF — número e complemento ele não sabe. */
export type CepAddress = { street: string; district: string; city: string; state: string };

type ViaCepBody = {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean | string;
};

/**
 * A CONSULTA DE CEP — a mesma do Gestão RH: o serviço público ViaCEP, chamado direto do navegador.
 *
 * Direto, e não pela nossa API, porque endereço não é dado sigiloso, e passar pelo servidor só
 * seria um caminho a mais para falhar com a mesma internet.
 *
 * Três respostas, de propósito: o endereço; `null` quando o CEP não existe; e erro quando não deu
 * para perguntar (sem internet, serviço fora). "Não existe" e "não consegui consultar" pedem
 * coisas diferentes de quem está preenchendo.
 */
export const cepApi = {
  lookup: async (cep: string): Promise<CepAddress | null> => {
    const response = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`);
    if (!response.ok) throw new Error(`CEP lookup failed with status ${response.status}`);

    const body = (await response.json()) as ViaCepBody;
    if (body.erro) return null;

    return {
      street: body.logradouro ?? '',
      district: body.bairro ?? '',
      city: body.localidade ?? '',
      state: body.uf ?? '',
    };
  },
};
