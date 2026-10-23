import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { LaborPage } from './LaborPage';
import * as service from '../services/planningService';

vi.mock('../services/planningService', () => ({
  getLaborProfiles: vi.fn(),
  getLaborRolesPage: vi.fn(),
  saveLaborProfile: vi.fn(),
  saveLaborRole: vi.fn(),
}));

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

const profile = {
  employeeId: 'employee-1',
  employeeNumber: 'F-001',
  employeeName: 'Ana Silva',
  position: 'Pedreira',
  paymentMethod: 'MONTHLY' as const,
  paymentAmount: 1800,
  configured: false,
  laborRoleId: null,
  laborRoleName: null,
  effectiveHourlyCost: null,
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(service.getLaborProfiles).mockResolvedValue(page([profile]));
  vi.mocked(service.getLaborRolesPage).mockResolvedValue(page([role]));
  vi.mocked(service.saveLaborProfile).mockResolvedValue(undefined);
  vi.mocked(service.saveLaborRole).mockResolvedValue(role);
});

it('switches accessible tabs with keyboard and opens role registration', async () => {
  const user = userEvent.setup();
  render(<LaborPage />);

  const profilesTab = screen.getByRole('tab', { name: 'Custos por funcionário' });
  expect(profilesTab).toHaveAttribute('aria-selected', 'true');

  await user.type(profilesTab, '{ArrowRight}');
  expect(screen.getByRole('tab', { name: 'Funções de mão de obra' })).toHaveAttribute(
    'aria-selected',
    'true',
  );

  await user.click(await screen.findByRole('button', { name: 'Nova função' }));
  expect(
    within(screen.getByRole('dialog')).getByRole('heading', { name: 'Nova função' }),
  ).toBeInTheDocument();
});

it('configures an employee from the paginated profile table', async () => {
  const user = userEvent.setup();
  render(<LaborPage />);

  await user.click(await screen.findByRole('button', { name: 'Configurar' }));
  const dialog = screen.getByRole('dialog');
  await user.selectOptions(within(dialog).getByLabelText('Função'), 'role-1');
  await user.click(within(dialog).getByRole('button', { name: 'Salvar configuração' }));

  expect(service.saveLaborProfile).toHaveBeenCalledWith(
    'employee-1',
    expect.objectContaining({ laborRoleId: 'role-1', productiveHoursMonth: 160 }),
  );
});

it('applies filters only after Buscar and clears them to defaults', async () => {
  const user = userEvent.setup();
  render(<LaborPage />);

  await screen.findByText('Ana Silva');
  await user.type(screen.getByLabelText('Nome ou número'), 'Ana');
  expect(service.getLaborProfiles).toHaveBeenCalledTimes(1);

  await user.click(screen.getByRole('button', { name: 'Buscar' }));
  expect(service.getLaborProfiles).toHaveBeenLastCalledWith(0, 10, {
    search: 'Ana',
    configured: undefined,
  });

  await user.click(screen.getByRole('button', { name: 'Limpar filtros' }));
  expect(service.getLaborProfiles).toHaveBeenLastCalledWith(0, 10, {});
});
