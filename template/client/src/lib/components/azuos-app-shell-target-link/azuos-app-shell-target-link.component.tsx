import { Link } from '@tanstack/react-router';
import { type ComponentProps } from 'react';

import { type NavTarget } from '../../navigation/app-shell-navigation';

/**
 * O link de um atalho da casca padrão: rota interna vira `Link` do router, endereço de fora
 * vira `<a>` — e o que abre em outra aba ganha `noopener`. Igual nos 13 sistemas e travado
 * pelo hook `protect-app-shell.mjs`.
 *
 * Repassa `ref` e o resto das props: é o filho de `asChild` do botão do menu e da dica.
 */
export type AzuosAppShellTargetLinkProps = Omit<ComponentProps<'a'>, 'href' | 'target'> & {
  data: { target: NavTarget };
};

export function AzuosAppShellTargetLink({ data, ...props }: AzuosAppShellTargetLinkProps) {
  if ('to' in data.target) return <Link {...props} to={data.target.to} />;

  const opensInNewTab = Boolean(data.target.opensInNewTab);

  return (
    <a
      {...props}
      href={data.target.href}
      target={opensInNewTab ? '_blank' : undefined}
      rel={opensInNewTab ? 'noopener noreferrer' : undefined}
    />
  );
}
