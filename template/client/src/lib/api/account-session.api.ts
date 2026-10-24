/** Só o admin-console recebe os cookies de sessão; os outros sistemas não os manipulam. */
export function accountOrigin(
  hostname = window.location.hostname,
  configured = import.meta.env.VITE_ACCOUNT_URL ?? '',
): string {
  if (configured) return new URL(configured).origin;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'http://localhost:5000';
  if (hostname.endsWith('.homo.grupoazuos.com.br'))
    return 'https://admin-console.homo.grupoazuos.com.br';
  if (hostname === 'grupoazuos.com.br' || hostname.endsWith('.grupoazuos.com.br'))
    return 'https://admin-console.grupoazuos.com.br';

  throw new Error('O endereço da conta não foi configurado. Fale com quem administra o sistema.');
}

export async function signOutAccount(): Promise<void> {
  const response = await fetch(new URL('/api/auth/logout', accountOrigin()), {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: '{}',
    redirect: 'error',
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error('Não consegui encerrar a sessão. Tente novamente.');
}

export function leaveAccountSession(): void {
  window.location.assign(new URL('/', accountOrigin()).href);
}

export function accountProfileUrl(): string | null {
  try {
    return new URL('/profile', accountOrigin()).href;
  } catch {
    return null;
  }
}
