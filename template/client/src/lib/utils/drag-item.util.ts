/**
 * ARRASTAR E SOLTAR com o recurso nativo do navegador — sem biblioteca.
 *
 * O que viaja no arrasto é só o identificador, como texto. Quem solta (uma coluna do quadro,
 * um dia do calendário) lê o identificador e avisa a tela; ninguém guarda "o item que está
 * sendo arrastado" numa variável solta, que ficaria presa quando o arrasto é cancelado.
 */
import { isUuid } from '@template/shared/domain/uuid.util';

const FORMAT = 'text/plain';

type DragEventLike = {
  dataTransfer: Pick<DataTransfer, 'setData' | 'getData'> & { effectAllowed?: string };
};

export function writeDragItem(event: DragEventLike, id: string): void {
  event.dataTransfer.setData(FORMAT, id);
  event.dataTransfer.effectAllowed = 'move';
}

/** O identificador arrastado, ou `null` quando o que chegou não veio de um item da tela. */
export function readDragItem(event: DragEventLike): string | null {
  const raw = event.dataTransfer.getData(FORMAT);

  return isUuid(raw) ? raw : null;
}
