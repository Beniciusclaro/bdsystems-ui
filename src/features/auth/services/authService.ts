import { getApiErrorMessage } from '../../../shared/api/apiError';
import { publicApiFetch } from '../../../shared/api/client';
import type { UserRequest, UserResponse, LoginRequest, LoginResponse } from '../types/auth';

const AUTH_ERROR_MESSAGES: Partial<Record<number, string>> = {
  409: 'Já existe um usuário ou empresa com estes dados.',
  400: 'Revise os dados do formulário antes de continuar.',
  401: 'Credenciais inválidas.',
};

export async function registerUser(payload: UserRequest): Promise<UserResponse> {
  const response = await publicApiFetch(`/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, 'Não foi possível concluir o cadastro.', AUTH_ERROR_MESSAGES));
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    return {} as UserResponse;
  }

  return (await response.json()) as UserResponse;
}

export async function loginUser(payload: LoginRequest): Promise<LoginResponse> {
  const response = await publicApiFetch(`/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, 'Não foi possível realizar o login', AUTH_ERROR_MESSAGES));
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    return {} as LoginResponse;
  }

  return (await response.json()) as LoginResponse;
}
