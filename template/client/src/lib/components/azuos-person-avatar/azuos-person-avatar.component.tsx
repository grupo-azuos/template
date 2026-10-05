import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '../../utils/cn.util';

/**
 * A pessoa, em duas letras.
 *
 * As iniciais não são enfeite: numa lista de trinta linhas, o olho acha "MR" antes de ler "Mariana
 * Ribeiro". Duas letras bastam — nome comprido no avatar vira borrão ilegível.
 */
export type AzuosPersonAvatarProps = {
  name: string;
  /**
   * Hoje ninguém tem foto — não existe tabela de usuário, então não há de onde vir uma. O campo já
   * existe para o dia em que a identidade resolver o nome para uma pessoa de verdade: quem usa
   * `AzuosPersonAvatar` não muda, só passa a receber `avatarUrl`.
   */
  avatarUrl?: string | null;
  ui?: { size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string };
};

const SIZE_CLASS = {
  sm: 'size-6 text-xs',
  md: 'size-8 text-xs',
  lg: 'size-12 text-sm',
  xl: 'size-16 text-lg',
} as const;

/** Duas iniciais bastam; nome comprido no avatar vira borrão ilegível. */
export function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function AzuosPersonAvatar({ name, avatarUrl, ui }: AzuosPersonAvatarProps) {
  const size = ui?.size ?? 'sm';

  return (
    <Avatar
      className={cn(
        'relative flex aspect-square shrink-0 overflow-hidden rounded-full',
        SIZE_CLASS[size],
        ui?.className,
      )}
    >
      {avatarUrl ? (
        <AvatarImage
          src={avatarUrl}
          alt={name}
          className="aspect-square size-full rounded-full object-cover"
        />
      ) : null}

      {/* O degradê é o mesmo para todo mundo, de propósito: cor por pessoa (um hash do nome)
          inventa um significado que não existe, e duas pessoas diferentes caem na mesma cor assim
          que a lista passa de umas poucas linhas. */}
      <AvatarFallback
        className={cn(
          'from-success to-info text-primary-foreground flex aspect-square size-full items-center justify-center rounded-full bg-gradient-to-br font-bold select-none',
          SIZE_CLASS[size],
        )}
      >
        {initialsOf(name)}
      </AvatarFallback>
    </Avatar>
  );
}
