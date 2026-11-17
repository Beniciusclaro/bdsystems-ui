import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '../../../shared/api/client';
import {
  getBudgetsPage,
  getCompositionsPage,
  getLaborReferencePositions,
  getLaborRolesPage,
  getProjectsPage,
} from './planningService';

vi.mock('../../../shared/api/client', () => ({ apiFetch: vi.fn() }));

const fetchMock = vi.mocked(apiFetch);

const emptyPage = () =>
  new Response(
    JSON.stringify({
      content: [],
      page: { number: 0, size: 10, totalElements: 0, totalPages: 0 },
    }),
  );

afterEach(() => vi.resetAllMocks());

describe('planning paginated API contract', () => {
  it.each([
    [
      'budgets',
      () => getBudgetsPage(2, 20, { search: 'Casa', status: 'DRAFT' }),
      { page: '2', size: '20', sort: 'createdAt,desc', search: 'Casa', status: 'DRAFT' },
    ],
    [
      'projects',
      () => getProjectsPage(1, 50, { search: 'OBR', status: 'ACTIVE' }),
      { page: '1', size: '50', sort: 'name,asc', search: 'OBR', status: 'ACTIVE' },
    ],
    [
      'compositions',
      () => getCompositionsPage(0, 10, { search: 'Piso', active: false }),
      { page: '0', size: '10', sort: 'name,asc', search: 'Piso', active: 'false' },
    ],
    [
      'labor-roles',
      () => getLaborRolesPage(0, 10, { search: 'PED', active: true }),
      { page: '0', size: '10', sort: 'name,asc', search: 'PED', active: 'true' },
    ],
  ])('sends pagination and filters to /%s', async (pathName, request, expected) => {
    fetchMock.mockResolvedValue(emptyPage());
    await request();

    const [path] = fetchMock.mock.calls[0];

    const url = new URL(path, 'http://localhost');

    expect(url.pathname).toBe(`/api/${pathName}`);
    expect(Object.fromEntries(url.searchParams)).toEqual(expected);
  });
});

it('loads labor reference positions from the dedicated endpoint', async () => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify(['Pedreiro', 'Servente'])));

  await expect(getLaborReferencePositions()).resolves.toEqual(['Pedreiro', 'Servente']);
  expect(fetchMock).toHaveBeenCalledWith('/api/labor-roles/reference-positions', {
    method: 'GET',
  });
});
