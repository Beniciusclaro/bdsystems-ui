import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmployeeListPage } from './EmployeeListPage';
import { getEmployees, resendEmployeeInvitation } from '../services/employeeService';

vi.mock('../services/employeeService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/employeeService')>()),
  getEmployees: vi.fn(),
  resendEmployeeInvitation: vi.fn(),
}));

const employee = {
  id: 'employee-1',
  fullName: 'Ana Silva',
  email: 'ana@example.com',
  phoneNumber: null,
  documentNumber: null,
  birthDate: null,
  address: null,
  companyId: 'company-1',
  employeeNumber: 'EMP-1',
  position: 'Engenheira',
  department: 'Obras',
  admissionDate: '2026-10-20',
  paymentMethod: 'MONTHLY' as const,
  paymentAmount: 3500,
  terminationDate: null,
  status: 'ACTIVE' as const,
  userRole: 'MANAGER' as const,
  userAccessStatus: 'PENDING' as const,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getEmployees).mockResolvedValue({
    content: [employee],
    page: { size: 10, number: 0, totalElements: 1, totalPages: 1 },
  });
  vi.mocked(resendEmployeeInvitation).mockResolvedValue();
});

describe('EmployeeListPage access', () => {
  it('shows access with role and refreshes after resending a pending invitation', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <EmployeeListPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Convite pendente · Gerente')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reenviar convite para Ana Silva' }));

    await waitFor(() => expect(resendEmployeeInvitation).toHaveBeenCalledWith('employee-1'));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Convite reenviado para ana@example.com.',
    );
    await waitFor(() => expect(getEmployees).toHaveBeenCalledTimes(2));
  });
});
