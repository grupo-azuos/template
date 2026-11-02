import { type CSSProperties } from 'react';

import { useTheme } from '../../theme/theme';
import { Toaster } from '../ui/sonner';

/**
 * OS AVISOS DE RODAPÉ — "Decisão registrada.", "Reunião iniciada…". Uma frase curta sobre o que
 * acabou de acontecer, no canto de baixo, sobre a tela.
 *
 * É o Sonner (o toast do shadcn, `ui/sonner`), montado UMA vez na casca: quem avisa só chama
 * `useNotice().show(...)`, de qualquer tela. Ele já resolve o que o aviso feito à mão não fazia —
 * empilhar dois avisos seguidos em vez de um apagar o outro, PAUSAR o tempo enquanto o mouse está
 * em cima (quem está lendo não perde a frase no meio), fechar no X e anunciar ao leitor de tela.
 *
 * Todo aviso fica 5 segundos na tela e some sozinho. Um tempo só, para a pessoa aprender o ritmo:
 * antes cada aviso escolhia o seu (3,5 s, 7 s, 9 s…).
 *
 * As cores são os tokens do tema (claro e escuro, pelo mesmo `useTheme` do botão de tema): o
 * aviso comum no fundo de popover; o de falha no fundo vermelho-claro, com a borda neutra — borda
 * colorida é proibida no grupo.
 */
export const TOAST_DURATION_MS = 5000;

export type AzuosToasterProps = {
  ui?: { position?: 'bottom-right' | 'bottom-center' | 'top-right' | 'top-center' };
};

const TOKENS = {
  '--normal-bg': 'var(--popover)',
  '--normal-text': 'var(--popover-foreground)',
  '--normal-border': 'var(--border)',
  '--error-bg': 'var(--destructive-soft)',
  '--error-text': 'var(--destructive)',
  '--error-border': 'var(--border)',
  '--border-radius': 'var(--radius-box)',
} as CSSProperties;

export function AzuosToaster({ ui }: AzuosToasterProps) {
  const { theme } = useTheme();

  return (
    <Toaster
      theme={theme}
      position={ui?.position ?? 'bottom-right'}
      duration={TOAST_DURATION_MS}
      richColors
      closeButton
      containerAriaLabel="Avisos"
      toastOptions={{ closeButtonAriaLabel: 'Fechar aviso' }}
      style={TOKENS}
    />
  );
}
