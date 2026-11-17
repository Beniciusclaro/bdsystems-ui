import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BudgetDetailsPage } from './BudgetDetailsPage';
import { BudgetPage } from './BudgetPage';
import { BudgetRegistrationPage } from './BudgetRegistrationPage';
import * as service from '../services/planningService';
import type { Budget } from '../types/planning';
import { ToastProvider } from '../../../shared/feedback/ToastProvider';

vi.mock('../services/planningService', () => ({
  addBudgetItem: vi.fn(),
  addBudgetStage: vi.fn(),
  approveBudgetAndCreateProject: vi.fn(),
  deleteBudget: vi.fn(),
  deleteBudgetItem: vi.fn(),
  duplicateBudget: vi.fn(),
  finalizeBudget: vi.fn(),
  getBudget: vi.fn(),
  getBudgets: vi.fn(),
  getBudgetsPage: vi.fn(),
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

const makeBudgetWithItem = (status: Budget['status'] = 'DRAFT'): Budget => ({
  ...makeBudget(status),
  stages: [
    {
      id: 'stage-1',
      name: 'Fundação',
      description: null,
      sortOrder: 0,
      totalCost: 100,
      totalSalePrice: 150,
      items: [
        {
          id: 'item-1',
          sourceCompositionId: 'composition-1',
          code: 'SERV-1',
          name: 'Escavação',
          description: null,
          unitSymbol: 'm³',
          quantity: 1,
          unitCost: 100,
          totalCost: 100,
          unitSalePrice: 150,
          totalSalePrice: 150,
          components: [],
        },
      ],
    },
  ],
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(service.getBudgets).mockResolvedValue([makeBudget()]);
  vi.mocked(service.getBudgetsPage).mockResolvedValue({
    content: [makeBudget()],
    page: { number: 0, size: 10, totalElements: 1, totalPages: 1 },
  });
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
  vi.mocked(service.deleteBudgetItem).mockResolvedValue({
    ...makeBudgetWithItem(),
    totalCost: 0,
    totalSalePrice: 0,
    stages: [{ ...makeBudgetWithItem().stages[0], items: [], totalCost: 0, totalSalePrice: 0 }],
  });
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

  it('loads and renders all 13 budgets with the initial page size set to 50', async () => {
    const budgets = Array.from({ length: 13 }, (_, index) => ({
      ...makeBudget(),
      id: `budget-${index + 1}`,
      number: index === 0 ? 'OCR-001-Const' : `ORC-2026-${String(index).padStart(3, '0')}`,
      title: index === 0 ? "Tom's house" : `Orçamento ${index}`,
      clientName: index === 0 ? 'Tom Claro' : 'Cliente Um',
    }));

    vi.mocked(service.getBudgetsPage).mockResolvedValue({
      content: budgets,
      page: { number: 0, size: 50, totalElements: 13, totalPages: 1 },
    });

    render(
      <MemoryRouter>
        <BudgetPage />
      </MemoryRouter>,
    );

    const table = await screen.findByRole('table', { name: 'Lista de orçamentos' });

    expect(within(table).getAllByRole('row')).toHaveLength(14);
    expect(
      within(table).getByRole('row', {
        name: 'Abrir detalhes do orçamento OCR-001-Const',
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Itens por página')).toHaveValue('50');
    expect(service.getBudgetsPage).toHaveBeenCalledWith(0, 50, {});
  });

  it('restores and updates the persisted budget page size', async () => {
    const user = userEvent.setup();

    localStorage.setItem('builder-ui:budgets-page-size', '20');

    render(
      <MemoryRouter>
        <BudgetPage />
      </MemoryRouter>,
    );

    const pageSize = await screen.findByLabelText('Itens por página');

    expect(pageSize).toHaveValue('20');
    expect(service.getBudgetsPage).toHaveBeenCalledWith(0, 20, {});

    await user.selectOptions(pageSize, '50');

    await waitFor(() => expect(service.getBudgetsPage).toHaveBeenLastCalledWith(0, 50, {}));
    expect(localStorage.getItem('builder-ui:budgets-page-size')).toBe('50');
  });

  it('keeps read-only access and hides delete for finalized budgets', async () => {
    vi.mocked(service.getBudgetsPage).mockResolvedValue({
      content: [makeBudget('FINALIZED')],
      page: { number: 0, size: 10, totalElements: 1, totalPages: 1 },
    });
    render(
      <MemoryRouter>
        <BudgetPage />
      </MemoryRouter>,
    );
    await screen.findByRole('table');
    expect(screen.getByRole('button', { name: /Editar ORC-10/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Excluir ORC-10/ })).not.toBeInTheDocument();
  });

  it('creates a budget in a routed dialog without a project selector', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/budgets/new']}>
          <Routes>
            <Route path="/budgets" element={<BudgetPage />}>
              <Route path="new" element={<BudgetRegistrationPage />} />
              <Route path=":budgetId/edit" element={<BudgetRegistrationPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ToastProvider>,
    );
    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getAllByRole('tab')).toHaveLength(3);
    expect(within(dialog).getByRole('tab', { name: 'Dados do orçamento' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(within(dialog).getByRole('tab', { name: 'Fases do orçamento' })).toHaveAttribute(
      'aria-selected',
      'false',
    );

    await user.selectOptions(within(dialog).getByLabelText('Cliente'), 'client-1');
    await user.type(within(dialog).getByLabelText('Número'), 'ORC-11');
    await user.type(within(dialog).getByLabelText('Título'), 'Ampliação');
    await user.type(within(dialog).getByLabelText('Nome provisório da obra'), 'Casa Nova');
    await user.click(within(dialog).getByRole('button', { name: 'Cadastrar orçamento' }));
    expect(service.saveBudget).toHaveBeenCalledWith(
      expect.objectContaining({ proposedProjectName: 'Casa Nova' }),
    );
    expect(within(dialog).queryByLabelText('Obra')).not.toBeInTheDocument();
    expect(within(dialog).getByLabelText('Número')).toHaveValue('ORC-10');
    expect(within(dialog).getByLabelText('Título')).toHaveValue('Renovação');
    expect(within(dialog).getByRole('tab', { name: 'Fases do orçamento' })).toBeEnabled();
    expect(screen.getByText('Orçamento cadastrado com sucesso.')).toBeInTheDocument();
  });

  it('builds phases, services and the proposal preview locally before saving', async () => {
    vi.mocked(service.getCompositions).mockResolvedValue([
      {
        id: 'composition-1',
        code: 'SERV-1',
        name: 'Escavação',
        description: null,
        unitOfMeasureId: 'unit-1',
        unitSymbol: 'm³',
        baseYield: 1,
        active: true,
        components: [],
        totalCost: 100,
        unitCost: 100,
      },
    ]);

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/budgets/new']}>
        <Routes>
          <Route path="/budgets/new" element={<BudgetRegistrationPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('tab', { name: 'Fases do orçamento' }));
    await user.type(screen.getByLabelText('Nova fase'), 'Fundação');
    await user.click(screen.getByRole('button', { name: 'Adicionar fase' }));
    await user.selectOptions(screen.getByLabelText('Composição'), 'composition-1');
    await user.clear(screen.getByLabelText('Quantidade'));
    await user.type(screen.getByLabelText('Quantidade'), '2');
    await user.click(screen.getByRole('button', { name: 'Adicionar serviço' }));

    expect(screen.getByText('Escavação · 2 m³')).toBeInTheDocument();
    expect(service.saveBudget).not.toHaveBeenCalled();
    expect(service.addBudgetStage).not.toHaveBeenCalled();
    expect(service.addBudgetItem).not.toHaveBeenCalled();

    await user.click(screen.getByRole('tab', { name: 'Proposta' }));

    expect(screen.getByText(/PRÉVIA DA PROPOSTA/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Total estimado: 200,00/ })).toBeInTheDocument();
  });

  it('closes an unsaved local draft without calling the API', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/budgets/new']}>
        <Routes>
          <Route path="/budgets/new" element={<BudgetRegistrationPage />} />
          <Route path="/budgets" element={<p>Lista</p>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: 'Fechar orçamento' }));

    expect(await screen.findByText('Lista')).toBeInTheDocument();
    expect(service.saveBudget).not.toHaveBeenCalled();
    expect(service.addBudgetStage).not.toHaveBeenCalled();
  });

  it('reloads the current page when returning to the list without showing stale rows', async () => {
    const user = userEvent.setup();

    const persistedBudget = {
      ...makeBudget(),
      id: 'budget-2',
      number: 'OCR-001-Const',
      title: "Tom's house",
      clientName: 'Tom Claro',
    };

    let resolveReload!: (value: Awaited<ReturnType<typeof service.getBudgetsPage>>) => void;

    const reload = new Promise<Awaited<ReturnType<typeof service.getBudgetsPage>>>((resolve) => {
      resolveReload = resolve;
    });

    vi.mocked(service.getBudgetsPage)
      .mockResolvedValueOnce({
        content: [makeBudget()],
        page: { number: 0, size: 10, totalElements: 1, totalPages: 1 },
      })
      .mockReturnValueOnce(reload);

    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/budgets/new']}>
          <Routes>
            <Route path="/budgets" element={<BudgetPage />}>
              <Route path="new" element={<BudgetRegistrationPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ToastProvider>,
    );

    expect(
      await screen.findByRole('row', { name: 'Abrir detalhes do orçamento ORC-10' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Fechar orçamento' }));

    await waitFor(() => expect(service.getBudgetsPage).toHaveBeenCalledTimes(2));
    expect(
      screen.queryByRole('row', { name: 'Abrir detalhes do orçamento ORC-10' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Carregando orçamentos...')).toBeInTheDocument();

    await act(async () => {
      resolveReload({
        content: [persistedBudget],
        page: { number: 0, size: 10, totalElements: 1, totalPages: 1 },
      });
    });

    expect(
      await screen.findByRole('row', {
        name: 'Abrir detalhes do orçamento OCR-001-Const',
      }),
    ).toBeInTheDocument();
    expect(service.getBudgetsPage).toHaveBeenLastCalledWith(0, 50, {});
  });

  it('switches between accessible budget and proposal tabs in the creation flow', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/budgets/new?budgetId=budget-1']}>
        <Routes>
          <Route path="/budgets/new" element={<BudgetRegistrationPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByRole('tab', { name: 'Dados do orçamento' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await user.click(screen.getByRole('tab', { name: 'Proposta' }));
    expect(screen.getByRole('tab', { name: 'Proposta' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('PROPOSTA ORC-10')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Imprimir proposta' })).toBeInTheDocument();
  });

  it('uses roving keyboard navigation across all three tabs', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/budgets/new?budgetId=budget-1']}>
        <Routes>
          <Route path="/budgets/new" element={<BudgetRegistrationPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const dataTab = await screen.findByRole('tab', { name: 'Dados do orçamento' });

    dataTab.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Fases do orçamento' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Fases do orçamento' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Proposta' })).toHaveFocus();

    await user.keyboard('{Home}');
    expect(dataTab).toHaveFocus();
  });

  it('opens a read-only details dialog from the budget row', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/budgets']}>
        <BudgetPage />
      </MemoryRouter>,
    );

    await user.click(
      await screen.findByRole('row', { name: 'Abrir detalhes do orçamento ORC-10' }),
    );

    expect(await screen.findByRole('heading', { name: 'ORC-10 · Renovação' })).toBeInTheDocument();
    expect(screen.getByText('Detalhes do orçamento')).toBeInTheDocument();
    expect(screen.getByText('Total do orçamento')).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Lista de orçamentos' })).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Número')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Fechar detalhes do orçamento' }));

    expect(screen.queryByRole('heading', { name: 'ORC-10 · Renovação' })).not.toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Lista de orçamentos' })).toBeInTheDocument();
  });

  it('opens edit in the full wizard and updates draft data', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/budgets']}>
        <Routes>
          <Route path="/budgets" element={<BudgetPage />}>
            <Route path=":budgetId/edit" element={<BudgetRegistrationPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: 'Editar ORC-10' }));

    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getAllByRole('tab')).toHaveLength(3);
    expect(within(dialog).getByLabelText('Número')).toBeEnabled();
    await user.click(within(dialog).getByRole('tab', { name: 'Fases do orçamento' }));
    expect(within(dialog).getAllByLabelText('Nova fase')).toHaveLength(1);
    expect(within(dialog).getAllByRole('button', { name: 'Adicionar fase' })).toHaveLength(1);
    await user.click(within(dialog).getByRole('tab', { name: 'Dados do orçamento' }));
    await user.click(within(dialog).getByRole('button', { name: 'Atualizar orçamento' }));
    expect(service.saveBudget).toHaveBeenCalledWith(expect.any(Object), 'budget-1');
    expect(
      await within(dialog).findByText('Orçamento atualizado com sucesso.'),
    ).toBeInTheDocument();
  });

  it('shows a non-draft budget as read-only in the simple dialog', async () => {
    vi.mocked(service.getBudget).mockResolvedValue(makeBudget('FINALIZED'));

    render(
      <MemoryRouter initialEntries={['/budgets/budget-1']}>
        <Routes>
          <Route path="/budgets/:budgetId" element={<BudgetDetailsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const number = await screen.findByLabelText('Número');

    expect(number).toBeDisabled();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Salvar orçamento' })).not.toBeInTheDocument();
  });

  it('removes a draft service after confirmation and refreshes the budget', async () => {
    vi.mocked(service.getBudget).mockResolvedValue(makeBudgetWithItem());

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/budgets/new?budgetId=budget-1']}>
        <Routes>
          <Route path="/budgets/new" element={<BudgetRegistrationPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('tab', { name: 'Fases do orçamento' }));
    await user.click(screen.getByRole('button', { name: 'Remover Escavação da etapa Fundação' }));

    const dialogs = screen.getAllByRole('dialog');

    const confirmation = dialogs.at(-1)!;

    await user.click(within(confirmation).getByRole('button', { name: 'Remover serviço' }));

    expect(service.deleteBudgetItem).toHaveBeenCalledWith('budget-1', 'item-1');
    expect(await screen.findByText('Serviço removido com sucesso.')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Remover Escavação da etapa Fundação' }),
    ).not.toBeInTheDocument();
  });

  it('does not offer service removal outside a draft budget', async () => {
    vi.mocked(service.getBudget).mockResolvedValue(makeBudgetWithItem('FINALIZED'));

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/budgets/new?budgetId=budget-1']}>
        <Routes>
          <Route path="/budgets/new" element={<BudgetRegistrationPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('tab', { name: 'Fases do orçamento' }));
    expect(await screen.findByText('Escavação · 1 m³')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Remover Escavação/ })).not.toBeInTheDocument();
  });

  it('keeps finalized approval data for correction after an API failure', async () => {
    const finalized = makeBudget('FINALIZED');

    vi.mocked(service.getBudget).mockResolvedValue(finalized);
    vi.mocked(service.approveBudgetAndCreateProject).mockRejectedValue(
      new Error('Código já utilizado'),
    );

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/budgets/new?budgetId=budget-1']}>
        <Routes>
          <Route path="/budgets/new" element={<BudgetRegistrationPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('tab', { name: 'Fases do orçamento' }));
    await user.click(screen.getByRole('button', { name: 'Aprovar e gerar obra' }));

    const dialog = screen.getByRole('heading', { name: 'Aprovar e gerar obra' }).closest('dialog')!;

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
