import { afterEach, describe, expect, it, vi } from 'vitest';
import { getClients, saveClient } from '../../planning/services/planningService';
import type { Client, ClientRequest } from '../../planning/types/planning';
import { createClient, listClients, updateClient } from './clientService';

vi.mock('../../planning/services/planningService', () => ({
  getClients: vi.fn(),
  saveClient: vi.fn(),
}));

const getClientsMock = vi.mocked(getClients);
const saveClientMock = vi.mocked(saveClient);

const clients: Client[] = [
  {
    id: 'client-1',
    type: 'INDIVIDUAL',
    name: 'Ana Silva',
    document: '123456789',
    email: 'ana@example.com',
    phone: null,
    street: null,
    city: 'Lisboa',
    state: null,
    zipCode: null,
    active: true,
  },
  {
    id: 'client-2',
    type: 'COMPANY',
    name: 'Obras do Norte',
    document: 'PT987654321',
    email: 'geral@obras.pt',
    phone: null,
    street: null,
    city: 'Porto',
    state: null,
    zipCode: null,
    active: false,
  },
];

const request: ClientRequest = {
  type: 'COMPANY',
  name: 'Construções B&D',
  document: null,
  email: null,
  phone: null,
  street: null,
  city: null,
  state: null,
  zipCode: null,
  active: true,
};

afterEach(() => vi.resetAllMocks());

describe('client service', () => {
  it('filters clients by query, type and status', async () => {
    getClientsMock.mockResolvedValue(clients);

    await expect(listClients({ query: 'obras', type: 'COMPANY', active: false })).resolves.toEqual([
      clients[1],
    ]);
  });

  it('searches by document and email without being case-sensitive', async () => {
    getClientsMock.mockResolvedValue(clients);

    await expect(listClients({ query: 'ANA@EXAMPLE.COM' })).resolves.toEqual([clients[0]]);
    await expect(listClients({ query: 'pt987' })).resolves.toEqual([clients[1]]);
  });

  it('delegates client creation and updates to the planning API contract', async () => {
    saveClientMock.mockResolvedValue({ id: 'client-3', ...request });

    await createClient(request);
    await updateClient('client-3', request);

    expect(saveClientMock).toHaveBeenNthCalledWith(1, request);
    expect(saveClientMock).toHaveBeenNthCalledWith(2, request, 'client-3');
  });
});
