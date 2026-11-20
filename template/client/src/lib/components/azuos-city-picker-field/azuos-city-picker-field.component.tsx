import { AzuosComboboxField } from '../azuos-combobox-field/azuos-combobox-field.component';

export type CityPickerCity = { id: string; name: string; state?: string | null };
export type CityPickerState = { abbreviation: string; name: string };

/**
 * A CIDADE ESCOLHIDA EM DOIS PASSOS: a UF, e depois um município DELA — pelo ID.
 *
 * Era um campo de nome livre, e foi ele que encheu o cadastro de "Maurilândia - GO" e
 * "Fortaleza/CE": a UF ia escrita dentro do nome, cada um de um jeito. Escolher a UF primeiro
 * reduz os 5.570 municípios do IBGE aos da UF, e o nome não é mais digitado — é escolhido.
 *
 * `inheritedCity` liga a opção de HERDAR (o alvará que é da cidade da empresa): ela é a primeira
 * do seletor de cidade e diz qual cidade é a herdada. Sem ela, o campo é a cidade da própria
 * empresa e começa vazio.
 *
 * A cidade gravada sempre entra na lista, mesmo fora da UF carregada: o seletor abrir sem o
 * valor atual faria um Salvar qualquer trocar a cidade sem ninguém ver.
 *
 * Função pura: a UF escolhida e as listas vêm de quem chama (`use-city-options.model`).
 */
export type AzuosCityPickerFieldProps = {
  data: {
    /** A UF escolhida. */
    state: string | null;
    /** O município escolhido; nulo é "nenhum" — ou HERDAR, quando há `inheritedCity`. */
    value: string | null;
    states: readonly CityPickerState[];
    /** Os municípios da UF escolhida. */
    cities: readonly CityPickerCity[];
    /** Liga a opção de herdar, com o nome da cidade herdada (`null`: a empresa não tem cidade). */
    inheritedCity?: string | null;
    /** Liga a opção "nenhuma" com este rótulo — o "Todas as cidades" de um filtro. */
    allLabel?: string;
    /** Com ele, a UF ganha uma opção vazia ("Todas as UFs") — é o que um FILTRO precisa para ser tirado. */
    allStatesLabel?: string;
    /** A cidade gravada, para entrar na lista mesmo que a UF dela não esteja carregada. */
    current?: CityPickerCity | null;
  };
  ui?: { id?: string; ariaLabel?: string; className?: string };
  state?: { isDisabled?: boolean; isLoading?: boolean };
  /* Sem "cadastrar município": UF e municípios são os do IBGE, mantidos pelo cadastro
     compartilhado. Quem não acha a cidade escreveu errado, não descobriu um município novo. */
  actions: {
    onStateChange: (state: string) => void;
    onChange: (cityId: string | null) => void;
  };
};

const INHERIT = '';

export function AzuosCityPickerField({ data, ui, state, actions }: AzuosCityPickerFieldProps) {
  const label = ui?.ariaLabel ?? 'Cidade do alvará';

  return (
    /* `translate="no"`: sigla de UF e nome de município são nomes próprios. Numa página que o
       navegador acha que é inglês, o tradutor trocava "GO" por "IR". */
    <div translate="no" className={`flex gap-2 ${ui?.className ?? ''}`}>
      <StateCombobox
        value={data.state}
        states={data.states}
        allLabel={data.allStatesLabel}
        label={label}
        isDisabled={!!state?.isDisabled}
        onChange={actions.onStateChange}
      />
      <CityCombobox
        data={data}
        id={ui?.id}
        label={label}
        state={{ isDisabled: !!state?.isDisabled, isLoading: !!state?.isLoading }}
        actions={{ onChange: actions.onChange }}
      />
    </div>
  );
}

function StateCombobox({
  value,
  states,
  allLabel,
  label,
  isDisabled,
  onChange,
}: {
  value: string | null;
  states: readonly CityPickerState[];
  allLabel?: string;
  label: string;
  isDisabled: boolean;
  onChange: (state: string) => void;
}) {
  return (
    <AzuosComboboxField
      data={{
        value: value ?? '',
        options: [...(allLabel ? [{ value: '', label: allLabel }] : []), ...stateOptions(states)],
      }}
      ui={{
        ariaLabel: `UF — ${label}`,
        placeholder: allLabel ?? 'UF',
        searchPlaceholder: 'Buscar UF...',
        emptyLabel: 'Nenhuma UF',
        /* "Todas as UFs" não cabe na largura de uma sigla: com ela, o piso de todo seletor (10rem);
           só com a sigla, a caixa pode ficar abaixo do piso, porque duas letras cabem em 6rem. */
        className: allLabel ? 'w-40 shrink-0' : 'w-24 min-w-24 shrink-0',
      }}
      state={{ isDisabled }}
      /* Sem a opção vazia, escolher "nada" não existe: UF é obrigatória onde o campo é dado. */
      actions={{ onChange: (uf) => (uf || allLabel) && onChange(uf) }}
    />
  );
}

function CityCombobox({
  data,
  id,
  label,
  state,
  actions,
}: {
  data: AzuosCityPickerFieldProps['data'];
  id?: string;
  label: string;
  state: { isDisabled: boolean; isLoading: boolean };
  actions: { onChange: (cityId: string | null) => void };
}) {
  const nullLabel = nullLabelOf(data);

  return (
    <AzuosComboboxField
      data={{
        value: data.value === null ? INHERIT : String(data.value),
        options: [
          ...(nullLabel ? [{ value: INHERIT, label: nullLabel }] : []),
          ...cityOptions(data.cities, data.current),
        ],
      }}
      ui={{
        id,
        ariaLabel: label,
        placeholder: nullLabel ?? cityPlaceholder(data.state),
        searchPlaceholder: 'Buscar município...',
        emptyLabel: emptyLabel(state.isLoading),
        /* O piso do seletor (10rem): "Todas as cidades" saía "Todas as ci…". */
        className: 'min-w-40 flex-1',
      }}
      /* Sem UF não há municípios para escolher — a não ser que exista a opção vazia. */
      state={{ isDisabled: state.isDisabled || (!data.state && !nullLabel) }}
      actions={{ onChange: (value) => actions.onChange(value === INHERIT ? null : value) }}
    />
  );
}

/** A opção vazia: "Todas as cidades" num filtro, ou "Mesma da empresa (…)" num alvará. */
function nullLabelOf(data: AzuosCityPickerFieldProps['data']): string | undefined {
  if (data.allLabel) return data.allLabel;
  if (data.inheritedCity === undefined) return undefined;

  return inheritLabel(data.inheritedCity);
}

function stateOptions(states: readonly CityPickerState[]): { value: string; label: string }[] {
  return states.map((uf) => ({ value: uf.abbreviation, label: uf.abbreviation }));
}

function emptyLabel(isLoading: boolean | undefined): string {
  return isLoading ? 'Carregando municípios…' : 'Nenhum município com esse nome';
}

function inheritLabel(city: string | null): string {
  return city ? `Mesma da empresa (${city})` : 'Mesma da empresa';
}

function cityPlaceholder(state: string | null): string {
  return state ? 'Escolha a cidade' : 'Escolha a UF primeiro';
}

function cityOptions(
  cities: readonly CityPickerCity[],
  current: CityPickerCity | null | undefined,
): { value: string; label: string }[] {
  const all = new Map(cities.map((city) => [city.id, city]));
  if (current) all.set(current.id, all.get(current.id) ?? current);

  return [...all.values()]
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    .map((city) => ({ value: String(city.id), label: city.name }));
}
