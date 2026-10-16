import { getAuthHeaders } from '../lib/session';
import type { SupplierPage, SupplierRequest, SupplierResponse } from '../types/supplier';

function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL;
  return configured ? configured.replace(/\/$/, '') : '';
}

const API_BASE_URL = resolveApiBaseUrl();

async function getErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const serverError: unknown = await response.json();
    if (
      typeof serverError === 'object' &&
      serverError !== null &&
      'message' in serverError &&
      typeof serverError.message === 'string'
    ) {
      return serverError.message;
    }
  } catch {
    return fallback;
  }

  return fallback;
}

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
  if (
    !isRecord(value) ||
    !Array.isArray(value.content) ||
    !value.content.every(isSupplier) ||
    !isRecord(value.page) ||
    typeof value.page.size !== 'number' ||
    typeof value.page.number !== 'number' ||
    typeof value.page.totalElements !== 'number' ||
    typeof value.page.totalPages !== 'number'
  ) {
    throw new Error('A resposta da lista de fornecedores está em um formato inválido.');
  }

  return {
    content: value.content.map((supplier) => ({
      ...supplier,
      tradeName: supplier.tradeName ?? null,
      taxNumber: supplier.taxNumber ?? null,
      email: supplier.email ?? null,
      phoneNumber: supplier.phoneNumber ?? null,
    })),
    page: {
      size: value.page.size,
      number: value.page.number,
      totalElements: value.page.totalElements,
      totalPages: value.page.totalPages,
    },
  };
}

export async function getSuppliers(page: number, size: number): Promise<SupplierPage> {
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort: 'legalName,asc',
  });
  const response = await fetch(`${API_BASE_URL}/api/suppliers?${query}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Não foi possível carregar os fornecedores.'));
  }

  return parseSupplierPage(await response.json());
}

export async function createSupplier(payload: SupplierRequest): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/suppliers`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Não foi possível cadastrar o fornecedor.'));
  }
}

export async function updateSupplier(
  supplierId: string,
  payload: SupplierRequest,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/suppliers/${encodeURIComponent(supplierId)}`,
    {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Não foi possível atualizar o fornecedor.'));
  }
}

export async function deleteSupplier(supplierId: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/suppliers/${encodeURIComponent(supplierId)}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Não foi possível excluir o fornecedor.'));
  }
}
