import { parsePage } from '../../../shared/api/parsePage';
import { apiFetch } from '../../../shared/api/client';
import { getApiErrorMessage } from '../../../shared/api/apiError';
import type {
  RentalPeriod,
  ToolRentalPage,
  ToolRentalRequest,
  ToolRentalResponse,
} from '../types/toolRental';

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
  return parsePage<ToolRentalResponse>(value, isToolRental, 'A resposta da lista de alugueres está em um formato inválido.', (rental) => ({ ...rental, rentalStartDate: rental.rentalStartDate ?? null, rentalEndDate: rental.rentalEndDate ?? null }));
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
    const response = await apiFetch(`/api/tool-rentals?${query}`);
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
    const response = await apiFetch(      `/api/tools/${encodeURIComponent(toolId)}/rentals?${query}`);
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
  const response = await apiFetch(`/api/tool-rentals`, {
    method: 'POST',
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
  const response = await apiFetch(
    `/api/tool-rentals/${encodeURIComponent(rentalId)}`,
    {
      method: 'PUT',
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
  const response = await apiFetch(
    `/api/tool-rentals/${encodeURIComponent(rentalId)}`,
    {
      method: 'DELETE',
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
