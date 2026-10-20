import { apiFetch } from '../../../shared/api/client';
import { getApiErrorMessage } from '../../../shared/api/apiError';
import { parsePage } from '../../../shared/api/parsePage';
import type { PageResult } from '../../../shared/types/pagination';
import type {
  Material,
  MaterialCategory,
  MaterialFilters,
  MaterialRequest,
  MaterialSupplier,
  UnitOfMeasure,
} from '../types/material';

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const catalog = (value: unknown): value is MaterialCategory =>
  record(value) &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  typeof value.active === 'boolean';

const unit = (value: unknown): value is UnitOfMeasure =>
  catalog(value) &&
  'symbol' in value &&
  typeof value.symbol === 'string' &&
  'code' in value &&
  typeof value.code === 'string';

const material = (value: unknown): value is Material =>
  catalog(value) &&
  'code' in value &&
  typeof value.code === 'string' &&
  'unitOfMeasure' in value &&
  unit(value.unitOfMeasure) &&
  'category' in value &&
  (value.category == null || catalog(value.category));

const association = (value: unknown): value is MaterialSupplier =>
  record(value) &&
  typeof value.id === 'string' &&
  typeof value.supplierId === 'string' &&
  typeof value.supplierName === 'string' &&
  (value.referencePrice == null || typeof value.referencePrice === 'number');
async function request(path: string, method = 'GET', body?: unknown) {
  const response = await apiFetch(`/api${path}`, {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok)
    throw new Error(
      await getApiErrorMessage(response, 'Não foi possível concluir a operação de materiais.'),
    );
  return response;
}
async function page<T>(
  path: string,
  index: number,
  size: number,
  guard: (value: unknown) => value is T,
  filters: object = {},
): Promise<PageResult<T>> {
  const query = new URLSearchParams({ page: String(index), size: String(size) });
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  return parsePage(
    await (await request(`${path}?${query}`)).json(),
    guard,
    'A resposta da API está em um formato inválido.',
  );
}
async function all<T>(path: string, guard: (value: unknown) => value is T): Promise<T[]> {
  const rows: T[] = [];
  for (let index = 0, pages = 1; index < pages; index++) {
    const result = await page(path, index, 100, guard);
    rows.push(...result.content);
    pages = result.page.totalPages;
  }
  return rows;
}
export const getMaterials = (index: number, size: number, filters: MaterialFilters) =>
  page('/materials', index, size, material, { sort: 'name,asc', ...filters });
export async function getMaterial(id: string): Promise<Material> {
  const value: unknown = await (await request(`/materials/${encodeURIComponent(id)}`)).json();
  if (!material(value)) throw new Error('Resposta do material inválida.');
  return value;
}
export const getCategories = () => all('/material-categories', catalog);
export const getUnits = () => all('/units-of-measure', unit);
export const getMaterialSuppliers = (id: string) =>
  all(`/materials/${encodeURIComponent(id)}/suppliers`, association);
export async function saveMaterial(
  id: string | undefined,
  payload: MaterialRequest,
): Promise<Material> {
  const value: unknown = await (
    await request(
      id ? `/materials/${encodeURIComponent(id)}` : '/materials',
      id ? 'PUT' : 'POST',
      payload,
    )
  ).json();
  if (!material(value)) throw new Error('Resposta do material inválida.');
  return value;
}
export async function removeMaterialSupplier(id: string, associationId: string) {
  await request(
    `/materials/${encodeURIComponent(id)}/suppliers/${encodeURIComponent(associationId)}`,
    'DELETE',
  );
}
export async function setMaterialStatus(id: string, active: boolean) {
  await request(`/materials/${encodeURIComponent(id)}/status`, 'PATCH', { active });
}
export async function saveCategory(
  id: string | undefined,
  payload: Omit<MaterialCategory, 'id'>,
): Promise<MaterialCategory> {
  const value: unknown = await (
    await request(
      id ? `/material-categories/${encodeURIComponent(id)}` : '/material-categories',
      id ? 'PUT' : 'POST',
      payload,
    )
  ).json();
  if (!catalog(value)) throw new Error('Resposta da categoria inválida.');
  return value;
}
