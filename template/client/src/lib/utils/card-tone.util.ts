/**
 * A PALETA DE CARD do grupo — a única. Todo card colorido dos 13 sistemas tira a cor daqui.
 *
 * Cada matiz tem quatro tokens no `lib/theme/tokens.css`, com o MESMO valor nos dois temas:
 * fundo pastel, texto escuro do mesmo matiz, hover mais claro e o pastel médio do selecionado e da
 * bolinha do ícone. Sem opacidade, sem cor cheia, sem neon: o mesmo card tem a mesma cara em
 * qualquer tela e em qualquer tema. Cor vem do FUNDO, nunca de borda.
 *
 * As classes são escritas por extenso (e não montadas com `${}`) porque o Tailwind só gera a
 * classe que ele LÊ no código.
 */
export type AzuosCardHue =
  | 'red'
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'lime'
  | 'green'
  | 'emerald'
  | 'teal'
  | 'cyan'
  | 'sky'
  | 'indigo'
  | 'violet'
  | 'pink'
  | 'slate'
  | 'gray'
  | 'bluegray'
  | 'steel';
/** Os nomes de estado que as telas já usam, cada um preso a um matiz. */
export type AzuosCardSemanticTone =
  'danger' | 'warning' | 'info' | 'success' | 'brand' | 'neutral' | 'default';

export type AzuosCardTone = AzuosCardHue | AzuosCardSemanticTone;

export type AzuosCardToneClasses = {
  /** O card parado: fundo pastel e texto escuro do matiz. */
  surface: string;
  /** O hover do card clicável: mais CLARO, não mais escuro, e com sombra. */
  hover: string;
  /** O card escolhido: o pastel médio, mesmo texto. */
  selected: string;
  /** A bolinha do ícone, parada. */
  chip: string;
  /** A bolinha do ícone no card escolhido: invertida, para o escolhido saltar aos olhos. */
  chipSelected: string;
  /** Desenho de fundo (o ícone grande, a marca d'água): o pastel médio, sem opacidade. */
  mark: string;
};

const SEMANTIC_HUE: Record<AzuosCardSemanticTone, AzuosCardHue> = {
  danger: 'red',
  warning: 'amber',
  info: 'sky',
  success: 'emerald',
  brand: 'indigo',
  neutral: 'gray',
  default: 'gray',
};

