import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import * as service from '../services/planningService';
import { LaborPage } from './LaborPage';

vi.mock('../services/planningService', () => ({
  getLaborReferencePositions: vi.fn(),
  getLaborRolesPage: vi.fn(),
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
  referencePosition: 'Pedreiro de alvenaria',
  manualHourlyCost: null,
  currentHourlyCost: 18,
  eligibleEmployees: 2,
  active: true,
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(service.getLaborReferencePositions).mockResolvedValue([
    'Pedreiro de alvenaria',
    'Servente',
  ]);
  vi.mocked(service.getLaborRolesPage).mockResolvedValue(page([role]));
  vi.mocked(service.saveLaborRole).mockResolvedValue(role);
});

it('shows the reference position and removes the individual cost tab', async () => {
  const user = userEvent.setup();
  render(<LaborPage />);

  expect(await screen.findByText('Pedreiro de alvenaria')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Editar Pedreiro' }));
  const dialog = screen.getByRole('dialog');

  expect(within(dialog).queryByRole('tab')).not.toBeInTheDocument();
  expect(within(dialog).getByLabelText('Cargo de referência')).toHaveValue('Pedreiro de alvenaria');
  expect(within(dialog).queryByText('Custo por funcionário')).not.toBeInTheDocument();
});

it('saves employee-average roles with a reference position and no manual cost', async () => {
  const user = userEvent.setup();
  render(<LaborPage />);

  await user.click(await screen.findByRole('button', { name: 'Nova função' }));
  const dialog = screen.getByRole('dialog');

  await user.type(within(dialog).getByLabelText('Código'), 'SER');
  await user.type(within(dialog).getByLabelText('Função'), 'Servente');
  await user.selectOptions(within(dialog).getByLabelText('Modo de cálculo'), 'EMPLOYEE_AVERAGE');
  await user.selectOptions(within(dialog).getByLabelText('Cargo de referência'), 'Servente');
  await user.click(within(dialog).getByRole('button', { name: 'Salvar função' }));

  expect(service.saveLaborRole).toHaveBeenCalledWith(
    expect.objectContaining({
      code: 'SER',
      costingMode: 'EMPLOYEE_AVERAGE',
      referencePosition: 'Servente',
      manualHourlyCost: null,
    }),
    undefined,
  );
});

it('clears the reference position when switching to manual mode', async () => {
  const user = userEvent.setup();
  render(<LaborPage />);

  await user.click(await screen.findByRole('button', { name: 'Editar Pedreiro' }));
  const dialog = screen.getByRole('dialog');

  await user.selectOptions(within(dialog).getByLabelText('Modo de cálculo'), 'MANUAL');
  await user.type(within(dialog).getByLabelText('Custo por hora'), '25');
  await user.click(within(dialog).getByRole('button', { name: 'Salvar função' }));

  expect(service.saveLaborRole).toHaveBeenCalledWith(
    expect.objectContaining({
      costingMode: 'MANUAL',
      referencePosition: null,
      manualHourlyCost: 25,
    }),
    'role-1',
  );
});

it('guides the user when no eligible reference positions exist', async () => {
  vi.mocked(service.getLaborReferencePositions).mockResolvedValue([]);
  const user = userEvent.setup();
  render(<LaborPage />);

  await user.click(await screen.findByRole('button', { name: 'Nova função' }));
  const dialog = screen.getByRole('dialog');
  await user.selectOptions(within(dialog).getByLabelText('Modo de cálculo'), 'EMPLOYEE_AVERAGE');

  expect(
    within(dialog).getByText(/Cadastre um funcionário de campo sem acesso ao sistema/),
  ).toBeInTheDocument();
  expect(within(dialog).getByRole('button', { name: 'Salvar função' })).toBeDisabled();
});

it('shows the API error returned when saving', async () => {
  vi.mocked(service.saveLaborRole).mockRejectedValue(new Error('Cargo de referência inválido.'));
  const user = userEvent.setup();
  render(<LaborPage />);

  await user.click(await screen.findByRole('button', { name: 'Editar Pedreiro' }));
  await user.click(screen.getByRole('button', { name: 'Salvar função' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Cargo de referência inválido.');
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
