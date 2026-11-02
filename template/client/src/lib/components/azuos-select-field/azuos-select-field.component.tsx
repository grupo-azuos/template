import { type LucideIcon } from 'lucide-react';

import { cn } from '../../utils/cn.util';
import { AzuosPersonAvatar } from '../azuos-person-avatar/azuos-person-avatar.component';
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
export type AzuosSelectFieldOption = {
  value: string;
  label: string;
  icon?: LucideIcon;
  /** A pessoa da opção: quando existe, a foto (ou as iniciais) vem antes do rótulo. */
  personName?: string;
  /** A foto da pessoa. Sem ela, ficam as iniciais de `personName`. */
  avatarUrl?: string | null;
};

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

          `max-w-full`: sem ele, uma opção de nome longo faz o gatilho crescer além do espaço que
          ele tem e empurra a largura de quem está em volta — dentro de um diálogo, isso vira barra
          de rolagem horizontal na tela inteira. O nome completo continua acessível pelo `title` e
          pela lista aberta. `min-w-40` é o piso: abaixo de 10rem o gatilho cortava o próprio
          valor ("Todas as ci…"), e o piso é do campo, não de cada tela.

          `data-[size=default]:h-(--control-lg)`: o gatilho baixado impõe a altura dele DENTRO de
          uma variante (`data-[size=default]:h-9`), e uma variante ganha de classe solta — o
          `control-lg` sozinho ficava no elemento e perdia, com o campo saindo 36px ao lado de
          campos de 40px. Só a mesma variante derruba a dele. */}
      <SelectTrigger
        aria-label={ui?.ariaLabel}
        title={selectedLabel || undefined}
        className={cn(
          'control-lg rounded-control max-w-full min-w-40 text-sm data-[size=default]:h-(--control-lg)',
          ui?.className,
        )}
      >
        <SelectedValue data={{ option: selectedOption }} ui={{ placeholder: ui?.placeholder }} />
      </SelectTrigger>

      {/* A LARGURA DA LISTA É AMARRADA À DO GATILHO, entre um piso e um teto. Sem isso ela se
          estica até o nome mais comprido da lista, e nasce mais larga que o diálogo inteiro,
          vazando pelos dois lados.

          `position="popper"`: a lista abre logo ABAIXO do gatilho. O modo padrão do Radix
          ("item-aligned") só calcula onde desenhar a lista quando encontra o `SelectValue` dele
          dentro do gatilho — e aqui o rótulo é nosso (ver acima). Sem ele, a lista nascia sem
          posição, no canto de baixo da janela, FORA da tela: o seletor abria e ninguém via as
          opções. O teste em jsdom não pega isso, porque lá nada tem posição. */}
      <SelectContent
        position="popper"
        sideOffset={4}
        className="w-auto max-w-[min(26rem,calc(100vw-2rem))] min-w-[max(16rem,var(--radix-select-trigger-width))]"
      >
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
  return (
    <span data-slot="select-value" className="flex min-w-0 items-center gap-2">
      <OptionLead data={{ option: data.option }} />
      <span className="truncate">{data.option?.label || (ui.placeholder ?? '')}</span>
    </span>
  );
}

/**
 * O que vem antes do rótulo: a foto (ou as iniciais) quando a opção é uma PESSOA, ou o ícone da
 * opção. A foto é a regra do grupo para todo seletor de pessoa — o olho acha o rosto antes de ler o
 * nome. Fica `aria-hidden` porque o nome já está escrito ao lado; lido duas vezes, vira ruído.
 */
function OptionLead({ data }: { data: { option?: AzuosSelectFieldOption } }) {
  const option = data.option;
  if (option?.personName) {
    return (
      <span aria-hidden="true" className="flex shrink-0">
        <AzuosPersonAvatar
          name={option.personName}
          avatarUrl={option.avatarUrl}
          ui={{ size: 'sm' }}
        />
      </span>
    );
  }

  const Icon = option?.icon;
  if (!Icon) return null;

  return <Icon className="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />;
}

/** Uma linha da lista aberta. `truncate` para a opção comprida ser cortada, não a tela. */
function OptionRow({ data }: { data: { option: AzuosSelectFieldOption } }) {
  const { option } = data;

  return (
    <SelectItem value={option.value || EMPTY_VALUE}>
      <OptionLead data={{ option }} />
      <span className="truncate">{option.label}</span>
    </SelectItem>
  );
}
