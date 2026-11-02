/**
 * A porta de entrada do `ui/button` para os componentes de feature. Quem mora em
 * `routes/<feature>/components/` não pode importar `lib/components/ui` (é do CLI do shadcn, e a
 * fronteira é `lib/components`); importa daqui. Quando o projeto precisar de variante, altura ou cor
 * própria, é neste invólucro que ela entra — nunca no `ui/`.
 *
 * Para a AÇÃO de uma tela (salvar, exportar, abrir diálogo), o certo é o `AzuosActionButton`: ele já
 * traz variante, régua de altura, estado de carregando e o nome acessível. Este invólucro existe
 * para o botão que não é ação — o gatilho de um menu ou de um popover, que precisa repassar `ref` e
 * `aria-*` para o componente do shadcn que o controla.
 */
export { Button, buttonVariants } from '../ui/button';
