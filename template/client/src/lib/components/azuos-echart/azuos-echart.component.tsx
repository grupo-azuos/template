import { type EChartsType } from 'echarts/core';
import { type CSSProperties, useEffect, useRef, useState } from 'react';

import { cn } from '../../utils/cn.util';
import {
  type ChartOption,
  type ChartSelection,
  type ChartTheme,
  loadECharts,
  readChartTheme,
  selectionOf,
  withChartTheme,
} from '../../utils/echarts.util';

/**
 * A MOLDURA DE TODO GRÁFICO — onde o ECharts é montado.
 *
 * Todo gráfico do projeto passa por aqui, e é aqui que mora o que não pode variar de um para outro:
 *
 *  1. **A altura como decisão de quem chama** (`heightClass`): um painel com dois quadros lado a
 *     lado só alinha se os dois tiverem a mesma caixa.
 *  2. **Carregando e vazio iguais em todos**: o bloco pulsando com a altura do gráfico (menor que
 *     ela, a tela salta quando o dado chega) e o vazio como FRASE (um quadro em branco se lê como
 *     defeito).
 *  3. **O tema claro/escuro acompanhando a troca na hora**, sem recarregar: a moldura observa o
 *     `data-theme` do documento e entrega ao gráfico as cores novas.
 *  4. **O tamanho acompanhando o quadro**: girar o celular ou recolher o menu redesenha o gráfico na
 *     largura nova.
 *  5. **Uma descrição em texto** (`description`) para leitor de tela: um desenho não se lê em voz alta.
 *
 * `option` pode ser uma FUNÇÃO do tema, para o gráfico que precisa das cores do tema no próprio
 * desenho (a trilha do medidor, o texto do rótulo).
 */
export type AzuosEchartProps = {
  data: {
    option: ChartOption | ((theme: ChartTheme) => ChartOption);
    /** O que o gráfico mostra, em uma frase — lido pelo leitor de tela. */
    description: string;
  };
  ui?: {
    className?: string;
    /** A altura da caixa de desenho. @default 'h-48' */
    heightClass?: string;
    /** O texto do vazio. @default 'Sem dados para mostrar' */
    emptyLabel?: string;
    /**
     * A altura do DESENHO, quando ele é maior que a caixa: uma barra por linha, a equipe inteira.
     * Com ela, a caixa (`heightClass`) vira janela e o desenho ROLA dentro dela, em vez de achatar
     * cada linha até o nome sumir.
     */
    scrollHeight?: number;
  };
  state?: { isLoading?: boolean; isEmpty?: boolean };
  actions?: {
    onSelect?: (selection: ChartSelection) => void;
    /**
     * O clique em QUALQUER ponto da área do gráfico, como a posição no eixo das categorias — o
     * gráfico de área não tem símbolo para clicar, e a pessoa clica no dia, não na linha.
     */
    onAxisSelect?: (index: number) => void;
  };
};

type ChartClicks = Pick<NonNullable<AzuosEchartProps['actions']>, 'onSelect' | 'onAxisSelect'>;

type ChartBox = {
  heightClass: string;
  className?: string;
  emptyLabel: string;
  scrollHeight?: number;
};

export function AzuosEchart({ data, ui, state, actions }: AzuosEchartProps) {
  const box = resolveBox(ui);

  if (state?.isLoading) return <ChartLoading box={box} />;

  if (state?.isEmpty) return <ChartEmpty box={box} />;

  return <ChartBody data={data} box={box} clicks={actions ?? {}} />;
}

/** Os padrões da caixa, resolvidos num lugar só — e não numa fila de `??` dentro da view. */
function resolveBox(ui: AzuosEchartProps['ui']): ChartBox {
  return {
    heightClass: ui?.heightClass ?? 'h-48',
    className: ui?.className,
    emptyLabel: ui?.emptyLabel ?? 'Sem dados para mostrar',
    scrollHeight: ui?.scrollHeight,
  };
}

function ChartLoading({ box }: { box: ChartBox }) {
  return (
    <div
      className={cn('rounded-box bg-muted w-full animate-pulse', box.heightClass, box.className)}
      aria-busy="true"
    />
  );
}

function ChartEmpty({ box }: { box: ChartBox }) {
  return (
    <p
      className={cn(
        'text-muted-foreground flex w-full items-center justify-center text-xs',
        box.heightClass,
        box.className,
      )}
    >
      {box.emptyLabel}
    </p>
  );
}

