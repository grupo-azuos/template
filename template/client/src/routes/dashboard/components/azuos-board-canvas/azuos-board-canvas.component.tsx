import 'react-grid-layout/css/styles.css';

import gsap from 'gsap';
import { type ReactNode, useLayoutEffect, useRef, useState } from 'react';
import { GridLayout, type Layout, useContainerWidth } from 'react-grid-layout';

import {
  GRID_COLUMNS,
  type LayoutItem,
  type Widget,
  WIDGET_KINDS,
} from '@template/shared/schemas/dashboard-board.schema';

import { useDragScrollFollow } from '../../../../lib/hooks/use-drag-scroll-follow/use-drag-scroll-follow';
import { prefersReducedMotion } from '../../../../lib/motion/motion.util';
import { cn } from '../../../../lib/utils/cn.util';
import { type WidgetState } from '../../../../lib/view-models/use-dashboard-board.model';
import {
  AzuosBoardWidget,
  DRAG_HANDLE,
  NO_DRAG,
} from '../azuos-board-widget/azuos-board-widget.component';
import { defaultSizeOf } from '../azuos-board-widget/widget-kind.util';

/**
 * O CANVAS DO DASHBOARD — a grade de 4 colunas onde os blocos se encaixam. Vendo, nada se
 * mexe; editando, cada bloco arrasta pela alça, redimensiona pelos quatro cantos, e as casas
 * vazias da grade aparecem atrás, como um tabuleiro.
 */
export type AzuosBoardCanvasProps = {
  data: {
    widgets: Widget[];
    layout: LayoutItem[];
    results: Record<string, WidgetState>;
    /** O nome do filtro salvo de cada bloco, pelo id do filtro. */
    filterNames: Record<string, string>;
  };
  /** `canDrop`: aceita um tipo de bloco arrastado da lateral (montando, e com vaga). */
  state: { isEditing: boolean; canDrop?: boolean };
  actions: {
    onLayoutChange: (layout: LayoutItem[]) => void;
    onEditWidget: (id: string) => void;
    onRemoveWidget: (id: string) => void;
    onChangeKind?: (id: string, kind: Widget['kind']) => void;
    /** Um tipo solto numa casa da grade: o bloco novo nasce ali, naquele tamanho. */
    onDropKind?: (kind: Widget['kind'], place: Omit<LayoutItem, 'i'>) => void;
  };
};

/** O formato do que a lateral arrasta: o tipo de bloco, no `dataTransfer`. */
export const KIND_DRAG_TYPE = 'application/x-azuos-widget-kind';

/**
 * O tipo de bloco escrito no NOME do formato. Durante o arrastar, o navegador não deixa ler o
 * conteúdo (`getData` volta vazio até soltar) — só a lista de formatos. Sem isto, a grade não
 * sabia o tamanho do bloco enquanto ele passava: mostrava 2×2 e "pulava" no tamanho certo ao
 * soltar.
 */
export function kindDragTypeOf(kind: Widget['kind']): string {
  return `${KIND_DRAG_TYPE}+${kind}`;
}

/** A altura de uma casa da grade: dois andares cabem um gráfico inteiro. */
const ROW_HEIGHT = 140;
const GAP = 16;
/**
 * Montando, os blocos se afastam: o contorno tracejado fica 4px fora do bloco e os puxadores
 * 11px — com o vão de quem só vê, os puxadores de um bloco caíam em cima do vizinho.
 */
const EDITING_GAP = 32;
const MAX_ROWS_PER_WIDGET = 8;
/** Andares vazios abaixo do último bloco: espaço visível para onde arrastar o próximo. */
const SPARE_ROWS = 2;
const EMPTY_RESULT: WidgetState = { data: null, isLoading: true, error: null };

/* A sombra de onde o bloco vai cair: o padrão da biblioteca é um retângulo vermelho de canto
   vivo. Aqui é a casa da grade, arredondada, num azul da marca bem claro — o tom escuro de antes
   fazia o bloco por cima dela parecer preto. Ela desliza entre as casas (`transition`). */
const PLACEHOLDER = [
  '[&_.react-grid-placeholder]:rounded-surface [&_.react-grid-placeholder]:border-2 [&_.react-grid-placeholder]:border-dashed [&_.react-grid-placeholder]:border-ink-500',
  '[&_.react-grid-placeholder]:!bg-primary/20 [&_.react-grid-placeholder]:!opacity-100',
  '[&_.react-grid-placeholder]:!duration-200 [&_.react-grid-placeholder]:!ease-out',
].join(' ');

/*
 * O bloco que está sendo arrastado "levanta" e segue a mão: fica por cima dos outros, cresce um
 * pouco, inclina e ganha sombra — é o que diz "estou carregando isto". `scale` e `rotate` são
 * propriedades próprias do CSS (não `transform`), então não brigam com o `translate` que a
 * biblioteca usa para mover o bloco. Os outros blocos abrem caminho deslizando, sem pular.
 */
