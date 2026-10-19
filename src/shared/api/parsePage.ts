import type { PageResult } from '../types/pagination';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function parsePage<T>(
  value: unknown,
  isItem: (candidate: unknown) => candidate is T,
  invalidMessage: string,
  normalize: (item: T) => T = (item) => item,
): PageResult<T> {
  if (
    !isRecord(value) ||
    !Array.isArray(value.content) ||
    !value.content.every(isItem) ||
    !isRecord(value.page) ||
    typeof value.page.size !== 'number' ||
    typeof value.page.number !== 'number' ||
    typeof value.page.totalElements !== 'number' ||
    typeof value.page.totalPages !== 'number'
  ) {
    throw new Error(invalidMessage);
  }

  return {
    content: value.content.map(normalize),
    page: {
      size: value.page.size,
      number: value.page.number,
      totalElements: value.page.totalElements,
      totalPages: value.page.totalPages,
    },
  };
}
