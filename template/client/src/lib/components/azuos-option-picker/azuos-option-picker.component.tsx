import { Check, ChevronDown, Search, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { tv } from 'tailwind-variants';

import { cn } from '../../utils/cn.util';
import { type AzuosStatusBadgeTone } from '../azuos-status-badge/azuos-status-badge.component';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

/**
 * Seletor dinâmico — substitui o `<select>` nativo em filtro e formulário.
 *
 * Com POUCAS opções, vira uma fileira de pastilhas: a pessoa compara e troca com um clique, sem
 * abrir nada. Com MUITAS, pastilha lado a lado viraria uma parede de botões — vira um botão que abre
 * um balão com busca.
 *
 * O tom (verde, vermelho...) é decidido por QUEM CHAMA — o mesmo cuidado do `AzuosStatusBadge`, para
 * a cor de uma situação nunca variar de tela para tela.
 */
/** `icon` é opcional: um desenho na frente do texto, para a opção não ser só uma palavra. */
export type AzuosOptionPickerOption = {
  value: string;
  label: string;
  tone?: AzuosStatusBadgeTone;
  icon?: LucideIcon;
};

export type AzuosOptionPickerProps = {
  data: { value: string; options: AzuosOptionPickerOption[] };
  ui?: {
    ariaLabel?: string;
    className?: string;
    /** Prefixa uma opção "Todos os X", representando o valor `''`. Só faz sentido em filtro. */
    allLabel?: string;
    placeholder?: string;
    /**
     * Estica o controle até a largura do campo ao lado, como num formulário. A ALTURA não depende
     * disto: pastilha ou lista, filtro ou formulário, o controle tem sempre os 40px de todo campo
     * (`control-lg`) — a mesma do `AzuosTextField`, do `AzuosSelectField` e do `AzuosDatePicker`.
     */
    fullWidth?: boolean;
  };
  state?: { isDisabled?: boolean };
  actions: { onChange: (value: string) => void };
};

/**
 * Até quantas opções o controle é uma fileira de pastilhas; acima disso vira a lista que abre.
 *
 * Em FILTRO a barra tem a largura da tela e as pastilhas podem quebrar linha: seis ainda se leem de
 * relance. Em FORMULÁRIO (dentro de um diálogo) a largura é a de um campo, e pastilha só serve
 * enquanto cabe em UMA linha — com mais de três, elas quebram em duas ou três fileiras e o campo
 * passa a ocupar mais altura do que todos os outros juntos. Ali a lista escala para qualquer
 * quantidade, e ainda tem busca.
 */
const PILL_MAX_OPTIONS = { filter: 6, form: 3 } as const;

/**
 * O TRILHO das pastilhas.
 *
 * A altura de campo é a do trilho INTEIRO (40px, com a borda e o respiro dele), não a de cada
 * pastilha: com a pastilha em 32px o trilho somava 42px e ficava mais alto que o seletor ao lado.
 * `min-h`, e não `h`: no celular as opções quebram em mais de uma linha.
 */
const optionTrack = tv({
  base: 'rounded-control border-border/70 bg-muted/50 min-h-(--control-lg) items-stretch gap-1 border p-1',
  variants: {
    layout: {
      filter: 'inline-flex flex-wrap',
      form: 'grid w-full',
    },
    /* Só vale na grade do formulário: uma coluna por opção. */
    columns: { 1: '', 2: '', 3: '' },
  },
  compoundVariants: [
    { layout: 'form', columns: 1, class: 'grid-cols-1' },
    { layout: 'form', columns: 2, class: 'grid-cols-2' },
    { layout: 'form', columns: 3, class: 'grid-cols-3' },
  ],
  defaultVariants: { layout: 'filter', columns: 3 },
});

/**
 * A PASTILHA. Preenche a altura do trilho (que é quem tem os 40px de campo), e o raio é `box`, um
 * degrau abaixo do `control` do trilho: filho menor que o pai.
 *
 * A cor só entra quando a pastilha está ESCOLHIDA, e aí é a do tom.
 */
const optionPill = tv({
  base: 'rounded-box inline-flex cursor-pointer items-center gap-1.5 border px-3 py-1 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60',
  variants: {
    layout: {
      filter: '',
      /* Na grade o texto fica centrado na coluna. Sem altura mínima própria: a pastilha preenche o
         trilho, e é o trilho que tem os 40px. */
      form: 'justify-center text-center',
    },
    isSelected: {
      true: 'font-semibold shadow-xs',
      false: 'hover:bg-card/70 hover:text-foreground text-muted-foreground border-transparent',
    },
    tone: { neutral: '', info: '', success: '', warning: '', danger: '', brand: '' },
  },
  compoundVariants: [
    { isSelected: true, tone: 'neutral', class: 'border-foreground bg-foreground text-background' },
    { isSelected: true, tone: 'info', class: 'border-info bg-info text-primary-foreground' },
    {
      isSelected: true,
      tone: 'success',
      class: 'border-success bg-success text-primary-foreground',
    },
    {
      isSelected: true,
      tone: 'warning',
      class: 'border-warning bg-warning text-primary-foreground',
    },
    {
      isSelected: true,
      tone: 'danger',
      class: 'border-destructive bg-destructive text-destructive-foreground',
    },
    { isSelected: true, tone: 'brand', class: 'border-primary bg-primary text-primary-foreground' },
  ],
  defaultVariants: { layout: 'filter', isSelected: false, tone: 'neutral' },
});

/** A bolinha do tom, ao lado do texto de uma opção que não está escolhida. */
const optionDot = tv({
  base: 'size-1.5 shrink-0 rounded-full',
  variants: {
    tone: {
      neutral: 'bg-muted-foreground',
      info: 'bg-info',
      success: 'bg-success',
      warning: 'bg-warning',
      danger: 'bg-destructive',
      brand: 'bg-primary',
    },
  },
  defaultVariants: { tone: 'neutral' },
});

/* Uma coluna por opção. Em formulário nunca passam de três — acima disso não há pastilhas. */
function resolveGridColumns(count: number): 1 | 2 | 3 {
  if (count <= 1) return 1;

  return count === 2 ? 2 : 3;
}

function resolveOptions(
  options: AzuosOptionPickerOption[],
  allLabel: string | undefined,
): AzuosOptionPickerOption[] {
  return allLabel ? [{ value: '', label: allLabel }, ...options] : options;
}

export function AzuosOptionPicker({ data, ui, state, actions }: AzuosOptionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const options = resolveOptions(data.options, ui?.allLabel);
  const layout = resolveLayout(ui);

  const select = (value: string) => {
    actions.onChange(value);
    setIsOpen(false);
    setQuery('');
  };

  if (options.length <= PILL_MAX_OPTIONS[layout]) {
    return (
      <PillTrack
        data={{ options, value: data.value }}
        ui={{ layout, ariaLabel: ui?.ariaLabel, className: ui?.className }}
        state={{ isDisabled: state?.isDisabled }}
        actions={{ onSelect: select }}
      />
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PickerTrigger
        data={{ options, value: data.value }}
        ui={ui}
        state={{ isDisabled: state?.isDisabled }}
      />

      {/* A LARGURA DO BALÃO É AMARRADA À DO BOTÃO, entre um piso e um teto. Com largura fixa, ele
          nascia estreito sob um botão largo (e as opções saíam cortadas) ou largo sob um botão
          estreito (e o balão parecia solto, fora do lugar). O teto impede que uma opção de nome
          comprido estique o balão pela tela — a opção é cortada, não a tela. */}
      <PopoverContent
        className="w-auto max-w-[min(26rem,calc(100vw-2rem))] min-w-(--radix-popover-trigger-width) p-0"
        align="start"
      >
        <OptionSearch data={{ query }} actions={{ onQueryChange: setQuery }} />
        <OptionList data={{ options, query, value: data.value }} actions={{ onSelect: select }} />
      </PopoverContent>
    </Popover>
  );
}

/** Em formulário a largura é a do campo; em filtro, a do próprio conteúdo. */
function resolveLayout(ui: AzuosOptionPickerProps['ui']): 'filter' | 'form' {
  return ui?.fullWidth ? 'form' : 'filter';
}

/**
 * O gatilho do modo LISTA. Tem os mesmos 40px do trilho de pastilhas e de todo campo: os dois modos
 * deste componente moram lado a lado numa barra de filtro e têm de alinhar.
 */
function PickerTrigger({
  data,
  ui,
  state,
}: {
  data: { options: AzuosOptionPickerOption[]; value: string };
  ui: AzuosOptionPickerProps['ui'];
  state: { isDisabled?: boolean };
}) {
  return (
    <PopoverTrigger
      disabled={state.isDisabled}
      aria-label={ui?.ariaLabel}
      className={cn(
        'control-lg',
        'rounded-control border-border/70 bg-card text-foreground hover:bg-muted/40 inline-flex w-full cursor-pointer items-center justify-between gap-2 border text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        ui?.fullWidth ? 'sm:w-full' : 'sm:w-auto sm:min-w-[180px]',
        ui?.className,
      )}
    >
      <SelectedLabel data={data} ui={{ placeholder: ui?.placeholder }} />
      <ChevronDown className="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />
    </PopoverTrigger>
  );
}

/**
 * O TRILHO de pastilhas — uma pastilha ativa "flutuando" dentro de uma tira com fundo próprio, em vez
 * de cada opção ser um botão bordado e solto. É o que faz ler como UM controle com vários estados, e
 * não uma fileira de botões separados.
 */
function PillTrack({
  data,
  ui,
  state,
  actions,
}: {
  data: { options: AzuosOptionPickerOption[]; value: string };
  ui: { layout: 'filter' | 'form'; ariaLabel?: string; className?: string };
  state: { isDisabled?: boolean };
  actions: { onSelect: (value: string) => void };
}) {
  return (
    <div
      className={cn(
        optionTrack({ layout: ui.layout, columns: resolveGridColumns(data.options.length) }),
        ui.className,
      )}
      role="group"
      aria-label={ui.ariaLabel}
    >
      {data.options.map((option) => (
        <OptionPill
          key={option.value || '__all__'}
          data={{ option }}
          ui={{ layout: ui.layout }}
          state={{ isSelected: option.value === data.value, isDisabled: state.isDisabled }}
          actions={{ onSelect: () => actions.onSelect(option.value) }}
        />
      ))}
    </div>
  );
}

/**
 * A bolinha do tom acompanha a opção escolhida: sem ela, ao virar lista a opção perderia a cor que
 * tinha como pastilha, e a mesma situação ficaria colorida num modo e cinza no outro.
 */
function SelectedLabel({
  data,
  ui,
}: {
  data: { options: AzuosOptionPickerOption[]; value: string };
  ui: { placeholder?: string };
}) {
  const selected = data.options.find((option) => option.value === data.value) ?? null;
  const Icon = selected?.icon;

  return (
    <span className="flex min-w-0 items-center gap-2">
      {Icon ? (
        <Icon className="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />
      ) : selected?.tone ? (
        <span className={optionDot({ tone: selected.tone })} aria-hidden="true" />
      ) : null}
      <span className="truncate">{selected?.label ?? ui.placeholder ?? 'Selecione'}</span>
    </span>
  );
}

function OptionPill({
  data,
  ui,
  state,
  actions,
}: {
  data: { option: AzuosOptionPickerOption };
  ui: { layout: 'filter' | 'form' };
  state: { isSelected: boolean; isDisabled?: boolean };
  actions: { onSelect: () => void };
}) {
  const { option } = data;
  const Icon = option.icon;

  return (
    <button
      type="button"
      disabled={state.isDisabled}
      aria-pressed={state.isSelected}
      onClick={actions.onSelect}
      className={optionPill({
        layout: ui.layout,
        isSelected: state.isSelected,
        tone: option.tone,
      })}
    >
      {Icon ? (
        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      ) : option.tone && !state.isSelected ? (
        <span className={optionDot({ tone: option.tone })} aria-hidden="true" />
      ) : null}
      {option.label}
    </button>
  );
}

function OptionSearch({
  data,
  actions,
}: {
  data: { query: string };
  actions: { onQueryChange: (query: string) => void };
}) {
  return (
    <div className="border-border/70 relative border-b p-2">
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-3.5 -translate-y-1/2"
        aria-hidden="true"
      />
      <input
        type="text"
        value={data.query}
        onChange={(event) => actions.onQueryChange(event.target.value)}
        placeholder="Buscar…"
        aria-label="Buscar nas opções"
        className={cn(
          /* A busca do balão é um controle como os outros: degrau `sm` da régua. */
          'control-sm rounded-control',
          'border-border/60 bg-muted/30 text-foreground focus:border-primary w-full border pr-2 pl-7 text-xs outline-none',
        )}
      />
    </div>
  );
}

function OptionList({
  data,
  actions,
}: {
  data: { options: AzuosOptionPickerOption[]; query: string; value: string };
  actions: { onSelect: (value: string) => void };
}) {
  const needle = data.query.trim().toLowerCase();
  const filtered = needle
    ? data.options.filter((option) => option.label.toLowerCase().includes(needle))
    : data.options;

  /* `overflow-x-hidden` ao lado do vertical: pelo CSS, pedir rolagem num eixo transforma o outro em
     `auto` sozinho, e uma opção de nome comprido daria barra de rolagem horizontal dentro do balão. */
  return (
    <div className="max-h-64 overflow-x-hidden overflow-y-auto p-1">
      {filtered.length === 0 ? (
        <p className="text-muted-foreground px-2.5 py-3 text-center text-xs">Nada encontrado.</p>
      ) : (
        filtered.map((option) => {
          const isSelected = option.value === data.value;
          const Icon = option.icon;

          return (
            <button
              key={option.value || '__all__'}
              type="button"
              onClick={() => actions.onSelect(option.value)}
              className={cn(
                /* Item de lista dentro de um balão é MIUDEZA, não controle: raio `chip`. */
                'rounded-chip flex w-full cursor-pointer items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors',
                isSelected
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-foreground hover:bg-muted/60',
              )}
            >
              {Icon ? (
                <Icon className="size-3.5 shrink-0" aria-hidden="true" />
              ) : option.tone ? (
                <span className={optionDot({ tone: option.tone })} aria-hidden="true" />
              ) : null}
              <span className="flex-1 truncate">{option.label}</span>
              {isSelected ? <Check className="size-3.5 shrink-0" aria-hidden="true" /> : null}
            </button>
          );
        })
      )}
    </div>
  );
}
