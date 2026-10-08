import type { UserRequest, UserResponse, LoginRequest, LoginResponse } from '../types/auth';

function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL;

  if (configured) {
    return configured.replace(/\/$/, '');
  }

  return '';
}

const API_BASE_URL = resolveApiBaseUrl();

function getErrorMessage(response: Response, fallbackMessage: string): string {
  if (response.status === 409) {
    return 'Já existe um usuário ou empresa com estes dados.';
  }

  if (response.status === 400) {
    return 'Revise os dados do formulário antes de continuar.';
  }

  if (response.status === 401) {
    return 'Credenciais inválidas.';
  }

  return fallbackMessage;
}

export async function registerUser(payload: UserRequest): Promise<UserResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = getErrorMessage(response, 'Não foi possível concluir o cadastro.');

    try {
      const serverError = await response.json();
      if (serverError?.message) {
        message = serverError.message;
      }
    } catch {
      // ignore invalid JSON responses and keep the fallback
    }

    throw new Error(message);
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    return {} as UserResponse;
  }

  return (await response.json()) as UserResponse;
}

export async function loginUser(payload: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = getErrorMessage(response, 'Não foi possível realizar o login');

    try {
      const serverError = await response.json();
      if (serverError?.message) {
        message = serverError.message;
      }
    } catch {
      // ignore invalid JSON responses and keep the fallback
    }

    throw new Error(message);
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    return {} as LoginResponse;
  }

  return (await response.json()) as LoginResponse;
}