const HUE_CLASSES: Record<AzuosCardHue, AzuosCardToneClasses> = {
  red: {
    surface: 'bg-tone-red-surface text-tone-red-text',
    hover: 'hover:bg-tone-red-hover',
    selected: 'bg-tone-red-chip text-tone-red-text',
    chip: 'bg-tone-red-chip text-tone-red-text',
    chipSelected: 'bg-tone-red-text text-tone-red-surface',
    mark: 'text-tone-red-chip',
  },
  orange: {
    surface: 'bg-tone-orange-surface text-tone-orange-text',
    hover: 'hover:bg-tone-orange-hover',
    selected: 'bg-tone-orange-chip text-tone-orange-text',
    chip: 'bg-tone-orange-chip text-tone-orange-text',
    chipSelected: 'bg-tone-orange-text text-tone-orange-surface',
    mark: 'text-tone-orange-chip',
  },
  amber: {
    surface: 'bg-tone-amber-surface text-tone-amber-text',
    hover: 'hover:bg-tone-amber-hover',
    selected: 'bg-tone-amber-chip text-tone-amber-text',
    chip: 'bg-tone-amber-chip text-tone-amber-text',
    chipSelected: 'bg-tone-amber-text text-tone-amber-surface',
    mark: 'text-tone-amber-chip',
  },
  yellow: {
    surface: 'bg-tone-yellow-surface text-tone-yellow-text',
    hover: 'hover:bg-tone-yellow-hover',
    selected: 'bg-tone-yellow-chip text-tone-yellow-text',
    chip: 'bg-tone-yellow-chip text-tone-yellow-text',
    chipSelected: 'bg-tone-yellow-text text-tone-yellow-surface',
    mark: 'text-tone-yellow-chip',
  },
  lime: {
    surface: 'bg-tone-lime-surface text-tone-lime-text',
    hover: 'hover:bg-tone-lime-hover',
    selected: 'bg-tone-lime-chip text-tone-lime-text',
    chip: 'bg-tone-lime-chip text-tone-lime-text',
    chipSelected: 'bg-tone-lime-text text-tone-lime-surface',
    mark: 'text-tone-lime-chip',
  },
  green: {
    surface: 'bg-tone-green-surface text-tone-green-text',
    hover: 'hover:bg-tone-green-hover',
    selected: 'bg-tone-green-chip text-tone-green-text',
    chip: 'bg-tone-green-chip text-tone-green-text',
    chipSelected: 'bg-tone-green-text text-tone-green-surface',
    mark: 'text-tone-green-chip',
  },
  emerald: {
    surface: 'bg-tone-emerald-surface text-tone-emerald-text',
    hover: 'hover:bg-tone-emerald-hover',
    selected: 'bg-tone-emerald-chip text-tone-emerald-text',
    chip: 'bg-tone-emerald-chip text-tone-emerald-text',
    chipSelected: 'bg-tone-emerald-text text-tone-emerald-surface',
    mark: 'text-tone-emerald-chip',
  },
  teal: {
    surface: 'bg-tone-teal-surface text-tone-teal-text',
    hover: 'hover:bg-tone-teal-hover',
    selected: 'bg-tone-teal-chip text-tone-teal-text',
    chip: 'bg-tone-teal-chip text-tone-teal-text',
    chipSelected: 'bg-tone-teal-text text-tone-teal-surface',
    mark: 'text-tone-teal-chip',
  },
  cyan: {
    surface: 'bg-tone-cyan-surface text-tone-cyan-text',
    hover: 'hover:bg-tone-cyan-hover',
    selected: 'bg-tone-cyan-chip text-tone-cyan-text',
    chip: 'bg-tone-cyan-chip text-tone-cyan-text',
    chipSelected: 'bg-tone-cyan-text text-tone-cyan-surface',
    mark: 'text-tone-cyan-chip',
  },
  sky: {
    surface: 'bg-tone-sky-surface text-tone-sky-text',
    hover: 'hover:bg-tone-sky-hover',
    selected: 'bg-tone-sky-chip text-tone-sky-text',
    chip: 'bg-tone-sky-chip text-tone-sky-text',
    chipSelected: 'bg-tone-sky-text text-tone-sky-surface',
    mark: 'text-tone-sky-chip',
  },
  indigo: {
    surface: 'bg-tone-indigo-surface text-tone-indigo-text',
    hover: 'hover:bg-tone-indigo-hover',
    selected: 'bg-tone-indigo-chip text-tone-indigo-text',
    chip: 'bg-tone-indigo-chip text-tone-indigo-text',
    chipSelected: 'bg-tone-indigo-text text-tone-indigo-surface',
    mark: 'text-tone-indigo-chip',
  },
  violet: {
    surface: 'bg-tone-violet-surface text-tone-violet-text',
    hover: 'hover:bg-tone-violet-hover',
    selected: 'bg-tone-violet-chip text-tone-violet-text',
    chip: 'bg-tone-violet-chip text-tone-violet-text',
    chipSelected: 'bg-tone-violet-text text-tone-violet-surface',
    mark: 'text-tone-violet-chip',
  },
  pink: {
    surface: 'bg-tone-pink-surface text-tone-pink-text',
    hover: 'hover:bg-tone-pink-hover',
    selected: 'bg-tone-pink-chip text-tone-pink-text',
    chip: 'bg-tone-pink-chip text-tone-pink-text',
    chipSelected: 'bg-tone-pink-text text-tone-pink-surface',
    mark: 'text-tone-pink-chip',
  },
  slate: {
    surface: 'bg-tone-slate-surface text-tone-slate-text',
    hover: 'hover:bg-tone-slate-hover',
    selected: 'bg-tone-slate-chip text-tone-slate-text',
    chip: 'bg-tone-slate-chip text-tone-slate-text',
    chipSelected: 'bg-tone-slate-text text-tone-slate-surface',
    mark: 'text-tone-slate-chip',
  },
  gray: {
    surface: 'bg-tone-gray-surface text-tone-gray-text',
    hover: 'hover:bg-tone-gray-hover',
    selected: 'bg-tone-gray-chip text-tone-gray-text',
    chip: 'bg-tone-gray-chip text-tone-gray-text',
    chipSelected: 'bg-tone-gray-text text-tone-gray-surface',
    mark: 'text-tone-gray-chip',
  },
  bluegray: {
    surface: 'bg-tone-bluegray-surface text-tone-bluegray-text',
    hover: 'hover:bg-tone-bluegray-hover',
    selected: 'bg-tone-bluegray-chip text-tone-bluegray-text',
    chip: 'bg-tone-bluegray-chip text-tone-bluegray-text',
    chipSelected: 'bg-tone-bluegray-text text-tone-bluegray-surface',
    mark: 'text-tone-bluegray-chip',
  },
  steel: {
    surface: 'bg-tone-steel-surface text-tone-steel-text',
    hover: 'hover:bg-tone-steel-hover',
    selected: 'bg-tone-steel-chip text-tone-steel-text',
    chip: 'bg-tone-steel-chip text-tone-steel-text',
    chipSelected: 'bg-tone-steel-text text-tone-steel-surface',
    mark: 'text-tone-steel-chip',
  },
};

