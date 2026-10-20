import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePaginatedResource } from './usePaginatedResource';

type Filter = { q?: string };
const page = (content: string[], number: number, totalPages = 3) => ({
  content,
  page: { number, size: 10, totalElements: totalPages * 10, totalPages },
});

describe('usePaginatedResource', () => {
  it('applies filters, resets pagination, and refreshes after an error', async () => {
    const load = vi
      .fn(async () => page([], 0))
      .mockResolvedValueOnce(page(['first'], 0))
      .mockResolvedValueOnce(page(['second'], 1))
      .mockRejectedValueOnce(new Error('falha'))
      .mockResolvedValueOnce(page(['filtered'], 0, 1));

    const { result } = renderHook(() => usePaginatedResource(load, {} as Filter, 'fallback'));
    await waitFor(() => expect(result.current.rows).toEqual(['first']));
    act(() => result.current.goToPage(1));
    await waitFor(() => expect(result.current.rows).toEqual(['second']));
    act(() => result.current.applyFilters({ q: 'abc' }));
    await waitFor(() => expect(result.current.error).toBe('falha'));
    expect(result.current.page).toBe(0);
    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.rows).toEqual(['filtered']));
    expect(load).toHaveBeenLastCalledWith(0, 10, { q: 'abc' });
  });

  it('ignores stale responses and clamps the page after the last item is removed', async () => {
    let resolveLater!: (value: ReturnType<typeof page>) => void;

    const delayed = new Promise<ReturnType<typeof page>>((resolve) => {
      resolveLater = resolve;
    });

    const load = vi
      .fn()
      .mockResolvedValueOnce(page(['first'], 0, 3))
      .mockReturnValueOnce(delayed)
      .mockResolvedValueOnce(page(['latest'], 0, 1));

    const { result } = renderHook(() => usePaginatedResource(load, {} as Filter, 'fallback'));
    await waitFor(() => expect(result.current.rows).toEqual(['first']));
    act(() => result.current.goToPage(2));
    act(() => result.current.goToPage(0));
    await waitFor(() => expect(result.current.rows).toEqual(['latest']));
    await act(async () => resolveLater(page(['stale'], 2, 3)));
    expect(result.current.rows).toEqual(['latest']);
  });
});
