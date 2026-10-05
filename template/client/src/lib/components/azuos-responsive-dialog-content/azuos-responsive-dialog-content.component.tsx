import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useRef, useState, type ComponentProps, type PointerEvent } from 'react';

import { cn } from '../../utils/cn.util';
import { DialogOverlay, DialogPortal } from '../ui/dialog';

/**
 * O MESMO `DialogContent` de sempre, só que no celular ele nasce de BAIXO, com os cantos de cima
 * arredondados e uma alça para arrastar — o bottom sheet que todo aplicativo de telefone usa.
 *
 * É um componente PRÓPRIO, e não uma edição do `ui/dialog`: todo diálogo do sistema troca o
 * `DialogContent` por este aqui, sem mudar mais nada — `Dialog`, `DialogHeader` e `DialogTitle`
 * continuam vindo de `components/ui/dialog`.
 *
 * No desktop (`sm:` e acima) nada muda: o mesmo modal centrado de sempre. A alça só existe
 * visualmente abaixo de `sm`, e é por isso que o gesto de arrastar nunca entra em conflito com a
 * centralização do desktop — não há o que apertar numa alça de tamanho zero.
 */
export type AzuosResponsiveDialogContentProps = ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
};

/** Abaixo disto, arrastar e soltar volta no lugar — não fecha. */
const DISMISS_THRESHOLD_PX = 96;

export function AzuosResponsiveDialogContent({
  className,
  showCloseButton = true,
  children,
  ...rest
}: AzuosResponsiveDialogContentProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const startYRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);

  /* Fora do gesto o estilo inline nem existe, e o desktop continua centrado pelas classes `sm:` de
     sempre — nunca pelo inline, que venceria a classe e descentralizaria o modal. */
  const isActive = isDragging || dragY !== 0;
  const dragStyle = isActive
    ? {
        transform: `translateY(${dragY}px)`,
        transition: isDragging ? 'none' : 'transform 200ms ease-out',
      }
    : undefined;

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    startYRef.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    setDragY(Math.max(0, event.clientY - startYRef.current));
  };

  const onPointerUp = () => {
    if (!isDragging) return;

    setIsDragging(false);
    if (dragY > DISMISS_THRESHOLD_PX) {
      closeRef.current?.click();

      return;
    }

    /* Um quadro a mais antes de zerar: é o que dá tempo da transição acima animar a volta, em vez de
       o conteúdo pular direto para o lugar. */
    requestAnimationFrame(() => setDragY(0));
  };

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        style={dragStyle}
        className={cn(
          /* Celular: nasce de baixo, cantos de cima arredondados — o bottom sheet. */
          'border-border bg-card data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] w-full flex-col rounded-t-3xl border-t p-6 pt-2 shadow-2xl outline-none',
          /* Desktop: volta a ser o modal centrado — as mesmas classes do `DialogContent` base. */
          'sm:rounded-surface sm:data-[state=closed]:fade-out-0 sm:data-[state=closed]:zoom-out-95 sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=open]:fade-in-0 sm:data-[state=open]:zoom-in-95 sm:data-[state=open]:slide-in-from-bottom-0 sm:top-[50%] sm:bottom-auto sm:left-[50%] sm:max-h-none sm:w-full sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:border sm:pt-6 sm:duration-200',
          className,
        )}
        {...rest}
      >
        {/* A alça: só no celular, e por onde se arrasta para fechar. */}
        <div
          className="-mt-1 mb-1 flex shrink-0 cursor-grab touch-none justify-center py-2 sm:hidden"
          data-testid="drag-handle"
          aria-hidden="true"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <span className="bg-muted-foreground/30 h-1.5 w-10 rounded-full" />
        </div>

        {/* Rola como um bloco só, cabeçalho e rodapé inclusos — igual ao bottom sheet nativo. No
            desktop o `sm:max-h-none` do pai já evita precisar disto. */}
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">{children}</div>

        {/* Sem botão visível, o gatilho continua existindo (é nele que o arrastar clica sozinho), mas
            sai do foco e da leitura de tela — do contrário sobraria um botão "Fechar" fantasma no
            tab, sem nada visível que explique o que é. */}
        <DialogPrimitive.Close
          ref={closeRef}
          data-slot="dialog-close"
          tabIndex={showCloseButton ? 0 : -1}
          aria-hidden={showCloseButton ? undefined : true}
          className={
            showCloseButton
              ? 'rounded-chip ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 cursor-pointer opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0'
              : 'sr-only'
          }
        >
          {showCloseButton ? <X className="size-4" aria-hidden="true" /> : null}
          <span className="sr-only">Fechar</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}
