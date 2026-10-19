import { parsePage } from '../../../shared/api/parsePage';
import { getApiErrorMessage } from '../../../shared/api/apiError';
import { apiFetch } from '../../../shared/api/client';
import type {
  EmployeePage,
  EmployeeFilters,
  EmployeePaymentMethod,
  EmployeeRequest,
  EmployeeResponse,
  EmployeeStatus,
} from '../types/employee';

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
  return parsePage<EmployeeResponse>(value, isEmployee, 'A resposta da lista de funcionários está em um formato inválido.');
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

  const response = await apiFetch(`/api/employees?${query}`);

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, 'Não foi possível carregar os funcionários.'));
  }

  return parseEmployeePage(await response.json());
}

export async function createEmployee(payload: EmployeeRequest): Promise<void> {
  const response = await apiFetch(`/api/employees`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    return;
  }

  throw new Error(await getApiErrorMessage(response, 'Não foi possível cadastrar o funcionário.'));
}

export async function updateEmployee(
  employeeId: string,
  payload: EmployeeRequest,
): Promise<void> {
  const response = await apiFetch(
    `/api/employees/${encodeURIComponent(employeeId)}`,
    {
      method: 'PUT',
        body: JSON.stringify(payload),
    },
  );

  if (response.ok) {
    return;
  }

  throw new Error(await getApiErrorMessage(response, 'Não foi possível atualizar o funcionário.'));
}

export async function deleteEmployee(employeeId: string): Promise<void> {
  const response = await apiFetch(
    `/api/employees/${encodeURIComponent(employeeId)}`,
    {
      method: 'DELETE',
      },
  );

  if (response.ok) {
    return;
  }

  throw new Error(await getApiErrorMessage(response, 'Não foi possível excluir o funcionário.'));
}
