import { describe, expect, it } from 'vitest';
import { parsePage } from './parsePage';

const isItem = (value: unknown): value is { id: string } =>
  typeof value === 'object' && value !== null && 'id' in value && typeof value.id === 'string';

describe('parsePage', () => {
  it('keeps typed records and pagination metadata', () => {
    expect(parsePage({
      content: [{ id: 'a' }],
      page: { size: 10, number: 0, totalElements: 1, totalPages: 1 },
    }, isItem, 'invalid')).toEqual({
      content: [{ id: 'a' }],
      page: { size: 10, number: 0, totalElements: 1, totalPages: 1 },
    });
  });

  it('rejects malformed API pages', () => {
    expect(() => parsePage({ content: [{ id: 4 }], page: {} }, isItem, 'invalid'))
      .toThrow('invalid');
  });
});
