import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { MaterialRegistrationPage } from './MaterialRegistrationPage';
import * as service from '../services/materialService';
import { getAllSuppliers } from '../../suppliers/services/supplierService';
vi.mock('../services/materialService', () => ({
  getCategories: vi.fn(),
  getUnits: vi.fn(),
  getMaterial: vi.fn(),
  getMaterialSuppliers: vi.fn(),
  saveMaterial: vi.fn(),
  removeMaterialSupplier: vi.fn(),
}));
vi.mock('../../suppliers/services/supplierService', () => ({ getAllSuppliers: vi.fn() }));
const unit = { id: 'unit', code: 'KG', name: 'Quilograma', symbol: 'kg', active: true };

const material = {
  id: 'material',
  code: 'MAT',
  name: 'Cimento',
  unitOfMeasure: unit,
  category: null,
  active: true,
  createdAt: '',
};
function mount() {
  render(
    <MemoryRouter initialEntries={['/materials/material/edit']}>
      <Routes>
        <Route
          path="/materials"
          element={
            <>
              <p>Lista</p>
              <Outlet context={{ refreshMaterials: vi.fn(), notify: vi.fn() }} />
            </>
          }
        >
          <Route path=":materialId/edit" element={<MaterialRegistrationPage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(service.getCategories).mockResolvedValue([]);
  vi.mocked(service.getUnits).mockResolvedValue([unit]);
  vi.mocked(getAllSuppliers).mockResolvedValue([]);
  vi.mocked(service.getMaterial).mockResolvedValue(material);
  vi.mocked(service.getMaterialSuppliers).mockResolvedValue([
    {
      id: 'association',
      supplierId: 'supplier',
      supplierName: 'Fornecedor',
      supplierCode: '',
      referencePrice: 5.9,
    },
  ]);
  vi.mocked(service.saveMaterial).mockResolvedValue(material);
  vi.mocked(service.removeMaterialSupplier).mockResolvedValue(undefined);
});
it('loads an edit and deletes omitted associations only after saving', async () => {
  mount();
  const user = userEvent.setup();
  expect(await screen.findByDisplayValue('Cimento')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Remover fornecedor 1' }));
  await user.click(screen.getByRole('button', { name: 'Salvar material' }));
  expect(service.saveMaterial).toHaveBeenCalledWith(
    'material',
    expect.objectContaining({ suppliers: [] }),
  );
  expect(service.removeMaterialSupplier).toHaveBeenCalledWith('material', 'association');
  expect(vi.mocked(service.saveMaterial).mock.invocationCallOrder[0]).toBeLessThan(
    vi.mocked(service.removeMaterialSupplier).mock.invocationCallOrder[0],
  );
  expect(screen.queryByRole('heading', { name: 'Editar material' })).not.toBeInTheDocument();
});
it('preserves edits after a partial failure and allows retrying removals', async () => {
  vi.mocked(service.removeMaterialSupplier).mockRejectedValueOnce(new Error('Falha na remoção'));
  mount();
  const user = userEvent.setup();
  await screen.findByDisplayValue('Cimento');
  await user.click(screen.getByRole('button', { name: 'Remover fornecedor 1' }));
  await user.click(screen.getByRole('button', { name: 'Salvar material' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Os dados do material foram salvos');
  expect(screen.getByDisplayValue('Cimento')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Salvar material' }));
  expect(service.removeMaterialSupplier).toHaveBeenCalledTimes(2);
});
