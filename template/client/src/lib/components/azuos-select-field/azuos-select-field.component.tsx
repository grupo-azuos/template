import { type LucideIcon } from 'lucide-react';

import { cn } from '../../utils/cn.util';
import { Select, SelectContent, SelectItem, SelectTrigger } from '../ui/select';

/**
 * Campo de seleção — o mesmo em filtro e em formulário.
 *
 * O `EMPTY_VALUE` abaixo resolve um conflito entre duas regras: para o sistema, "nenhum filtro" é a
 * string vazia; para o componente baixado, valor vazio significa "nada selecionado", e ele então
 * mostra o placeholder em vez da opção "Todos". Traduzir a string vazia para uma sentinela na
 * entrada e de volta na saída mantém a opção visível sem contaminar o contrato de quem usa o campo,
 * que continua recebendo `''`.
 */
/** `icon` é opcional: um desenho na frente do texto, no gatilho e em cada linha da lista. */
export type AzuosSelectFieldOption = { value: string; label: string; icon?: LucideIcon };

export type AzuosSelectFieldProps = {
  data: { value: string; options: AzuosSelectFieldOption[] };
  ui?: { placeholder?: string; ariaLabel?: string; className?: string };
  state?: { isDisabled?: boolean };
  actions: { onChange: (value: string) => void };
};

const EMPTY_VALUE = '__empty__';

export function AzuosSelectField({ data, ui, state, actions }: AzuosSelectFieldProps) {
  const selectedValue = data.value === '' ? EMPTY_VALUE : data.value;

  /**
   * O RÓTULO DO VALOR ESCOLHIDO, resolvido aqui.
   *
   * O `SelectValue` do componente baixado resolve o rótulo a partir das opções que já foram
   * montadas — e elas só montam quando a lista abre. Antes disso ele mostrava o valor cru: a tela
   * nascia escrevendo "in_progress" no lugar de "Em andamento", e o texto só virava português
   * depois que a pessoa abrisse a lista.
   *
   * Procurar na própria lista de opções não depende de nada ter sido montado, então o rótulo certo
   * aparece já na primeira pintura.
   */
  const selectedOption = data.options.find(
    (option) => (option.value || EMPTY_VALUE) === selectedValue,
  );
  const selectedLabel = selectedOption?.label ?? '';

  return (
    <Select
      value={selectedValue}
      onValueChange={(value) => actions.onChange(value === EMPTY_VALUE ? '' : value)}
      disabled={state?.isDisabled}
    >
      {/* O degrau `lg` da RÉGUA DE MEDIDAS (`lib/theme/tokens.css`): este campo fica sempre ao lado
          de um `AzuosTextField` ou dentro de um formulário, e vinha 4px mais baixo e com um raio só
          dele, destoando de tudo em volta.

          `min-w-0` + `max-w-full`: sem os dois, uma opção de nome longo faz o gatilho crescer além
          do espaço que ele tem e empurra a largura de quem está em volta — dentro de um diálogo,
          isso vira barra de rolagem horizontal na tela inteira. O nome completo continua acessível
          pelo `title` e pela lista aberta. */}
      <SelectTrigger
        aria-label={ui?.ariaLabel}
        title={selectedLabel || undefined}
        className={cn('control-lg rounded-control max-w-full min-w-0 text-sm', ui?.className)}
      >
        <SelectedValue data={{ option: selectedOption }} ui={{ placeholder: ui?.placeholder }} />
      </SelectTrigger>

      {/* A LARGURA DA LISTA É AMARRADA À DO GATILHO, entre um piso e um teto. Sem isso ela se
          estica até o nome mais comprido da lista, e nasce mais larga que o diálogo inteiro,
          vazando pelos dois lados. */}
      <SelectContent className="w-auto max-w-[min(26rem,calc(100vw-2rem))] min-w-(--radix-select-trigger-width)">
        {data.options.map((option) => (
          <OptionRow key={option.value || EMPTY_VALUE} data={{ option }} />
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * O valor escolhido no gatilho. `data-slot="select-value"` mantém o recorte de uma linha que o
 * gatilho aplica ao filho; o tom de "nada escolhido" continua vindo do próprio gatilho, que recebe
 * `data-placeholder` do componente baixado.
 */
function SelectedValue({
  data,
  ui,
}: {
  data: { option?: AzuosSelectFieldOption };
  ui: { placeholder?: string };
}) {
  const Icon = data.option?.icon;

  return (
    <span data-slot="select-value" className="flex min-w-0 items-center gap-2">
      {Icon ? (
        <Icon className="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />
      ) : null}
      <span className="truncate">{data.option?.label || (ui.placeholder ?? '')}</span>
    </span>
  );
}

/** Uma linha da lista aberta. `truncate` para a opção comprida ser cortada, não a tela. */
function OptionRow({ data }: { data: { option: AzuosSelectFieldOption } }) {
  const { option } = data;
  const Icon = option.icon;

  return (
    <SelectItem value={option.value || EMPTY_VALUE}>
      {Icon ? (
        <Icon className="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />
      ) : null}
      <span className="truncate">{option.label}</span>
    </SelectItem>
  );
}
