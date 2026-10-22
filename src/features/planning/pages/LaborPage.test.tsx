import { render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { LaborPage } from './LaborPage';
import * as service from '../services/planningService';
import { getEmployees } from '../../employees/services/employeeService';

vi.mock('../services/planningService', () => ({
  getLaborRoles: vi.fn(),
  saveLaborProfile: vi.fn(),
  saveLaborRole: vi.fn(),
}));
vi.mock('../../employees/services/employeeService', () => ({ getEmployees: vi.fn() }));

beforeEach(() => {
  vi.mocked(service.getLaborRoles).mockResolvedValue([]);
  vi.mocked(getEmployees).mockResolvedValue({
    content: [],
    page: { size: 200, number: 0, totalElements: 0, totalPages: 0 },
  });
});

it('preserves employee costing and labor role registration in its own module', async () => {
  render(<LaborPage />);
  expect(
    await screen.findByRole('heading', { name: 'Custo baseado no funcionário' }),
  ).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Funções de mão de obra' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Calcular e vincular' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Cadastrar função' })).toBeInTheDocument();
});
