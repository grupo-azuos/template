import { renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';

import { useNotice } from './use-notice';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn(), dismiss: vi.fn() }),
}));

describe('useNotice', () => {
  // feliz
  it('shows a plain notice', () => {
    const { result } = renderHook(() => useNotice());

    result.current.show('Decisão registrada.');

    expect(toast).toHaveBeenCalledWith('Decisão registrada.');
  });

  it('keeps the same model between renders, so effects that depend on it do not rerun', () => {
    const { result, rerender } = renderHook(() => useNotice());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });

  // triste
  it('shows a failure as an error notice', () => {
    const { result } = renderHook(() => useNotice());

    result.current.show('Não foi possível salvar.', 'danger');

    expect(toast.error).toHaveBeenCalledWith('Não foi possível salvar.');
  });

  it('dismisses on request', () => {
    const { result } = renderHook(() => useNotice());

    result.current.dismiss();

    expect(toast.dismiss).toHaveBeenCalled();
  });
});
