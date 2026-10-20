import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAllSuppliers } from '../../suppliers/services/supplierService';
import { getAllToolRentals, getToolRentals } from '../services/toolRentalService';
import { useToolRentalData } from './useToolRentalData';

vi.mock('../../suppliers/services/supplierService', () => ({ getAllSuppliers: vi.fn() }));
vi.mock('../services/toolRentalService', () => ({
  getAllToolRentals: vi.fn(),
  getToolRentals: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAllSuppliers).mockResolvedValue([]);
  vi.mocked(getAllToolRentals).mockResolvedValue([]);
  vi.mocked(getToolRentals).mockResolvedValue([]);
});

describe('useToolRentalData', () => {
  it('loads rental summaries only when enabled and details only when opened', async () => {
    const tool = { id: 'tool-1', code: 'F1', name: 'Furadeira', active: true };

    const { result } = renderHook(() => useToolRentalData(1));
    expect(getAllToolRentals).not.toHaveBeenCalled();
    expect(getToolRentals).not.toHaveBeenCalled();

    act(() => result.current.toggleRentalData(true));
    await waitFor(() => expect(getAllToolRentals).toHaveBeenCalledOnce());
    act(() => result.current.openTool(tool));
    await waitFor(() => expect(getToolRentals).toHaveBeenCalledWith('tool-1'));
    await waitFor(() => expect(getAllSuppliers).toHaveBeenCalledOnce());
    expect(result.current.selectedTool).toEqual(tool);
  });
});
