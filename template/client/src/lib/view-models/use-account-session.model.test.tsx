import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { leaveAccountSession, signOutAccount } from '../api/account-session.api';
import { useAccountSessionModel } from './use-account-session.model';

vi.mock('../api/account-session.api', () => ({
  signOutAccount: vi.fn(),
  leaveAccountSession: vi.fn(),
}));
beforeEach(() => vi.resetAllMocks());
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  client.setQueryData(['private-records'], ['sensitive']);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, ...renderHook(useAccountSessionModel, { wrapper }) };
}
describe('useAccountSessionModel', () => {
  // feliz
  it('clears cached data and leaves only after the provider confirms logout', async () => {
    let finish: (() => void) | undefined;
    vi.mocked(signOutAccount).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const { result, client } = setup();
    act(() => result.current.actions.onSignOut());
    await waitFor(() => expect(result.current.state.isSigningOut).toBe(true));
    expect(client.getQueryData(['private-records'])).toEqual(['sensitive']);
    expect(leaveAccountSession).not.toHaveBeenCalled();
    await act(async () => finish?.());
    await waitFor(() => expect(leaveAccountSession).toHaveBeenCalledOnce());
    expect(client.getQueryData(['private-records'])).toBeUndefined();
  });
  // triste
  it('keeps the current session and offers retry when logout fails', async () => {
    vi.mocked(signOutAccount).mockRejectedValue(new Error('Offline'));
    const { result, client } = setup();
    act(() => result.current.actions.onSignOut());
    await waitFor(() => expect(result.current.state.error).toMatch(/Tente novamente/));
    expect(leaveAccountSession).not.toHaveBeenCalled();
    expect(client.getQueryData(['private-records'])).toEqual(['sensitive']);
    vi.mocked(signOutAccount).mockResolvedValue();
    act(() => result.current.actions.onSignOut());
    await waitFor(() => expect(leaveAccountSession).toHaveBeenCalledOnce());
  });
});
