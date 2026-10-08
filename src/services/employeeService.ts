import { getAuthHeaders } from '../lib/session';
import type { EmployeeRequest } from '../types/employee';

function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL;
  return configured ? configured.replace(/\/$/, '') : '';
}

const API_BASE_URL = resolveApiBaseUrl();

export async function createEmployee(payload: EmployeeRequest): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/employees`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    return;
  }

  let message = 'Não foi possível cadastrar o funcionário.';

  try {
    const serverError: unknown = await response.json();
    if (
      typeof serverError === 'object' &&
      serverError !== null &&
      'message' in serverError &&
      typeof serverError.message === 'string'
    ) {
      message = serverError.message;
    }
  } catch {
    // Keep the fallback message when the server response is not JSON.
  }

  throw new Error(message);
}
