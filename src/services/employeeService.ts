import { getAuthHeaders } from '../lib/session';
import type {
  EmployeePage,
  EmployeeFilters,
  EmployeePaymentMethod,
  EmployeeRequest,
  EmployeeResponse,
  EmployeeStatus,
} from '../types/employee';

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

function isEmployeeStatus(value: unknown): value is EmployeeStatus {
  return (
    value === 'ACTIVE' ||
    value === 'INACTIVE' ||
    value === 'TERMINATED' ||
    value === 'LEASED'
  );
}

function isEmployeePaymentMethod(value: unknown): value is EmployeePaymentMethod {
  return (
    value === 'MONTHLY' ||
    value === 'WEEKLY' ||
    value === 'DAILY' ||
    value === 'HOURLY'
  );
}

function isEmployee(value: unknown): value is EmployeeResponse {
  if (!isRecord(value) || !isRecord(value.address)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.fullName === 'string' &&
    typeof value.email === 'string' &&
    (typeof value.phoneNumber === 'string' || value.phoneNumber === null) &&
    (typeof value.documentNumber === 'string' || value.documentNumber === null) &&
    (typeof value.birthDate === 'string' || value.birthDate === null) &&
    typeof value.address.street === 'string' &&
    typeof value.address.city === 'string' &&
    typeof value.address.state === 'string' &&
    typeof value.address.zipCode === 'string' &&
    typeof value.companyId === 'string' &&
    typeof value.employeeNumber === 'string' &&
    typeof value.position === 'string' &&
    typeof value.department === 'string' &&
    typeof value.admissionDate === 'string' &&
    (!('paymentMethod' in value) ||
      value.paymentMethod === null ||
      isEmployeePaymentMethod(value.paymentMethod)) &&
    (!('paymentAmount' in value) ||
      value.paymentAmount === null ||
      typeof value.paymentAmount === 'number') &&
    (typeof value.terminationDate === 'string' || value.terminationDate === null) &&
    (value.status === null || isEmployeeStatus(value.status))
  );
}

function parseEmployeePage(value: unknown): EmployeePage {
  if (
    !isRecord(value) ||
    !Array.isArray(value.content) ||
    !value.content.every(isEmployee) ||
    !isRecord(value.page) ||
    typeof value.page.size !== 'number' ||
    typeof value.page.number !== 'number' ||
    typeof value.page.totalElements !== 'number' ||
    typeof value.page.totalPages !== 'number'
  ) {
    throw new Error('A resposta da lista de funcionários está em um formato inválido.');
  }

  return {
    content: value.content,
    page: {
      size: value.page.size,
      number: value.page.number,
      totalElements: value.page.totalElements,
      totalPages: value.page.totalPages,
    },
  };
}

export async function getEmployees(
  page: number,
  size: number,
  filters: EmployeeFilters = {},
): Promise<EmployeePage> {
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort: 'fullName,asc',
  });

  if (filters.status) {
    query.set('status', filters.status);
  }
  if (filters.position) {
    query.set('position', filters.position);
  }
  if (filters.department) {
    query.set('department', filters.department);
  }

  const response = await fetch(`${API_BASE_URL}/api/employees?${query}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Não foi possível carregar os funcionários.'));
  }

  return parseEmployeePage(await response.json());
}

export async function createEmployee(payload: EmployeeRequest): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/employees`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    return;
  }

  throw new Error(await getErrorMessage(response, 'Não foi possível cadastrar o funcionário.'));
}

export async function updateEmployee(
  employeeId: string,
  payload: EmployeeRequest,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/employees/${encodeURIComponent(employeeId)}`,
    {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
  );

  if (response.ok) {
    return;
  }

  throw new Error(await getErrorMessage(response, 'Não foi possível atualizar o funcionário.'));
}

export async function deleteEmployee(employeeId: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/employees/${encodeURIComponent(employeeId)}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders(),
    },
  );

  if (response.ok) {
    return;
  }

  throw new Error(await getErrorMessage(response, 'Não foi possível excluir o funcionário.'));
}
