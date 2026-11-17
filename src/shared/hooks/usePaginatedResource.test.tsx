import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePaginatedResource } from './usePaginatedResource';

type Filter = { q?: string };
const page = (content: string[], number: number, totalPages = 3) => ({
  content,
  page: { number, size: 10, totalElements: totalPages * 10, totalPages },
});

const pageWithSize = (content: string[], size: number) => ({
  content,
  page: { number: 0, size, totalElements: content.length, totalPages: 1 },
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

  it('keeps the latest 50-item response when an older 10-item request finishes last', async () => {
    const oldBudgets = Array.from({ length: 10 }, (_, index) => `ORC-2026-${index + 1}`);

    const currentBudgets = ['OCR-001-Const', '001', '100', ...oldBudgets];

    let resolveOldRequest!: (value: ReturnType<typeof pageWithSize>) => void;

    let resolveCurrentRequest!: (value: ReturnType<typeof pageWithSize>) => void;

    const oldRequest = new Promise<ReturnType<typeof pageWithSize>>((resolve) => {
      resolveOldRequest = resolve;
    });

    const currentRequest = new Promise<ReturnType<typeof pageWithSize>>((resolve) => {
      resolveCurrentRequest = resolve;
    });

    const load = vi
      .fn()
      .mockResolvedValueOnce(pageWithSize(oldBudgets, 10))
      .mockReturnValueOnce(oldRequest)
      .mockReturnValueOnce(currentRequest);

    const { result } = renderHook(() => usePaginatedResource(load, {} as Filter, 'fallback'));

    await waitFor(() => expect(result.current.rows).toEqual(oldBudgets));

    act(() => result.current.refresh());

    await waitFor(() => expect(load).toHaveBeenCalledTimes(2));

    act(() => result.current.changePageSize(50));

    await waitFor(() => expect(load).toHaveBeenCalledTimes(3));

    await act(async () => resolveCurrentRequest(pageWithSize(currentBudgets, 50)));

    expect(result.current.pageSize).toBe(50);
    expect(result.current.rows).toHaveLength(13);
    expect(result.current.rows).toContain('OCR-001-Const');

    await act(async () => resolveOldRequest(pageWithSize(oldBudgets, 10)));

    expect(result.current.pageSize).toBe(50);
    expect(result.current.rows).toEqual(currentBudgets);
    expect(result.current.isLoading).toBe(false);
    expect(load).toHaveBeenLastCalledWith(0, 50, {});
  });

  it('keeps loading when an invalidated request settles before the effect cleanup', async () => {
    const oldBudgets = Array.from({ length: 10 }, (_, index) => `ORC-2026-${index + 1}`);

    const currentBudgets = ['OCR-001-Const', '001', '100', ...oldBudgets];

    let resolveOldRequest!: (value: ReturnType<typeof pageWithSize>) => void;

    let resolveCurrentRequest!: (value: ReturnType<typeof pageWithSize>) => void;

    const oldRequest = new Promise<ReturnType<typeof pageWithSize>>((resolve) => {
      resolveOldRequest = resolve;
    });

    const currentRequest = new Promise<ReturnType<typeof pageWithSize>>((resolve) => {
      resolveCurrentRequest = resolve;
    });

    const load = vi
      .fn()
      .mockResolvedValueOnce(pageWithSize(oldBudgets, 10))
      .mockReturnValueOnce(oldRequest)
      .mockReturnValueOnce(currentRequest);

    const { result } = renderHook(() => usePaginatedResource(load, {} as Filter, 'fallback'));

    await waitFor(() => expect(result.current.rows).toEqual(oldBudgets));

    act(() => result.current.refresh());

    await waitFor(() => expect(load).toHaveBeenCalledTimes(2));

    await act(async () => {
      result.current.changePageSize(50);
      resolveOldRequest(pageWithSize(oldBudgets, 10));
      await Promise.resolve();
    });

    await waitFor(() => expect(load).toHaveBeenCalledTimes(3));
    expect(result.current.pageSize).toBe(50);
    expect(result.current.isLoading).toBe(true);

    await act(async () => resolveCurrentRequest(pageWithSize(currentBudgets, 50)));

    expect(result.current.rows).toHaveLength(13);
    expect(result.current.rows).toContain('OCR-001-Const');
    expect(result.current.isLoading).toBe(false);
  });
});
