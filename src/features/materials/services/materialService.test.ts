import { afterEach, describe, expect, it, vi } from 'vitest';
import { getMaterials, removeMaterialSupplier, saveMaterial } from './materialService';
vi.mock('../../../shared/api/client', () => ({ apiFetch: vi.fn() }));
import { apiFetch } from '../../../shared/api/client';
const fetchMock = vi.mocked(apiFetch);
afterEach(() => vi.resetAllMocks());
describe('material API contract', () => {
  it('combines backend filters with pagination and sorting', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          content: [],
          page: { number: 2, size: 10, totalElements: 0, totalPages: 0 },
        }),
      ),
    );
    const result = await getMaterials(2, 10, {
      name: 'Cimento',
      code: 'MAT',
      categoryId: 'category',
      active: false,
      sort: 'code,asc',
    });

    const [path] = fetchMock.mock.calls[0];

    const query = new URL(path, 'http://localhost').searchParams;
    expect(path.startsWith('/api/materials?')).toBe(true);
    expect(Object.fromEntries(query)).toEqual({
      page: '2',
      size: '10',
      name: 'Cimento',
      code: 'MAT',
      categoryId: 'category',
      active: 'false',
      sort: 'code,asc',
    });
    expect(result.content).toEqual([]);
  });
  it('surfaces backend validation failures', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Código duplicado.' }), { status: 409 }),
    );
    await expect(
      saveMaterial(undefined, {
        code: 'MAT',
        name: 'Cimento',
        description: '',
        categoryId: null,
        unitOfMeasureId: 'unit',
        active: true,
        suppliers: [],
      }),
    ).rejects.toThrow('Código duplicado.');
  });
  it('removes associations through DELETE rather than omitting them from PUT', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await removeMaterialSupplier('material', 'association');
    expect(fetchMock).toHaveBeenCalledWith('/api/materials/material/suppliers/association', {
      method: 'DELETE',
    });
  });
});
