import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SupplierListPage } from './SupplierListPage';
import { SupplierRegistrationPage } from './SupplierRegistrationPage';
import {
  deleteSupplier,
  getSupplier,
  getSuppliers,
  SupplierNotFoundError,
} from '../services/supplierService';

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

  it('searches by UUID and restores the paginated list when cleared', async () => {
    const user = userEvent.setup();

    const id = '550e8400-e29b-41d4-a716-446655440000';
    vi.mocked(getSupplier).mockResolvedValue({
      ...supplier,
      id,
      legalName: 'Fornecedor encontrado',
    });
    render(
      <MemoryRouter>
        <SupplierListPage />
      </MemoryRouter>,
    );
    await screen.findByRole('table');
    await user.type(screen.getByRole('searchbox', { name: 'ID do fornecedor' }), ` ${id} `);
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(await screen.findByText('Fornecedor encontrado')).toBeInTheDocument();
    expect(getSupplier).toHaveBeenCalledWith(id);
    expect(getSuppliers).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole('navigation', { name: 'Paginação da lista de fornecedores' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Limpar' }));
    expect(await screen.findByText('Oficina Central')).toBeInTheDocument();
    expect(getSuppliers).toHaveBeenCalledTimes(2);
  });

  it('validates UUIDs and handles missing suppliers and request failures', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SupplierListPage />
      </MemoryRouter>,
    );
    await screen.findByRole('table');
    const input = screen.getByRole('searchbox', { name: 'ID do fornecedor' });
    await user.type(input, 'invalid');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Informe um ID de fornecedor válido',
    );
    expect(getSupplier).not.toHaveBeenCalled();
    await user.clear(input);
    await user.type(input, '550e8400-e29b-41d4-a716-446655440000');
    vi.mocked(getSupplier).mockRejectedValueOnce(new SupplierNotFoundError());
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(await screen.findByText('Fornecedor não encontrado')).toBeInTheDocument();
    vi.mocked(getSupplier).mockRejectedValueOnce(new Error('Serviço indisponível'));
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(await screen.findByText('Serviço indisponível')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
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
