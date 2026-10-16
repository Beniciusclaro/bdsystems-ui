import { getAuthHeaders } from '../lib/session';
import { getApiErrorMessage } from './apiError';
import type {
  RentalPeriod,
  ToolRentalPage,
  ToolRentalRequest,
  ToolRentalResponse,
} from '../types/toolRental';

function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL;
  return configured ? configured.replace(/\/$/, '') : '';
}

const API_BASE_URL = resolveApiBaseUrl();
const RENTAL_PAGE_SIZE = 100;
const RENTAL_PERIODS = new Set<string>(['HOUR', 'DAY', 'WEEK', 'MONTH']);

const RENTAL_ERROR_MESSAGES: Partial<Record<number, string>> = {
  400: 'Confira o preço, o período e as datas informadas.',
  401: 'Sua sessão expirou. Entre novamente para continuar.',
  404: 'A ferramenta, o fornecedor ou o registo de aluguer não foi encontrado ou está inativo.',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isRentalPeriod(value: unknown): value is RentalPeriod {
  return typeof value === 'string' && RENTAL_PERIODS.has(value);
}

function isOptionalNullableString(value: unknown): value is string | null | undefined {
  return value === undefined || typeof value === 'string' || value === null;
}

function isToolRental(value: unknown): value is ToolRentalResponse {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.toolId === 'string' &&
    typeof value.supplierId === 'string' &&
    typeof value.price === 'number' &&
    isRentalPeriod(value.rentalPeriod) &&
    isOptionalNullableString(value.rentalStartDate) &&
    isOptionalNullableString(value.rentalEndDate)
  );
}

function parseToolRentalPage(value: unknown): ToolRentalPage {
  if (
    !isRecord(value) ||
    !Array.isArray(value.content) ||
    !value.content.every(isToolRental) ||
    !isRecord(value.page) ||
    typeof value.page.size !== 'number' ||
    typeof value.page.number !== 'number' ||
    typeof value.page.totalElements !== 'number' ||
    typeof value.page.totalPages !== 'number'
  ) {
    throw new Error('A resposta da lista de alugueres está em um formato inválido.');
  }

  return {
    content: value.content.map((rental) => ({
      ...rental,
      rentalStartDate: rental.rentalStartDate ?? null,
      rentalEndDate: rental.rentalEndDate ?? null,
    })),
    page: {
      size: value.page.size,
      number: value.page.number,
      totalElements: value.page.totalElements,
      totalPages: value.page.totalPages,
    },
  };
}

export async function getAllToolRentals(): Promise<ToolRentalResponse[]> {
  const rentals: ToolRentalResponse[] = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const query = new URLSearchParams({
      page: String(page),
      size: String(RENTAL_PAGE_SIZE),
      sort: 'createdAt,desc',
    });
    const response = await fetch(`${API_BASE_URL}/api/tool-rentals?${query}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(await getApiErrorMessage(
        response,
        'Não foi possível carregar os registos de aluguer.',
        RENTAL_ERROR_MESSAGES,
      ));
    }

    const result = parseToolRentalPage(await response.json());
    rentals.push(...result.content);
    totalPages = result.page.totalPages;
    page += 1;
  }

  return rentals;
}

export async function getToolRentals(toolId: string): Promise<ToolRentalResponse[]> {
  const rentals: ToolRentalResponse[] = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const query = new URLSearchParams({
      page: String(page),
      size: String(RENTAL_PAGE_SIZE),
      sort: 'createdAt,desc',
    });
    const response = await fetch(
      `${API_BASE_URL}/api/tools/${encodeURIComponent(toolId)}/rentals?${query}`,
      { headers: getAuthHeaders() },
    );
    if (!response.ok) {
      throw new Error(await getApiErrorMessage(
        response,
        'Não foi possível carregar os registos de aluguer desta ferramenta.',
        RENTAL_ERROR_MESSAGES,
      ));
    }

    const result = parseToolRentalPage(await response.json());
    rentals.push(...result.content);
    totalPages = result.page.totalPages;
    page += 1;
  }

  return rentals;
}

export async function createToolRental(payload: ToolRentalRequest): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/tool-rentals`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await getApiErrorMessage(
      response,
      'Não foi possível cadastrar o registo de aluguer.',
      RENTAL_ERROR_MESSAGES,
    ));
  }
}

export async function updateToolRental(
  rentalId: string,
  payload: ToolRentalRequest,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/tool-rentals/${encodeURIComponent(rentalId)}`,
    {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
  );
  if (!response.ok) {
    throw new Error(await getApiErrorMessage(
      response,
      'Não foi possível atualizar o registo de aluguer.',
      RENTAL_ERROR_MESSAGES,
    ));
  }
}

export async function deleteToolRental(rentalId: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/tool-rentals/${encodeURIComponent(rentalId)}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders(),
    },
  );
  if (!response.ok) {
    throw new Error(await getApiErrorMessage(
      response,
      'Não foi possível eliminar o registo de aluguer.',
      RENTAL_ERROR_MESSAGES,
    ));
  }
}
