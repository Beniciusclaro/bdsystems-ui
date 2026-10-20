import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MaterialForm } from './MaterialForm';
import type { SupplierResponse } from '../../suppliers/types/supplier';
const suppliers: SupplierResponse[] = ['A', 'B'].map((id) => ({
  id,
  legalName: `Fornecedor ${id}`,
  tradeName: null,
  taxNumber: null,
  email: null,
  phoneNumber: null,
  companyId: 'company',
  active: true,
  address: { street: '', city: '', state: '', zipCode: '' },
}));
function setup() {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  render(
    <MaterialForm
      associations={[]}
      categories={[]}
      units={[{ id: 'unit', code: 'KG', name: 'Quilograma', symbol: 'kg', active: true }]}
      suppliers={suppliers}
      busy={false}
      onSubmit={onSubmit}
      onCancel={vi.fn()}
      onManageCategories={vi.fn()}
    />,
  );
  return { user: userEvent.setup(), onSubmit };
}
async function fill(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Código'), 'MAT-1');
  await user.type(screen.getByLabelText('Nome'), 'Cimento');
  await user.selectOptions(screen.getByLabelText('Unidade de medida'), 'unit');
}
describe('MaterialForm', () => {
  it('saves without suppliers and trims required fields', async () => {
    const { user, onSubmit } = setup();
    await fill(user);
    await user.click(screen.getByRole('button', { name: 'Salvar material' }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'MAT-1', unitOfMeasureId: 'unit', suppliers: [] }),
    );
  });
  it('supports multiple suppliers, prevents duplicate choices and removes drafts', async () => {
    const { user, onSubmit } = setup();
    await fill(user);
    await user.click(screen.getByRole('button', { name: '+ Adicionar fornecedor' }));
    await user.selectOptions(screen.getByLabelText('Fornecedor 1'), 'A');
    await user.click(screen.getByRole('button', { name: '+ Adicionar fornecedor' }));
    expect(
      within(screen.getByLabelText('Fornecedor 2')).getByRole('option', { name: 'Fornecedor A' }),
    ).toBeDisabled();
    await user.selectOptions(screen.getByLabelText('Fornecedor 2'), 'B');
    await user.click(screen.getByRole('button', { name: 'Salvar material' }));
    expect(onSubmit.mock.calls[0][0].suppliers).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Remover fornecedor 1' }));
    await user.click(screen.getByRole('button', { name: 'Salvar material' }));
    expect(onSubmit.mock.calls[1][0].suppliers).toEqual([
      { supplierId: 'B', supplierCode: '', referencePrice: null },
    ]);
  });
  it('rejects negative prices and preserves input for correction', async () => {
    const { user, onSubmit } = setup();
    await fill(user);
    await user.click(screen.getByRole('button', { name: '+ Adicionar fornecedor' }));
    await user.selectOptions(screen.getByLabelText('Fornecedor 1'), 'A');
    const price = screen.getByLabelText(/Preço de referência/);
    await user.type(price, '-2');
    await user.click(screen.getByRole('button', { name: 'Salvar material' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Informe um preço');
    await user.clear(price);
    await user.type(price, '5.90');
    await user.click(screen.getByRole('button', { name: 'Salvar material' }));
    expect(onSubmit.mock.calls[0][0].suppliers[0].referencePrice).toBe(5.9);
  });
});
