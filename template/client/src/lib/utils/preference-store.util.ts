/**
 * UMA PREFERÊNCIA DO SISTEMA INTEIRO — tema, nível de efeitos, modo de lista.
 *
 * Não é o estado de uma tela: é uma escolha da pessoa que vale em todas, sobrevive ao fechar o
 * navegador e tem UM valor só. Por isso o estado vive no escopo do MÓDULO (criado uma vez,
 * compartilhado por quem importar) e não dentro de um `useState` que cada tela copiaria — duas
 * cópias divergiriam no primeiro clique, e o botão do menu mostraria "claro" com a tela escura.
 *
 * A leitura acontece por `useSyncExternalStore`, que é a API do React para ler de uma fonte de
 * FORA dele (aqui, este módulo mais o `localStorage`). A alternativa — `useState` + `useEffect`
 * — renderiza uma vez errada e corrige depois, o que na troca de tema é um piscar branco.
 *
 * `window` é checado em toda função porque o Storybook e os testes montam componentes sem
 * navegador completo, e uma preferência que explode na importação derruba a suíte inteira.
 */

export type PreferenceStore<TValue> = {
  /** O valor que está valendo agora. */
  read: () => TValue;
  /** Grava, avisa quem está ouvindo e aplica o efeito colateral (o atributo no `<html>`). */
  write: (value: TValue) => void;
  /** Usado pelo `useSyncExternalStore`; devolve a função que cancela a inscrição. */
  subscribe: (onChange: () => void) => () => void;
};

export type PreferenceStoreOptions<TValue> = {
  /** A chave no `localStorage`. Em inglês, com o prefixo do sistema. */
  key: string;
  /** O valor inicial quando não há nada salvo — ou o salvo não é mais um valor válido. */
  fallback: () => TValue;
  /** Reconhece o que veio do `localStorage`; `null` quando não serve. */
  parse: (raw: string | null) => TValue | null;
  /**
   * O que fazer quando o valor muda — normalmente escrever um atributo no `<html>`, que é o
   * que o CSS lê. Roda também na criação, para a primeira pintura já sair certa.
   */
  apply?: (value: TValue) => void;
};

export function createPreferenceStore<TValue>(
  options: PreferenceStoreOptions<TValue>,
): PreferenceStore<TValue> {
  const listeners = new Set<() => void>();
  let current = loadInitial(options);

  options.apply?.(current);

  return {
    read: () => current,

    write: (value: TValue) => {
      current = value;
      save(options.key, value);
      options.apply?.(value);
      /* Uma cópia do conjunto: um ouvinte que se cancelasse durante o aviso mudaria o conjunto
         no meio da volta, e o próximo seria pulado sem ninguém notar. */
      for (const listener of [...listeners]) listener();
    },

    subscribe: (onChange: () => void) => {
      listeners.add(onChange);

      return () => listeners.delete(onChange);
    },
  };
}

function loadInitial<TValue>(options: PreferenceStoreOptions<TValue>): TValue {
  if (typeof window === 'undefined') return options.fallback();

  /* `localStorage` lança em janela privada e com cookies de site bloqueados — e uma preferência
     que não pode ser lida é uma preferência ausente, não uma tela quebrada. */
  try {
    return options.parse(window.localStorage.getItem(options.key)) ?? options.fallback();
  } catch {
    return options.fallback();
  }
}

function save<TValue>(key: string, value: TValue): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    /* Gravação recusada (janela privada, cota cheia): a escolha vale nesta sessão e não
       sobrevive ao fechar o navegador. É melhor que recusar o clique. */
  }
}
