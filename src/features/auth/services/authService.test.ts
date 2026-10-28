import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UserRequest } from '../types/auth';
import { acceptInvitation, registerUser } from './authService';

vi.mock('../../../shared/api/client', () => ({ publicApiFetch: vi.fn() }));

import { publicApiFetch } from '../../../shared/api/client';

const fetchMock = vi.mocked(publicApiFetch);

afterEach(() => vi.resetAllMocks());

describe('registration API contract', () => {
  it('serializes only the required registration fields and keeps the company address', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ token: 'token-1' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const payload = {
      name: 'Ana Silva',
      email: 'ana@example.com',
      password: 'segredo123',
      companyName: 'Campo redundante',
      role: 'ADMIN',
      employeeId: 'employee-1',
      company: {
        id: 'company-1',
        name: 'Construtora Exemplo',
        address: {
          street: 'Rua Principal, 10',
          city: 'Lisboa',
          state: 'Lisboa',
          zipcode: '1000-001',
          country: 'PT',
        },
      },
    } as unknown as UserRequest;

    await registerUser(payload);

    const [, options] = fetchMock.mock.calls[0];

    expect(JSON.parse(String(options?.body))).toEqual({
      name: 'Ana Silva',
      email: 'ana@example.com',
      password: 'segredo123',
      company: {
        name: 'Construtora Exemplo',
        address: {
          street: 'Rua Principal, 10',
          city: 'Lisboa',
          state: 'Lisboa',
          zipcode: '1000-001',
        },
      },
    });
  });
});

describe('invitation API contract', () => {
  it('accepts an invitation without authentication', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(
      acceptInvitation({ token: 'one-time-token', password: 'segredo123' }),
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/invitations/accept', {
      method: 'POST',
      body: JSON.stringify({ token: 'one-time-token', password: 'segredo123' }),
    });
  });
});