const LIFTED = [
  '[&_.react-draggable-dragging]:z-20 [&_.react-draggable-dragging]:cursor-grabbing',
  '[&_.react-draggable-dragging]:scale-[1.03] [&_.react-draggable-dragging]:rotate-1 [&_.react-draggable-dragging]:shadow-card',
  '[&_.react-draggable-dragging]:![transition:scale_150ms_ease-out,rotate_150ms_ease-out]',
  '[&_.react-grid-item:not(.react-draggable-dragging)]:![transition:transform_220ms_cubic-bezier(0.2,0.8,0.2,1),width_220ms_ease,height_220ms_ease]',
].join(' ');

/*
 * A SELEÇÃO DO PAINT: montando, cada bloco ganha um contorno tracejado grosso, afastado da borda,
 * e oito quadradinhos (quatro cantos e o meio de cada lado) — o desenho que todo mundo já sabe que
 * "dá para mexer e puxar". O tom é o neutro escuro (borda colorida é proibida no grupo); passar o
 * mouse escurece o contorno daquele bloco.
 *
 * Os puxadores levam `!`: o CSS da biblioteca entra fora das camadas do Tailwind e venceria —
 * ele os deixa invisíveis até o hover, girados, e com uma "quina" de 5px que ninguém via.
 */
const SELECTION = [
  '[&_.react-grid-item]:outline-2 [&_.react-grid-item]:outline-offset-4 [&_.react-grid-item]:outline-dashed [&_.react-grid-item]:outline-ink-500',
  '[&_.react-grid-item:hover]:outline-ink-900',
  '[&_.react-resizable-handle]:z-10 [&_.react-resizable-handle]:size-3.5! [&_.react-resizable-handle]:rounded-chip [&_.react-resizable-handle]:border-2 [&_.react-resizable-handle]:border-ink-900 [&_.react-resizable-handle]:bg-card',
  '[&_.react-resizable-handle]:m-0! [&_.react-resizable-handle]:transform-none! [&_.react-resizable-handle]:opacity-100! [&_.react-resizable-handle]:after:hidden',
  '[&_.react-resizable-handle-se]:-right-[11px]! [&_.react-resizable-handle-se]:-bottom-[11px]!',
  '[&_.react-resizable-handle-sw]:-bottom-[11px]! [&_.react-resizable-handle-sw]:-left-[11px]!',
  '[&_.react-resizable-handle-ne]:-top-[11px]! [&_.react-resizable-handle-ne]:-right-[11px]!',
  '[&_.react-resizable-handle-nw]:-top-[11px]! [&_.react-resizable-handle-nw]:-left-[11px]!',
  '[&_.react-resizable-handle-n]:-top-[11px]! [&_.react-resizable-handle-n]:left-[calc(50%-7px)]!',
  '[&_.react-resizable-handle-s]:-bottom-[11px]! [&_.react-resizable-handle-s]:left-[calc(50%-7px)]!',
  '[&_.react-resizable-handle-e]:top-[calc(50%-7px)]! [&_.react-resizable-handle-e]:-right-[11px]!',
  '[&_.react-resizable-handle-w]:top-[calc(50%-7px)]! [&_.react-resizable-handle-w]:-left-[11px]!',
].join(' ');

/** Os oito puxadores: cantos e o meio de cada lado. */
const RESIZE_HANDLES = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const;

