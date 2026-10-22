import { parsePage } from '../../../shared/api/parsePage';
import { getApiErrorMessage } from '../../../shared/api/apiError';
import { apiFetch } from '../../../shared/api/client';
import type { SupplierPage, SupplierRequest, SupplierResponse } from '../types/supplier';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isOptionalNullableString(value: unknown): value is string | null | undefined {
  return value === undefined || typeof value === 'string' || value === null;
}

function isSupplierAddress(value: unknown): value is SupplierResponse['address'] {
  return (
    isRecord(value) &&
    typeof value.street === 'string' &&
    typeof value.city === 'string' &&
    typeof value.state === 'string' &&
    typeof value.zipCode === 'string'
  );
}

function isSupplier(value: unknown): value is SupplierResponse {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.legalName === 'string' &&
    isOptionalNullableString(value.tradeName) &&
    isOptionalNullableString(value.taxNumber) &&
    isOptionalNullableString(value.email) &&
    isOptionalNullableString(value.phoneNumber) &&
    isSupplierAddress(value.address) &&
    typeof value.companyId === 'string' &&
    typeof value.active === 'boolean'
  );
}

function parseSupplierPage(value: unknown): SupplierPage {
  return parsePage<SupplierResponse>(
    value,
    isSupplier,
    'A resposta da lista de fornecedores está em um formato inválido.',
    (supplier) => ({
      ...supplier,
      tradeName: supplier.tradeName ?? null,
      taxNumber: supplier.taxNumber ?? null,
      email: supplier.email ?? null,
      phoneNumber: supplier.phoneNumber ?? null,
    }),
  );
}

export class SupplierNotFoundError extends Error {}

export interface SupplierListFilters {
  name?: string;
  taxNumber?: string;
}

export async function getSupplier(supplierId: string): Promise<SupplierResponse> {
  const response = await apiFetch(`/api/suppliers/${encodeURIComponent(supplierId)}`);
  if (response.status === 404) {
    throw new SupplierNotFoundError('Fornecedor não encontrado.');
  }
  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, 'Não foi possível carregar o fornecedor.'));
  }
  const value: unknown = await response.json();
  if (!isSupplier(value)) {
    throw new Error('A resposta do fornecedor está em um formato inválido.');
  }
  return {
    ...value,
    tradeName: value.tradeName ?? null,
    taxNumber: value.taxNumber ?? null,
    email: value.email ?? null,
    phoneNumber: value.phoneNumber ?? null,
  };
}

export async function getSuppliers(
  page: number,
  size: number,
  filters: SupplierListFilters = {},
): Promise<SupplierPage> {
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort: 'legalName,asc',
  });

  if (filters.name) query.set('name', filters.name);
  if (filters.taxNumber) query.set('taxNumber', filters.taxNumber);

  const response = await apiFetch(`/api/suppliers?${query}`);

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(response, 'Não foi possível carregar os fornecedores.'),
    );
  }

  return parseSupplierPage(await response.json());
}

export async function getAllSuppliers(): Promise<SupplierResponse[]> {
  const suppliers: SupplierResponse[] = [];

  let page = 0;

  let totalPages = 1;

  while (page < totalPages) {
    const result = await getSuppliers(page, 100);
    suppliers.push(...result.content);
    totalPages = result.page.totalPages;
    page += 1;
  }

  return suppliers;
}

export async function createSupplier(payload: SupplierRequest): Promise<void> {
  const response = await apiFetch(`/api/suppliers`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, 'Não foi possível cadastrar o fornecedor.'));
  }
}

export async function updateSupplier(supplierId: string, payload: SupplierRequest): Promise<void> {
  const response = await apiFetch(`/api/suppliers/${encodeURIComponent(supplierId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, 'Não foi possível atualizar o fornecedor.'));
  }
}

export async function deleteSupplier(supplierId: string): Promise<void> {
  const response = await apiFetch(`/api/suppliers/${encodeURIComponent(supplierId)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, 'Não foi possível excluir o fornecedor.'));
  }
}
