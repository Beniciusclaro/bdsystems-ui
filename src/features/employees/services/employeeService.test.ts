import { afterEach, describe, expect, it, vi } from 'vitest';
import { getEmployees, resendEmployeeInvitation } from './employeeService';

vi.mock('../../../shared/api/client', () => ({ apiFetch: vi.fn() }));

import { apiFetch } from '../../../shared/api/client';

const fetchMock = vi.mocked(apiFetch);

afterEach(() => vi.resetAllMocks());

describe('employee API contract', () => {
  it('accepts employees without an admission date in list responses', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          content: [
            {
              id: 'employee-1',
              fullName: 'Ana Silva',
              email: 'ana@example.com',
              phoneNumber: null,
              documentNumber: null,
              birthDate: null,
              address: {
                street: 'Rua Principal, 10',
                city: 'Lisboa',
                state: 'Lisboa',
                zipCode: '1000-001',
              },
              companyId: 'company-1',
              employeeNumber: 'EMP-001',
              position: 'Engenheira',
              department: 'Engenharia',
              admissionDate: null,
              paymentMethod: 'MONTHLY',
              paymentAmount: 3500,
              terminationDate: null,
              status: 'ACTIVE',
              userRole: 'MANAGER',
              userAccessStatus: 'ACTIVE',
            },
          ],
          page: {
            size: 10,
            number: 0,
            totalElements: 1,
            totalPages: 1,
          },
        }),
      ),
    );

    await expect(getEmployees(0, 10)).resolves.toMatchObject({
      content: [{ id: 'employee-1', admissionDate: null }],
      page: { totalElements: 1 },
    });
  });

  it('accepts an automatically created employee with an incomplete profile', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          content: [
            {
              id: 'employee-2',
              fullName: 'João Costa',
              email: 'joao@example.com',
              phoneNumber: null,
              documentNumber: null,
              birthDate: null,
              address: null,
              companyId: 'company-1',
              employeeNumber: null,
              position: null,
              department: null,
              admissionDate: null,
              paymentMethod: null,
              paymentAmount: null,
              terminationDate: null,
              status: null,
              userRole: null,
              userAccessStatus: 'NONE',
            },
          ],
          page: { size: 10, number: 0, totalElements: 1, totalPages: 1 },
        }),
      ),
    );

    await expect(getEmployees(0, 10)).resolves.toMatchObject({
      content: [{ id: 'employee-2', address: null, position: null }],
    });
  });

  it('resends the invitation for an employee', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(resendEmployeeInvitation('employee/1')).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith('/api/employees/employee%2F1/user-invitation/resend', {
      method: 'POST',
    });
  });
});
