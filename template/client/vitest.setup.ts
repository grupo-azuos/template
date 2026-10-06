import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

/**
 * Sem a limpeza, o DOM do teste anterior continua montado e uma consulta por texto
 * encontra o elemento da outra história — o teste passa por acaso e falha quando a ordem
 * dos arquivos muda.
 */
afterEach(() => {
  cleanup();
});

/**
 * O jsdom não implementa Pointer Events nem `scrollIntoView`. Componentes do Radix (o Select
 * baixado em `lib/components/ui`, por exemplo) chamam os três ao abrir — sem o stub, o teste
 * quebra com "is not a function" antes de testar o que importa.
 */
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

/**
 * Nem `ResizeObserver`. O `cmdk` (a lista com busca por trás do `AzuosComboboxField`) o usa para
 * acompanhar a altura da lista enquanto o filtro muda — sem o stub, abrir o campo estoura com
 * "ResizeObserver is not defined" antes de qualquer item aparecer.
 *
 * O STUB PRECISA RESPONDER UM TAMANHO, e não só existir calado. O `ResponsiveContainer` do
 * Recharts (dentro do `AzuosChartFrame`) desenha o gráfico com a medida que o observador
 * devolve: com zero, ele conclui que não cabe nada e não pinta eixo, barra nem rótulo — e os
 * testes dos gráficos param de achar os nomes das categorias.
 *
 * A medida abaixo é fixa de propósito. No jsdom não existe layout de verdade para medir, e
 * nenhum teste depende do tamanho em si; o que eles precisam é de uma área grande o bastante
 * para o gráfico se considerar desenhável.
 */
const OBSERVED_SIZE = { width: 800, height: 400 };

if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    private readonly callback: ResizeObserverCallback;

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }

    observe(target: Element) {
      const contentRect = { ...OBSERVED_SIZE, top: 0, left: 0, x: 0, y: 0, right: 800, bottom: 400 };

      this.callback(
        [{ target, contentRect } as unknown as ResizeObserverEntry],
        this as unknown as ResizeObserver,
      );
    }

    unobserve() {}
    disconnect() {}
  };
}

/**
 * O jsdom também não implementa `matchMedia`. O `Sidebar` do shadcn o consulta na montagem,
 * por `useIsMobile`, para decidir entre a barra e a gaveta — sem o stub toda tela que tem
 * menu quebra antes de renderizar qualquer coisa.
 *
 * O padrão é "não é celular": é o que vale na suíte, e deixar `matches: true` faria os
 * testes exercitarem a gaveta em vez da barra, que não é o caso que eles descrevem.
 */
if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
