import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SupplierListPage } from './SupplierListPage';
import { SupplierRegistrationPage } from './SupplierRegistrationPage';
import { deleteSupplier, getSupplier, getSuppliers } from '../services/supplierService';

vi.mock('../services/supplierService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/supplierService')>()),
  getSuppliers: vi.fn(),
  getSupplier: vi.fn(),
  deleteSupplier: vi.fn(),
  createSupplier: vi.fn(),
  updateSupplier: vi.fn(),
}));

const supplier = {
  id: 'supplier-1',
  legalName: 'Oficina Central',
  tradeName: null,
  taxNumber: null,
  email: null,
  phoneNumber: null,
  address: { street: 'Rua A', city: 'Lisboa', state: 'Lisboa', zipCode: '1000' },
  companyId: 'company-1',
  active: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSuppliers).mockResolvedValue({
    content: [supplier],
    page: { size: 10, number: 0, totalElements: 1, totalPages: 1 },
  });
  vi.mocked(getSupplier).mockResolvedValue(supplier);
  vi.mocked(deleteSupplier).mockResolvedValue();
});

describe('supplier flows', () => {
  it('loads a supplier by ID when an edit URL is opened directly', async () => {
    render(
      <MemoryRouter initialEntries={['/suppliers/supplier-1/edit']}>
        <Routes>
          <Route
            path="/suppliers"
            element={
              <Outlet context={{ refreshSuppliers: vi.fn(), suppliers: [], isLoading: false }} />
            }
          >
            <Route path=":supplierId/edit" element={<SupplierRegistrationPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'Editar fornecedor' })).toBeInTheDocument();
    expect(await screen.findByDisplayValue('Oficina Central')).toBeInTheDocument();
    expect(getSupplier).toHaveBeenCalledWith('supplier-1');
  });

  it('filters suppliers by name and tax number and restores the list when cleared', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <SupplierListPage />
      </MemoryRouter>,
    );
    await screen.findByRole('table');
    await user.type(screen.getByRole('searchbox', { name: 'Nome' }), ' Oficina ');
    await user.type(screen.getByRole('searchbox', { name: 'Documento fiscal' }), ' 123456 ');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    await waitFor(() =>
      expect(getSuppliers).toHaveBeenLastCalledWith(0, 10, {
        name: 'Oficina',
        taxNumber: '123456',
      }),
    );
    expect(screen.getByRole('combobox', { name: 'Itens por página' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Limpar' }));
    expect(await screen.findByText('Oficina Central')).toBeInTheDocument();
    await waitFor(() => expect(getSuppliers).toHaveBeenLastCalledWith(0, 10, {}));
  });

  it('shows a filtered empty state and clears the search', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <SupplierListPage />
      </MemoryRouter>,
    );

    await screen.findByRole('table');

    vi.mocked(getSuppliers).mockResolvedValueOnce({
      content: [],
      page: { size: 10, number: 0, totalElements: 0, totalPages: 0 },
    });
    await user.type(screen.getByRole('searchbox', { name: 'Nome' }), 'Inexistente');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(await screen.findByText('Nenhum fornecedor encontrado')).toBeInTheDocument();
    expect(screen.getByText(/Altere os filtros/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Limpar busca' }));
    expect(await screen.findByText('Oficina Central')).toBeInTheDocument();
  });

  it('confirms deletion and reloads the list', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/suppliers']}>
        <Routes>
          <Route path="/suppliers" element={<SupplierListPage />} />
        </Routes>
      </MemoryRouter>,
    );
    await screen.findByRole('table', { name: 'Lista de fornecedores' });
    await user.click(screen.getByRole('button', { name: 'Excluir Oficina Central' }));
    expect(screen.getByRole('heading', { name: 'Excluir fornecedor?' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Excluir fornecedor' }));
    await waitFor(() => expect(deleteSupplier).toHaveBeenCalledWith('supplier-1'));
    await waitFor(() => expect(getSuppliers).toHaveBeenCalledTimes(2));
  });
});
