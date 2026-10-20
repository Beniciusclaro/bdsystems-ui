import { useEffect, useState } from 'react';

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

  useEffect(() => {
    let active = true;
    loadPage(page, pageSize, filters)
      .then((result) => {
        if (!active) return;
        if (page > 0 && page >= result.page.totalPages) {
          setPage(Math.max(0, result.page.totalPages - 1));
          return;
        }
        setRows(result.content);
        setTotalElements(result.page.totalElements);
        setTotalPages(result.page.totalPages);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : fallbackError);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadPage, page, pageSize, filters, revision, fallbackError]);

  const applyFilters = (nextFilters: F) => {
    setIsLoading(true);
    setError(null);
    setPage(0);
    setFilters(nextFilters);
  };
  const goToPage = (nextPage: number) => {
    setIsLoading(true);
    setError(null);
    setPage(nextPage);
  };
  const changePageSize = (nextSize: number) => {
    setIsLoading(true);
    setError(null);
    setPage(0);
    setPageSize(nextSize);
  };
  const refresh = () => {
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
