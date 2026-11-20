import { type PDFPageProxy } from 'pdfjs-dist';

/**
 * AS PÁGINAS DE UM PDF COMO IMAGEM — o que a prévia de Contratos mostra.
 *
 * Quem desenha é o pdf.js, o mesmo motor do leitor de PDF do Firefox: ele lê o arquivo que o
 * servidor gerou e pinta cada página como o PDF é — fonte embutida, logo, margens, quebras. Não é
 * uma imitação do documento em HTML: é o próprio arquivo que a pessoa vai baixar.
 *
 * Cada página vira uma imagem (`blob:`) na largura em que vai aparecer, multiplicada pela
 * densidade da tela — sem isso o texto sai borrado em tela de alta resolução. A biblioteca só é
 * carregada aqui dentro, na primeira prévia: quem nunca abre Contratos não baixa nada dela.
 *
 * Quem chama é dono das imagens e as libera com `releasePdfPages` quando trocar de prévia.
 */
export type PdfPageImage = { url: string; width: number; height: number };

/** Mais nítido que isto o olho não vê, e cada vez mais a página só pesa. */
const MAX_PIXEL_RATIO = 2;

/**
 * O teto de largura da imagem de cada página, em pixels de verdade. Uma folha A4 com 1.400 px de
 * largura já tem o texto do contrato nítido; acima disso cada página passa de 15 MB na memória de
 * desenho, e um contrato com alteração e consolidação tem dez páginas ou mais — duas vezes, enquanto
 * a prévia nova substitui a velha. Passando do limite, o Chrome deixa de pintar parte da tela, que
 * fica em branco "do nada".
 */
export const MAX_PAGE_PIXEL_WIDTH = 1400;

/** A densidade da imagem: a da tela, até 2×, sem passar do teto de largura. */
export function pageRenderRatio(cssWidth: number, devicePixelRatio: number): number {
  const screen = Math.min(devicePixelRatio || 1, MAX_PIXEL_RATIO);

  return cssWidth > 0 ? Math.min(screen, MAX_PAGE_PIXEL_WIDTH / cssWidth) : screen;
}

async function pdfjs() {
  const [library, worker] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  library.GlobalWorkerOptions.workerSrc = worker.default;

  return library;
}

export async function renderPdfPages(
  pdf: Blob,
  cssWidth: number,
  isCancelled: () => boolean = () => false,
): Promise<PdfPageImage[]> {
  const library = await pdfjs();
  const loading = library.getDocument({ data: new Uint8Array(await pdf.arrayBuffer()) });
  const document = await loading.promise;
  const ratio = pageRenderRatio(cssWidth, globalThis.devicePixelRatio);
  const pages: PdfPageImage[] = [];

  try {
    /* Uma prévia mais nova já pediu outra: parar aqui poupa as páginas que ninguém vai ver. */
    for (let number = 1; number <= document.numPages && !isCancelled(); number += 1) {
      pages.push(await renderPage(await document.getPage(number), cssWidth, ratio));
    }
  } finally {
    await loading.destroy();
  }

  if (!isCancelled()) return pages;

  releasePdfPages(pages);
  return [];
}

async function renderPage(
  page: PDFPageProxy,
  cssWidth: number,
  ratio: number,
): Promise<PdfPageImage> {
  const natural = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: (cssWidth / natural.width) * ratio });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);

  await page.render({ canvas, viewport }).promise;
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));

  return {
    url: blob ? URL.createObjectURL(blob) : '',
    width: cssWidth,
    height: Math.round(viewport.height / ratio),
  };
}

/** Devolve a memória das imagens: cada `blob:` segura a página inteira até ser liberado. */
export function releasePdfPages(pages: PdfPageImage[]): void {
  for (const page of pages) {
    if (page.url) URL.revokeObjectURL(page.url);
  }
}
