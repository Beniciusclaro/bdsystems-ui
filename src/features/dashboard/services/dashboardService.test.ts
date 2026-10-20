import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getMaterials } from '../../materials/services/materialService';
import { getBudgets, getProjects } from '../../planning/services/planningService';
import { getTools } from '../../tools/services/toolService';
import { getDashboardData } from './dashboardService';

vi.mock('../../materials/services/materialService', () => ({ getMaterials: vi.fn() }));
vi.mock('../../planning/services/planningService', () => ({
  getProjects: vi.fn(),
  getBudgets: vi.fn(),
}));
vi.mock('../../tools/services/toolService', () => ({ getTools: vi.fn() }));

const project = {
  id: 'project-1',
  clientId: 'client-1',
  clientName: 'Cliente',
  code: 'OB-1',
  name: 'Obra central',
  description: null,
  street: null,
  city: null,
  state: null,
  zipCode: null,
  plannedStartDate: null,
  plannedEndDate: null,
  status: 'ACTIVE' as const,
  active: true,
};

const budget = {
  id: 'budget-1',
  number: 'ORC-1',
  title: 'Orçamento central',
  clientId: 'client-1',
  clientName: 'Cliente',
  projectId: 'project-1',
  projectName: 'Obra central',
  validUntil: null,
  commercialTerms: null,
  notes: null,
  taxPercent: 0,
  marginPercent: 20,
  status: 'DRAFT' as const,
  finalizedAt: null,
  totalCost: 100,
  totalSalePrice: 120,
  stages: [],
};

const page = (totalElements: number) => ({
  content: [],
  page: { size: 1, number: 0, totalElements, totalPages: totalElements ? 1 : 0 },
});

describe('getDashboardData', () => {
  beforeEach(() => {
    vi.mocked(getProjects).mockResolvedValue([project]);
    vi.mocked(getBudgets).mockResolvedValue([budget]);
    vi.mocked(getMaterials).mockResolvedValue(page(12));
    vi.mocked(getTools).mockResolvedValue(page(7));
  });

  it('derives operational metrics and chart data from existing services', async () => {
    const result = await getDashboardData();

    expect(result.metrics.map((metric) => metric.value)).toEqual([1, 1, 12, 7]);
    expect(result.projectStatuses).toEqual([{ status: 'ACTIVE', label: 'Em execução', value: 1 }]);
    expect(result.budgetComparison[0]).toEqual({ name: 'ORC-1', cost: 100, sale: 120 });
  });

  it('keeps available cards when one service fails', async () => {
    vi.mocked(getProjects).mockRejectedValue(new Error('Projetos indisponíveis'));

    const result = await getDashboardData();

    expect(result.projectError).toBe('Projetos indisponíveis');
    expect(result.metrics.find((metric) => metric.id === 'active-projects')?.value).toBeNull();
    expect(result.metrics.find((metric) => metric.id === 'materials')?.value).toBe(12);
  });
});
