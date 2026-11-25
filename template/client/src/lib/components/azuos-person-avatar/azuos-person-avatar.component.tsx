import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { usePersonPhoto } from '../../hooks/use-person-photo/use-person-photo';
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
   * A foto vem do admin-console (a pessoa logada, no menu e no Perfil). Sem foto, ou se ela não
   * carregar, ficam as iniciais.
   */
  avatarUrl?: string | null;
  /** O id da pessoa no diretório: sem `avatarUrl`, o rosto acha a foto por ele. */
  personId?: string | null;
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

/**
 * REGRA DO GRUPO: onde aparece uma pessoa, aparece a FOTO dela. Sem `avatarUrl`, o rosto procura
 * a foto no diretório de pessoas pelo `personId` — ou pelo `name`, quando o registro só guardou o
 * nome. As iniciais só aparecem quando a pessoa não tem foto mesmo.
 */
export function AzuosPersonAvatar({ name, avatarUrl, personId, ui }: AzuosPersonAvatarProps) {
  const size = ui?.size ?? 'sm';
  const directoryPhoto = usePersonPhoto({ id: personId, name });
  const photo = avatarUrl || directoryPhoto;

  return (
    <Avatar
      className={cn(
        'relative flex aspect-square shrink-0 overflow-hidden rounded-full',
        SIZE_CLASS[size],
        ui?.className,
      )}
    >
      {photo ? (
        <AvatarImage
          src={photo}
          alt={name}
          className="aspect-square size-full rounded-full object-cover"
        />
      ) : null}

      {/* O degradê é o mesmo para todo mundo, de propósito: cor por pessoa (um hash do nome)
          inventa um significado que não existe, e duas pessoas diferentes caem na mesma cor assim
          que a lista passa de umas poucas linhas. */}
      <AvatarFallback
        className={cn(
          'bg-primary text-primary-foreground flex aspect-square size-full items-center justify-center rounded-full font-bold select-none',
          SIZE_CLASS[size],
        )}
      >
        {initialsOf(name)}
      </AvatarFallback>
    </Avatar>
  );
}
