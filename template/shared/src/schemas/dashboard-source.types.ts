/**
 * O FORMATO DE UMA FONTE DE DADOS DO DASHBOARD — parte do MOTOR, igual em todo sistema do grupo.
 *
 * Quem monta um projeto não mexe aqui: declara as fontes DELE em `dashboard-sources.ts`, neste
 * formato. O motor (contrato, servidor e tela) só conhece estes tipos.
 */
export type DataFieldType = 'enum' | 'text' | 'date' | 'boolean';

export type DataField = {
  label: string;
  type: DataFieldType;
  /** As opções de um campo `enum` — o que o construtor de filtro oferece. */
  options?: readonly string[];
  /** O texto de tela de cada opção: a chave é o valor gravado, a tela mostra o rótulo. */
  optionLabels?: Readonly<Record<string, string>>;
  /** O campo guarda uma pessoa: o filtro escolhe da lista de pessoas e aceita "eu". */
  isPerson?: boolean;
};

/** Como um bloco agrupa: por categoria (barra, rosca, lista) ou no tempo (área, calendário). */
export type DataDimension = { label: string; kind: 'category' | 'day' | 'month' };

export type DataSource = {
  label: string;
  /** O que se conta, no plural: "tarefas". */
  noun: string;
  fields: Record<string, DataField>;
  dimensions: Record<string, DataDimension>;
};

/**
 * Um filtro de campo do painel: um valor escolhido vira "campo = valor" em cada bloco cuja fonte
 * tem o campo. `fields` diz qual campo é em cada fonte; nas outras, o filtro não vale.
 */
export type BoardFieldFilter = {
  label: string;
  fields: Record<string, string>;
};