export function AzuosBoardCanvas({ data, state, actions }: AzuosBoardCanvasProps) {
  const { width, containerRef, mounted } = useContainerWidth();
  const follow = useDragScrollFollow();
  const layout = data.layout.map((item) => ({ ...item, maxH: MAX_ROWS_PER_WIDGET }));
  /* Os blocos que já estavam quando o canvas abriu: só os outros pousam com animação. */
  const [firstIds] = useState(() => new Set(data.widgets.map((widget) => widget.id)));
  const gap = state.isEditing ? EDITING_GAP : GAP;

  if (data.widgets.length === 0 && !state.isEditing) {
    return (
      <p className="rounded-surface border border-border bg-card p-8 text-center text-sm text-ink-500">
        Este painel ainda não tem blocos.
      </p>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full', PLACEHOLDER, LIFTED, state.isEditing && SELECTION)}
    >
      {mounted && state.isEditing ? (
        <SlotGrid data={{ layout: data.layout, width }} ui={{ gap }} />
      ) : null}
      {mounted ? (
        <GridLayout
          width={width}
          layout={layout}
          gridConfig={{
            cols: GRID_COLUMNS,
            rowHeight: ROW_HEIGHT,
            margin: [gap, gap],
            containerPadding: [0, 0],
          }}
          dragConfig={{
            enabled: state.isEditing,
            /* O cabeçalho inteiro é a alça (alvo grande, Lei de Fitts); os botões dele não. */
            handle: `.${DRAG_HANDLE}`,
            cancel: `.${NO_DRAG}`,
          }}
          resizeConfig={{ enabled: state.isEditing, handles: [...RESIZE_HANDLES] }}
          dropConfig={{
            enabled: Boolean(state.isEditing && state.canDrop && actions.onDropKind),
            defaultItem: { w: 2, h: 2 },
            /* A sombra de destino já no tamanho do tipo arrastado, e só para tipo de bloco: um
               arquivo ou um texto arrastado por cima não abre casa nenhuma. */
            onDragOver: (event) => {
              const kind = kindOf(event);

              return kind ? defaultSizeOf(kind) : false;
            },
          }}
          onDrop={(_layout, item, event) => {
            const kind = kindOf(event as DragEvent);
            if (kind && item)
              actions.onDropKind?.(kind, { x: item.x, y: item.y, w: item.w, h: item.h });
          }}
          onDragStart={(...args) => follow.onStart(args[4])}
          onDragStop={follow.onStop}
          onResizeStart={(...args) => follow.onStart(args[4])}
          onResizeStop={follow.onStop}
          onLayoutChange={(next: Layout) => {
            if (state.isEditing) actions.onLayoutChange(toLayoutItems(next));
          }}
        >
          {data.widgets.map((widget) => (
            <div key={widget.id} data-widget-id={widget.id}>
              <Landing state={{ isNew: !firstIds.has(widget.id) }}>
                <AzuosBoardWidget
                  data={{
                    widget,
                    result: data.results[widget.id] ?? EMPTY_RESULT,
                    filterName: widget.filterId
                      ? (data.filterNames[widget.filterId] ?? null)
                      : null,
                  }}
                  state={{ isEditing: state.isEditing }}
                  actions={{
                    onEdit: actions.onEditWidget,
                    onRemove: actions.onRemoveWidget,
                    onChangeKind: actions.onChangeKind,
                  }}
                />
              </Landing>
            </div>
          ))}
        </GridLayout>
      ) : null}
    </div>
  );
}

/**
 * AS CASAS DA GRADE, desenhadas atrás dos blocos enquanto se monta o painel — a pessoa vê onde
 * um bloco pode cair. Só aparece editando.
 */
export function SlotGrid({
  data,
  ui,
}: {
  data: { layout: LayoutItem[]; width: number };
  ui?: { gap?: number };
}) {
  const gap = ui?.gap ?? GAP;
  const rows = slotRows(data.layout);
  const cellWidth = Math.max(0, (data.width - gap * (GRID_COLUMNS - 1)) / GRID_COLUMNS);

  return (
    <div
      aria-hidden="true"
      data-testid="board-slots"
      className="pointer-events-none absolute inset-x-0 top-0 grid"
      style={{
        gridTemplateColumns: `repeat(${GRID_COLUMNS}, ${cellWidth}px)`,
        gridAutoRows: `${ROW_HEIGHT}px`,
        gap: `${gap}px`,
      }}
    >
      {Array.from({ length: rows * GRID_COLUMNS }, (_, index) => (
        <span
          key={index}
          className="rounded-surface border border-dashed border-border bg-mantle"
        />
      ))}
    </div>
  );
}

/** Quantos andares de casas desenhar: até o fim do último bloco, mais dois livres. */
export function slotRows(layout: readonly LayoutItem[]): number {
  return Math.max(4, ...layout.map((item) => item.y + item.h)) + SPARE_ROWS;
}

/**
 * O tipo de bloco que vem sendo arrastado da lateral — `null` para qualquer outra coisa. Ao
 * soltar, lê o conteúdo; passando por cima, lê o nome do formato (`kindDragTypeOf`).
 */
export function kindOf(event: Pick<DragEvent, 'dataTransfer'>): Widget['kind'] | null {
  const transfer = event.dataTransfer;
  if (!transfer) return null;
  const fromData = transfer.getData(KIND_DRAG_TYPE);
  if (isKind(fromData)) return fromData;
  const prefix = `${KIND_DRAG_TYPE}+`;
  const fromType = Array.from(transfer.types ?? [])
    .find((type) => type.startsWith(prefix))
    ?.slice(prefix.length);

  return isKind(fromType) ? fromType : null;
}

function isKind(value: string | undefined): value is Widget['kind'] {
  return (WIDGET_KINDS as readonly string[]).includes(value ?? '');
}

/**
 * O POUSO: o bloco que acabou de entrar no painel (solto da lateral ou posto com um clique)
 * cresce a partir de 92% e acende — o olho acha onde ele caiu. A animação roda na MONTAGEM do
 * próprio bloco, que é quando a grade o desenha (um quadro depois da mudança dos dados), antes
 * da pintura: sem piscar. Os blocos do primeiro desenho não se mexem; quem pede menos
 * movimento não vê animação.
 */
function Landing({ state, children }: { state: { isNew: boolean }; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!state.isNew || !ref.current || prefersReducedMotion()) return;
    gsap.fromTo(
      ref.current,
      { scale: 0.92, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.6)', clearProps: 'all' },
    );
  }, [state.isNew]);

  return (
    <div ref={ref} className="h-full">
      {children}
    </div>
  );
}

/**
 * Só o que o painel grava: a biblioteca devolve os itens com campos dela junto — e, durante o
 * arrastar da lateral, a casa provisória dela, que não é bloco nenhum.
 */
function toLayoutItems(layout: Layout): LayoutItem[] {
  return layout
    .filter(({ i }) => !i.startsWith('__dropping'))
    .map(({ i, x, y, w, h }) => ({ i, x, y, w, h }));
}
