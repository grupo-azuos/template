import { cn } from '../../utils/cn.util';

/**
 * A foto de quem está usando, na casca padrão. Igual nos 13 sistemas e travado pelo hook
 * `protect-app-shell.mjs`.
 *
 * A foto cobre as iniciais quando carrega; quando não carrega — pessoa sem foto, ou sem sessão
 * no admin-console, que é o caso do desenvolvimento local —, as iniciais continuam embaixo.
 */
export type AzuosAppShellAvatarProps = {
  data: { name: string; avatarUrl?: string | null };
  ui?: { className?: string };
};

export function AzuosAppShellAvatar({ data, ui }: AzuosAppShellAvatarProps) {
  return (
    <span
      className={cn(
        'bg-brand-yellow-400 text-brand-blue-900 relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold',
        ui?.className,
      )}
    >
      {initialsOf(data.name)}
      {data.avatarUrl ? (
        <img src={data.avatarUrl} alt="" className="absolute inset-0 size-full object-cover" />
      ) : null}
    </span>
  );
}

/** Duas iniciais bastam; nome comprido no avatar vira borrão ilegível. */
export function initialsOf(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return initials || '?';
}
