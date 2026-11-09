import gsap from 'gsap';
import { X } from 'lucide-react';
import { type ReactNode, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { prefersReducedMotion } from '../../motion/motion.util';
import { AzuosActionButton } from '../azuos-action-button/azuos-action-button.component';

/**
 * A TELA QUE SE EXPANDE — para o trabalho que não cabe num diálogo nem num combobox (montar um
 * filtro em árvore, por exemplo). Abre por cima de tudo, crescendo a partir do centro, e ocupa
 * a tela inteira; Esc e o X fecham. Referência visual: o "expandable screen" do cult-ui, feito
 * aqui com o GSAP do projeto — sem dependência nova.
 */
export type AzuosExpandableScreenProps = {
  data: { title: string; description?: string };
  state: { isOpen: boolean };
  actions: { onClose: () => void };
  /** O rodapé fixo da tela (normalmente "Cancelar" e "Salvar"). */
  footer?: ReactNode;
  children: ReactNode;
};

/**
 * As telas abertas, da de baixo para a de cima. Uma tela cheia pode abrir sobre outra (montar o
 * painel → expandir um gráfico), e o Esc é de UMA só: a de cima. Antes, todas ouviam o mesmo Esc
 * e fechavam juntas — e fechar a de montar o painel é "Restaurar", que joga o rascunho fora.
 */
const OPEN_SCREENS: HTMLElement[] = [];

/**
 * O Esc é desta tela quando ela é a de cima, ninguém já tratou a tecla, e o foco está nela (ou
 * solto na página). Foco num diálogo por cima (o editor de bloco) quer dizer que o Esc é dele.
 */
export function isOwnEscape(event: KeyboardEvent, element: HTMLElement): boolean {
  if (event.key !== 'Escape' || event.defaultPrevented) return false;
  if (OPEN_SCREENS.at(-1) !== element) return false;
  const target = event.target;
  if (!(target instanceof Node) || target === document.body) return true;

  return element.contains(target);
}

export function AzuosExpandableScreen({
  data,
  state,
  actions,
  footer,
  children,
}: AzuosExpandableScreenProps) {
  const panel = useRef<HTMLDivElement>(null);
  /* O fechar mais recente, guardado fora das dependências do efeito: quem usa a tela cria um
     `actions` novo a cada render, e refazer o efeito a cada letra digitada devolvia o foco para a
     tela — o campo perdia o foco depois da primeira letra. */
  const onClose = useRef(actions.onClose);
  useLayoutEffect(() => {
    onClose.current = actions.onClose;
  });

  useLayoutEffect(() => {
    if (!state.isOpen || !panel.current || prefersReducedMotion()) return;
    gsap.fromTo(
      panel.current,
      { clipPath: 'inset(18% 22% 18% 22% round 24px)', opacity: 0.4 },
      {
        clipPath: 'inset(0% 0% 0% 0% round 0px)',
        opacity: 1,
        duration: 0.32,
        ease: 'power3.out',
        clearProps: 'clipPath,opacity',
      },
    );
  }, [state.isOpen]);

  useEffect(() => {
    const element = panel.current;
    if (!state.isOpen || !element) return;
    OPEN_SCREENS.push(element);
    element.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (!isOwnEscape(event, element)) return;
      event.preventDefault();
      onClose.current();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      OPEN_SCREENS.splice(OPEN_SCREENS.indexOf(element), 1);
    };
  }, [state.isOpen]);

  if (!state.isOpen) return null;

  return createPortal(
    <div
      ref={panel}
      role="dialog"
      aria-modal="true"
      aria-label={data.title}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex flex-col bg-background outline-none"
    >
      <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-ink-900">{data.title}</h2>
          {data.description ? (
            <p className="mt-0.5 text-sm text-ink-500">{data.description}</p>
          ) : null}
        </div>
        <AzuosActionButton
          data={{ label: 'Fechar' }}
          ui={{ variant: 'ghost', icon: X, isIconOnly: true }}
          actions={{ onClick: actions.onClose }}
        />
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      {footer ? (
        <footer className="flex justify-end gap-2 border-t border-border bg-card px-6 py-3">
          {footer}
        </footer>
      ) : null}
    </div>,
    document.body,
  );
}
