import { getApiErrorMessage } from '../../../shared/api/apiError';
import { apiFetch } from '../../../shared/api/client';
import { getClients, saveClient } from '../../planning/services/planningService';
import type { Client, ClientRequest } from '../../planning/types/planning';

export interface ClientFilters {
  query?: string;
  type?: Client['type'] | '';
  active?: boolean | '';
}

export async function listClients(filters: ClientFilters = {}): Promise<Client[]> {
  const clients = await getClients();

  const query = filters.query?.trim().toLocaleLowerCase('pt-PT') ?? '';

  return clients.filter((client) => {
    const matchesQuery =
      !query ||
      client.name.toLocaleLowerCase('pt-PT').includes(query) ||
      client.document?.toLocaleLowerCase('pt-PT').includes(query) ||
      client.email?.toLocaleLowerCase('pt-PT').includes(query);

    const matchesType = !filters.type || client.type === filters.type;

    const matchesStatus =
      filters.active === undefined || filters.active === '' || client.active === filters.active;

    return matchesQuery && matchesType && matchesStatus;
  });
}

export function createClient(payload: ClientRequest): Promise<Client> {
  return saveClient(payload);
}

export function updateClient(clientId: string, payload: ClientRequest): Promise<Client> {
  return saveClient(payload, clientId);
}

export async function deleteClient(clientId: string): Promise<void> {
  const response = await apiFetch(`/api/clients/${encodeURIComponent(clientId)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, 'Não foi possível excluir o cliente.'));
  }
}