function ChartBody({
  data,
  box,
  clicks,
}: {
  data: AzuosEchartProps['data'];
  box: ChartBox;
  clicks: ChartClicks;
}) {
  if (box.scrollHeight === undefined) {
    return (
      <ChartSurface
        option={data.option}
        description={data.description}
        className={cn('w-full', box.heightClass, box.className)}
        clicks={clicks}
      />
    );
  }

  return (
    <div className={cn('overflow-y-auto pr-1', box.heightClass, box.className)}>
      <ChartSurface
        option={data.option}
        description={data.description}
        className="w-full"
        style={{ height: box.scrollHeight }}
        clicks={clicks}
      />
    </div>
  );
}

/** Quanto o tamanho precisa ficar parado para o gráfico se redesenhar — um pouco mais que a animação do menu. */
export const RESIZE_SETTLE_MS = 250;

function ChartSurface({
  option,
  description,
  className,
  style,
  clicks,
}: {
  option: AzuosEchartProps['data']['option'];
  description: string;
  className: string;
  style?: CSSProperties;
  clicks: ChartClicks;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsType | null>(null);
  const clicksRef = useRef(clicks);
  const [isReady, setIsReady] = useState(false);
  const theme = useChartTheme();
  const isClickable = Boolean(clicks.onSelect || clicks.onAxisSelect);

  useEffect(() => {
    clicksRef.current = clicks;
  });

  useEffect(() => {
    let isDisposed = false;
    let observer: ResizeObserver | null = null;
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;

    void loadECharts().then((echarts) => {
      const box = boxRef.current;
      if (isDisposed || !box) return;

      /* Tamanho explícito na montagem: escondido (quadro recolhido, aba de fundo) o elemento mede
         zero, e o ECharts desenharia num quadro de 0×0 até a próxima medida. */
      const chart = echarts.init(box, null, {
        renderer: 'svg',
        width: box.clientWidth || 600,
        height: box.clientHeight || 300,
      });
      chart.on('click', (params) => clicksRef.current.onSelect?.(selectionOf(params)));
      /* Só quem pede o clique no eixo ouve a área inteira: nos outros gráficos, um clique fora
         das barras não é nada. */
      if (clicksRef.current.onAxisSelect) {
        chart
          .getZr()
          .on('click', (event) => axisClick(chart, event, clicksRef.current.onAxisSelect));
      }
      chartRef.current = chart;

      /* Redesenha UMA vez, quando o tamanho PARA de mudar, e sem animação. Abrir ou fechar o menu
         anima a largura por uns 200ms, e o observador dispara a cada quadro: redesenhar o SVG
         inteiro 60 vezes por segundo (o fluxo e o calendário têm centenas de peças) derrubava o
         FPS da tela toda. Durante a animação o desenho fica como estava; no fim, assume a medida. */
      observer = new ResizeObserver(([entry]) => {
        if (!entry || entry.contentRect.width === 0) return;
        const { width, height } = entry.contentRect;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(
          () => chart.resize({ width, height, animation: { duration: 0 } }),
          RESIZE_SETTLE_MS,
        );
      });
      observer.observe(box);
      setIsReady(true);
    });

    return () => {
      isDisposed = true;
      clearTimeout(resizeTimer);
      observer?.disconnect();
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  /* O desenho só muda quando a configuração MUDA de fato: quem chama monta o objeto a cada render,
     e redesenhar a cada render reiniciaria a animação a cada clique num filtro ao lado. A versão
     desenhada fica guardada e só é trocada quando a assinatura dela muda. */
  const resolved = withChartTheme(typeof option === 'function' ? option(theme) : option, theme);
  const signature = JSON.stringify(resolved);
  const [drawn, setDrawn] = useState({ option: resolved, signature });
  if (drawn.signature !== signature) setDrawn({ option: resolved, signature });

  useEffect(() => {
    if (!isReady) return;
    chartRef.current?.setOption(drawn.option, { notMerge: true });
  }, [isReady, drawn]);

  return (
    <div
      ref={boxRef}
      role="img"
      aria-label={description}
      data-slot="chart"
      style={style}
      className={cn(className, isClickable && 'cursor-pointer')}
    />
  );
}

/** O clique na área do gráfico como a posição no eixo das categorias — fora da grade, nada. */
function axisClick(
  chart: EChartsType,
  event: { offsetX: number; offsetY: number },
  onAxisSelect: ((index: number) => void) | undefined,
): void {
  if (!onAxisSelect) return;
  const point = [event.offsetX, event.offsetY];
  if (!chart.containPixel({ gridIndex: 0 }, point)) return;
  const [index] = chart.convertFromPixel({ gridIndex: 0 }, point) as number[];
  if (index !== undefined && Number.isFinite(index)) onAxisSelect(Math.round(index));
}

/** O tema do documento, relido quando o `data-theme` troca (o botão de tema claro/escuro). */
function useChartTheme(): ChartTheme {
  const [theme, setTheme] = useState(readChartTheme);

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(readChartTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
}
