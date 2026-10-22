import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BudgetDetailsPage } from './BudgetDetailsPage';
import { BudgetPage } from './BudgetPage';
import { BudgetRegistrationPage } from './BudgetRegistrationPage';
import * as service from '../services/planningService';
import type { Budget } from '../types/planning';

vi.mock('../services/planningService', () => ({
  addBudgetItem: vi.fn(),
  addBudgetStage: vi.fn(),
  approveBudgetAndCreateProject: vi.fn(),
  deleteBudget: vi.fn(),
  duplicateBudget: vi.fn(),
  finalizeBudget: vi.fn(),
  getBudget: vi.fn(),
  getBudgets: vi.fn(),
  getClients: vi.fn(),
  getCompositions: vi.fn(),
  rejectBudget: vi.fn(),
  reloadProjects: vi.fn(),
  saveBudget: vi.fn(),
}));

const makeBudget = (status: Budget['status'] = 'DRAFT'): Budget => ({
  id: 'budget-1',
  number: 'ORC-10',
  title: 'Renovação',
  clientId: 'client-1',
  clientName: 'Cliente Um',
  proposedProjectName: 'Casa Azul',
  proposedProjectDescription: 'Obra completa',
  proposedProjectStreet: 'Rua A',
  proposedProjectCity: 'Lisboa',
  proposedProjectState: 'Lisboa',
  proposedProjectZipCode: '1000-001',
  projectLinkOrigin: null,
  validUntil: null,
  commercialTerms: null,
  notes: null,
  taxPercent: 23,
  marginPercent: 15,
  status,
  finalizedAt: status === 'DRAFT' ? null : '2026-10-22',
  totalCost: 100,
  totalSalePrice: 150,
  stages: [],
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(service.getBudgets).mockResolvedValue([makeBudget()]);
  vi.mocked(service.getBudget).mockResolvedValue(makeBudget());
  vi.mocked(service.getCompositions).mockResolvedValue([]);
  vi.mocked(service.getClients).mockResolvedValue([
    {
      id: 'client-1',
      type: 'COMPANY',
      name: 'Cliente Um',
      document: null,
      email: null,
      phone: null,
      street: null,
      city: null,
      state: null,
      zipCode: null,
      active: true,
    },
  ]);
  vi.mocked(service.deleteBudget).mockResolvedValue(undefined);
  vi.mocked(service.saveBudget).mockResolvedValue(makeBudget());
});

describe('budget routes', () => {
  it('lists and deletes only a draft after confirmation', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <BudgetPage />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('table', { name: 'Lista de orçamentos' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Excluir ORC-10' }));
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Excluir orçamento' }),
    );
    expect(service.deleteBudget).toHaveBeenCalledWith('budget-1');
    expect(await screen.findByText('Orçamento excluído com sucesso.')).toBeInTheDocument();
  });

  it('hides edit and delete actions for finalized budgets', async () => {
    vi.mocked(service.getBudgets).mockResolvedValue([makeBudget('FINALIZED')]);
    render(
      <MemoryRouter>
        <BudgetPage />
      </MemoryRouter>,
    );
    await screen.findByRole('table');
    expect(screen.queryByRole('button', { name: /Editar ORC-10/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Excluir ORC-10/ })).not.toBeInTheDocument();
  });

  it('creates a budget in a routed dialog without a project selector', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/budgets/new']}>
        <Routes>
          <Route path="/budgets" element={<BudgetPage />}>
            <Route path="new" element={<BudgetRegistrationPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    const dialog = await screen.findByRole('dialog');
    await user.selectOptions(within(dialog).getByLabelText('Cliente'), 'client-1');
    await user.type(within(dialog).getByLabelText('Número'), 'ORC-11');
    await user.type(within(dialog).getByLabelText('Título'), 'Ampliação');
    await user.type(within(dialog).getByLabelText('Nome provisório da obra'), 'Casa Nova');
    await user.click(within(dialog).getByRole('button', { name: 'Criar orçamento' }));
    expect(service.saveBudget).toHaveBeenCalledWith(
      expect.objectContaining({ proposedProjectName: 'Casa Nova' }),
      undefined,
    );
    expect(within(dialog).queryByLabelText('Obra')).not.toBeInTheDocument();
  });

  it('switches between accessible budget and proposal tabs', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/budgets/budget-1']}>
        <Routes>
          <Route path="/budgets/:budgetId" element={<BudgetDetailsPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByRole('tab', { name: 'Orçamento' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await user.click(screen.getByRole('tab', { name: 'Proposta' }));
    expect(screen.getByRole('tab', { name: 'Proposta' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('PROPOSTA ORC-10')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Imprimir proposta' })).toBeInTheDocument();
  });

  it('keeps finalized approval data for correction after an API failure', async () => {
    const finalized = makeBudget('FINALIZED');

    vi.mocked(service.getBudget).mockResolvedValue(finalized);
    vi.mocked(service.approveBudgetAndCreateProject).mockRejectedValue(
      new Error('Código já utilizado'),
    );

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/budgets/budget-1']}>
        <Routes>
          <Route path="/budgets/:budgetId" element={<BudgetDetailsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: 'Aprovar e gerar obra' }));

    const dialog = screen.getByRole('dialog');

    expect(within(dialog).getByLabelText('Código')).toHaveValue('ORC-10');
    expect(within(dialog).getByLabelText('Nome')).toHaveValue('Casa Azul');
    await user.clear(within(dialog).getByLabelText('Código'));
    await user.type(within(dialog).getByLabelText('Código'), 'OBR-ALTERADA');
    await user.click(within(dialog).getByRole('button', { name: 'Confirmar aprovação' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Código já utilizado');
    expect(within(dialog).getByLabelText('Código')).toHaveValue('OBR-ALTERADA');
    expect(screen.getByText('Finalizado')).toBeInTheDocument();
  });
});