const HUES = Object.keys(HUE_CLASSES) as AzuosCardHue[];

/** O matiz de um tom: o nome de estado vira o matiz combinado; um matiz passa direto. */
export function cardHueOf(tone: AzuosCardTone | null | undefined): AzuosCardHue {
  if (!tone) return 'gray';
  if (tone in SEMANTIC_HUE) return SEMANTIC_HUE[tone as AzuosCardSemanticTone];

  return HUES.includes(tone as AzuosCardHue) ? (tone as AzuosCardHue) : 'gray';
}

/** As classes de um tom, prontas para o card. */
export function cardToneClasses(tone: AzuosCardTone | null | undefined): AzuosCardToneClasses {
  return HUE_CLASSES[cardHueOf(tone)];
}

/** O ângulo de cada matiz no círculo de cores, para casar uma cor livre com o matiz mais próximo. */
const HUE_ANGLE: [AzuosCardHue, number][] = [
  ['red', 0],
  ['orange', 25],
  ['amber', 40],
  ['yellow', 52],
  ['lime', 80],
  ['green', 130],
  ['emerald', 155],
  ['teal', 172],
  ['cyan', 188],
  ['sky', 202],
  ['indigo', 232],
  ['violet', 262],
  ['pink', 325],
  ['red', 360],
];

/**
 * Uma cor que a PESSOA escolheu (`#rrggbb`) vira o matiz mais próximo da paleta. Cor quase sem
 * saturação vira grafite. Assim o card mantém a escolha dela e continua no padrão — antes a cor
 * livre entrava com mistura de opacidade e cada card saía de um jeito.
 */
export function cardHueFromHex(hex: string | null | undefined): AzuosCardHue {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex ?? '');
  if (!match?.[1]) return 'gray';

  const value = Number.parseInt(match[1], 16);
  const [r, g, b] = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((c) => c / 255) as [
    number,
    number,
    number,
  ];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 0.12) return 'slate';

  return nearestHue(hueAngle(r, g, b, max, max - min));
}

function hueAngle(r: number, g: number, b: number, max: number, delta: number): number {
  if (max === r) return (60 * ((g - b) / delta) + 360) % 360;
  if (max === g) return 60 * ((b - r) / delta) + 120;

  return 60 * ((r - g) / delta) + 240;
}

function nearestHue(angle: number): AzuosCardHue {
  let best: [AzuosCardHue, number] = ['red', 360];
  for (const [hue, at] of HUE_ANGLE) {
    const distance = Math.abs(angle - at);
    if (distance < best[1]) best = [hue, distance];
  }

  return best[0];
}

/** Os matizes, na ordem do círculo, para seletores e stories. */
export const CARD_HUES: readonly AzuosCardHue[] = HUES;
