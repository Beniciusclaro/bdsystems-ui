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
  UserAccessStatus,
  UserRole,
} from '../types/employee';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isEmployeeStatus(value: unknown): value is EmployeeStatus {
  return value === 'ACTIVE' || value === 'INACTIVE' || value === 'TERMINATED' || value === 'LEASED';
}

function isEmployeePaymentMethod(value: unknown): value is EmployeePaymentMethod {
  return value === 'MONTHLY' || value === 'WEEKLY' || value === 'DAILY' || value === 'HOURLY';
}

function isUserRole(value: unknown): value is UserRole {
  return value === 'USER' || value === 'MANAGER' || value === 'ADMIN';
}

function isUserAccessStatus(value: unknown): value is UserAccessStatus {
  return value === 'NONE' || value === 'PENDING' || value === 'EXPIRED' || value === 'ACTIVE';
}

function isEmployeeAddress(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.street === 'string' &&
    typeof value.city === 'string' &&
    typeof value.state === 'string' &&
    typeof value.zipCode === 'string'
  );
}

function isEmployee(value: unknown): value is EmployeeResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.fullName === 'string' &&
    typeof value.email === 'string' &&
    (typeof value.phoneNumber === 'string' || value.phoneNumber === null) &&
    (typeof value.documentNumber === 'string' || value.documentNumber === null) &&
    (typeof value.birthDate === 'string' || value.birthDate === null) &&
    (value.address === null || isEmployeeAddress(value.address)) &&
    typeof value.companyId === 'string' &&
    (typeof value.employeeNumber === 'string' || value.employeeNumber === null) &&
    (typeof value.position === 'string' || value.position === null) &&
    (typeof value.department === 'string' || value.department === null) &&
    (typeof value.admissionDate === 'string' || value.admissionDate === null) &&
    (!('paymentMethod' in value) ||
      value.paymentMethod === null ||
      isEmployeePaymentMethod(value.paymentMethod)) &&
    (!('paymentAmount' in value) ||
      value.paymentAmount === null ||
      typeof value.paymentAmount === 'number') &&
    (typeof value.terminationDate === 'string' || value.terminationDate === null) &&
    (value.status === null || isEmployeeStatus(value.status)) &&
    (value.userRole === null || isUserRole(value.userRole)) &&
    isUserAccessStatus(value.userAccessStatus)
  );
}

function parseEmployeePage(value: unknown): EmployeePage {
  return parsePage<EmployeeResponse>(
    value,
    isEmployee,
    'A resposta da lista de funcionários está em um formato inválido.',
  );
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
    throw new Error(
      await getApiErrorMessage(response, 'Não foi possível carregar os funcionários.'),
    );
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

export async function updateEmployee(employeeId: string, payload: EmployeeRequest): Promise<void> {
  const response = await apiFetch(`/api/employees/${encodeURIComponent(employeeId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    return;
  }

  throw new Error(await getApiErrorMessage(response, 'Não foi possível atualizar o funcionário.'));
}

export async function deleteEmployee(employeeId: string): Promise<void> {
  const response = await apiFetch(`/api/employees/${encodeURIComponent(employeeId)}`, {
    method: 'DELETE',
  });

  if (response.ok) {
    return;
  }

  throw new Error(await getApiErrorMessage(response, 'Não foi possível excluir o funcionário.'));
}

export async function resendEmployeeInvitation(employeeId: string): Promise<void> {
  const response = await apiFetch(
    `/api/employees/${encodeURIComponent(employeeId)}/user-invitation/resend`,
    { method: 'POST' },
  );

  if (response.ok) {
    return;
  }

  throw new Error(await getApiErrorMessage(response, 'Não foi possível reenviar o convite.'));
}
