/**
 * A porta de entrada do `ui/calendar` para os componentes de feature (a agenda do dashboard).
 * Quem mora em `routes/<feature>/components/` não pode importar `lib/components/ui` (é do CLI do
 * shadcn, e a fronteira é `lib/components`); importa daqui. Variante própria entra neste
 * invólucro — nunca no `ui/`.
 */
export { Calendar } from '../ui/calendar';
