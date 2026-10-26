import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { getEmployees } from '../../employees/services/employeeService';
import * as service from '../services/planningService';
import { LaborPage } from './LaborPage';

vi.mock('../services/planningService', () => ({
  getLaborRolesPage: vi.fn(),
  saveLaborProfile: vi.fn(),
  saveLaborRole: vi.fn(),
}));

vi.mock('../../employees/services/employeeService', () => ({ getEmployees: vi.fn() }));

const page = <T,>(content: T[]) => ({
  content,
  page: { size: 10, number: 0, totalElements: content.length, totalPages: content.length ? 1 : 0 },
});

const role = {
  id: 'role-1',
  code: 'PED',
  name: 'Pedreiro',
  description: null,
  costingMode: 'EMPLOYEE_AVERAGE' as const,
  manualHourlyCost: null,
  currentHourlyCost: 18,
  eligibleEmployees: 1,
  active: true,
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(service.getLaborRolesPage).mockResolvedValue(page([role]));
  vi.mocked(service.saveLaborProfile).mockResolvedValue(undefined);
  vi.mocked(service.saveLaborRole).mockResolvedValue(role);
  vi.mocked(getEmployees).mockResolvedValue(
    page([
      {
        id: 'employee-1',
        fullName: 'Ana Silva',
        email: 'ana@example.com',
        phoneNumber: null,
        documentNumber: null,
        birthDate: null,
        address: { street: '', city: '', state: '', zipCode: '' },
        companyId: 'company-1',
        employeeNumber: 'F-001',
        position: 'Pedreira',
        department: 'Obras',
        admissionDate: null,
        paymentMethod: 'MONTHLY',
        paymentAmount: 1800,
        terminationDate: null,
        status: 'ACTIVE',
      },
    ]),
  );
});

it('shows only the labor role list and keeps cost tabs inside the dialog', async () => {
  const user = userEvent.setup();
  render(<LaborPage />);

  expect(await screen.findByRole('table', { name: 'Funções de mão de obra' })).toBeInTheDocument();
  expect(screen.queryByRole('tab')).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Nova função' }));
  const dialog = screen.getByRole('dialog');

  expect(within(dialog).getByRole('tab', { name: 'Função de mão de obra' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  expect(within(dialog).getByRole('tab', { name: 'Custo por funcionário' })).toBeEnabled();
});

it('adds an employee cost from the edit-role dialog', async () => {
  const user = userEvent.setup();
  render(<LaborPage />);

  await user.click(await screen.findByRole('button', { name: 'Editar Pedreiro' }));
  const dialog = screen.getByRole('dialog');
  await user.click(within(dialog).getByRole('tab', { name: 'Custo por funcionário' }));
  await user.selectOptions(within(dialog).getByLabelText('Funcionário'), 'employee-1');
  await user.click(within(dialog).getByRole('button', { name: 'Adicionar custo' }));

  expect(service.saveLaborProfile).toHaveBeenCalledWith(
    'employee-1',
    expect.objectContaining({ laborRoleId: 'role-1', productiveHoursMonth: 160 }),
  );
});

it('applies role filters only after Buscar and clears to active roles', async () => {
  const user = userEvent.setup();
  render(<LaborPage />);

  await screen.findByText('Pedreiro');
  await user.type(screen.getByLabelText('Código ou função'), 'PED');
  expect(service.getLaborRolesPage).toHaveBeenCalledTimes(1);

  await user.click(screen.getByRole('button', { name: 'Buscar' }));
  expect(service.getLaborRolesPage).toHaveBeenLastCalledWith(0, 10, {
    search: 'PED',
    active: true,
  });

  await user.click(screen.getByRole('button', { name: 'Limpar filtros' }));
  expect(service.getLaborRolesPage).toHaveBeenLastCalledWith(0, 10, { active: true });
});
