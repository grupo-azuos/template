import { cn } from '../../utils/cn.util';

/**
 * A falha, em vermelho, com o motivo — e ela FICA até a pessoa resolver.
 *
 * É a trava herdada (CONTRIBUTING §15) na forma de componente: aviso que some sozinho queima
 * no primeiro tropeço e cala o resto do dia. Por isso não há temporizador nem botão de
 * fechar; quem tira a mensagem da tela é a próxima tentativa dar certo.
 */
export type AzuosErrorNoticeProps = {
  data: { message: string };
  ui?: { className?: string };
};

export function AzuosErrorNotice({ data, ui }: AzuosErrorNoticeProps) {
  return (
    <p
      role="alert"
      className={cn(
        'bg-destructive/10 text-destructive rounded-box px-3 py-2.5 text-sm font-medium',
        ui?.className,
      )}
    >
      {data.message}
    </p>
  );
}
