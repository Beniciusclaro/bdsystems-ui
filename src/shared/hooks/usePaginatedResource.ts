import { useEffect, useRef, useState } from 'react';

import type { PageResult } from '../types/pagination';

export function usePaginatedResource<T, F>(
  loadPage: (page: number, size: number, filters: F) => Promise<PageResult<T>>,
  initialFilters: F,
  fallbackError: string,
  initialPageSize = 10,
) {
  const [rows, setRows] = useState<T[]>([]);

  const [totalElements, setTotalElements] = useState(0);

  const [totalPages, setTotalPages] = useState(0);

  const [page, setPage] = useState(0);

  const [pageSize, setPageSize] = useState(initialPageSize);

  const [filters, setFilters] = useState(initialFilters);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [revision, setRevision] = useState(0);

  const latestRequest = useRef(0);

  useEffect(() => {
    const request = ++latestRequest.current;

    loadPage(page, pageSize, filters)
      .then((result) => {
        if (request !== latestRequest.current) return;
        if (page > 0 && page >= result.page.totalPages) {
          setPage(Math.max(0, result.page.totalPages - 1));
          return;
        }
        setRows(result.content);
        setTotalElements(result.page.totalElements);
        setTotalPages(result.page.totalPages);
      })
      .catch((cause: unknown) => {
        if (request === latestRequest.current) {
          setError(cause instanceof Error ? cause.message : fallbackError);
        }
      })
      .finally(() => {
        if (request === latestRequest.current) setIsLoading(false);
      });

    return () => {
      if (request === latestRequest.current) latestRequest.current += 1;
    };
  }, [loadPage, page, pageSize, filters, revision, fallbackError]);

  const invalidateCurrentRequest = () => {
    latestRequest.current += 1;
  };

  const applyFilters = (nextFilters: F) => {
    invalidateCurrentRequest();
    setIsLoading(true);
    setError(null);
    setPage(0);
    setFilters(nextFilters);
  };

  const goToPage = (nextPage: number) => {
    invalidateCurrentRequest();
    setIsLoading(true);
    setError(null);
    setPage(nextPage);
  };

  const changePageSize = (nextSize: number) => {
    invalidateCurrentRequest();
    setIsLoading(true);
    setError(null);
    setPage(0);
    setPageSize(nextSize);
  };

  const refresh = () => {
    invalidateCurrentRequest();
    setIsLoading(true);
    setError(null);
    setRevision((current) => current + 1);
  };

  return {
    rows,
    totalElements,
    totalPages,
    page,
    pageSize,
    filters,
    isLoading,
    error,
    setError,
    applyFilters,
    goToPage,
    changePageSize,
    refresh,
  };
}
