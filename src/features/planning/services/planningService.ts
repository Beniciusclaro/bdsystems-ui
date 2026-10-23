import { apiFetch } from '../../../shared/api/client';
import { getApiErrorMessage } from '../../../shared/api/apiError';
import type { PageResult } from '../../../shared/types/pagination';
import type {
  Budget,
  BudgetApprovalRequest,
  BudgetApprovalResponse,
  BudgetRequest,
  Client,
  ClientRequest,
  Composition,
  CompositionRequest,
  DuplicateBudgetRequest,
  LaborRole,
  LaborRoleFilters,
  LaborRoleRequest,
  LaborCostProfile,
  LaborCostProfileFilters,
  Project,
  ProjectFilters,
  ProjectRequest,
  BudgetFilters,
  CompositionFilters,
} from '../types/planning';

async function call<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await apiFetch(`/api${path}`, {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok)
    throw new Error(await getApiErrorMessage(response, 'Não foi possível concluir a operação.'));
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
async function all<T>(path: string, sort = 'name,asc'): Promise<T[]> {
  const result = await call<PageResult<T>>(`${path}?size=200&sort=${encodeURIComponent(sort)}`);
  return result.content;
}
async function page<T>(path: string, index: number, size: number, filters: object) {
  const query = new URLSearchParams({ page: String(index), size: String(size) });

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });

  return call<PageResult<T>>(`${path}?${query}`);
}
export const getClients = () => all<Client>('/clients');
export const saveClient = (value: ClientRequest, id?: string) =>
  call<Client>(id ? `/clients/${id}` : '/clients', id ? 'PUT' : 'POST', value);
export const getProjects = () => all<Project>('/projects');
export const getProjectsPage = (index: number, size: number, filters: ProjectFilters) =>
  page<Project>('/projects', index, size, { sort: 'name,asc', ...filters });
export const getProject = (id: string) => call<Project>(`/projects/${id}`);
export const saveProject = (value: ProjectRequest, id?: string) =>
  call<Project>(id ? `/projects/${id}` : '/projects', id ? 'PUT' : 'POST', value);
export const getLaborRoles = () => all<LaborRole>('/labor-roles');
export const getLaborRolesPage = (index: number, size: number, filters: LaborRoleFilters) =>
  page<LaborRole>('/labor-roles', index, size, { sort: 'name,asc', ...filters });
export const saveLaborRole = (value: LaborRoleRequest, id?: string) =>
  call<LaborRole>(id ? `/labor-roles/${id}` : '/labor-roles', id ? 'PUT' : 'POST', value);
export interface LaborProfileRequest {
  laborRoleId: string;
  productiveHoursMonth: number;
  workDaysMonth: number | null;
  employerChargesPercent: number;
  monthlyBenefits: number;
  otherMonthlyCosts: number;
}
export const saveLaborProfile = (employeeId: string, value: LaborProfileRequest) =>
  call(`/labor-roles/employees/${employeeId}/cost-profile`, 'PUT', value);
export const getLaborProfiles = (index: number, size: number, filters: LaborCostProfileFilters) =>
  page<LaborCostProfile>('/labor-cost-profiles', index, size, {
    sort: 'employeeName,asc',
    ...filters,
  });
export const getLaborProfile = (employeeId: string) =>
  call<LaborCostProfile>(`/labor-roles/employees/${employeeId}/cost-profile`);
export const getCompositions = () =>
  page<Composition>('/compositions', 0, 200, { active: true, sort: 'name,asc' }).then(
    (result) => result.content,
  );
export const getCompositionsPage = (index: number, size: number, filters: CompositionFilters) =>
  page<Composition>('/compositions', index, size, { sort: 'name,asc', ...filters });
export const getComposition = (id: string) => call<Composition>(`/compositions/${id}`);
export const saveComposition = (value: CompositionRequest, id?: string) =>
  call<Composition>(id ? `/compositions/${id}` : '/compositions', id ? 'PUT' : 'POST', value);
export const setCompositionStatus = (id: string, active: boolean) =>
  call<void>(`/compositions/${id}/status`, 'PATCH', { active });
export const getBudgets = () => all<Budget>('/budgets', 'createdAt,desc');
export const getBudgetsPage = (index: number, size: number, filters: BudgetFilters) =>
  page<Budget>('/budgets', index, size, { sort: 'createdAt,desc', ...filters });
export const getBudget = (id: string) => call<Budget>(`/budgets/${id}`);
export const saveBudget = (value: BudgetRequest, id?: string) =>
  call<Budget>(id ? `/budgets/${id}` : '/budgets', id ? 'PUT' : 'POST', value);
export const addBudgetStage = (id: string, name: string) =>
  call<Budget>(`/budgets/${id}/stages`, 'POST', { name });
export const addBudgetItem = (
  id: string,
  stageId: string,
  compositionId: string,
  quantity: number,
) => call<Budget>(`/budgets/${id}/stages/${stageId}/items`, 'POST', { compositionId, quantity });
export const deleteBudgetItem = (id: string, itemId: string) =>
  call<Budget>(`/budgets/${id}/items/${itemId}`, 'DELETE');
export const changeBudgetItemQuantity = (id: string, itemId: string, quantity: number) =>
  call<Budget>(`/budgets/${id}/items/${itemId}/quantity`, 'PATCH', { quantity });
export const refreshBudgetItem = (id: string, itemId: string) =>
  call<Budget>(`/budgets/${id}/items/${itemId}/refresh`, 'POST');
export const finalizeBudget = (id: string) => call<Budget>(`/budgets/${id}/finalize`, 'POST');
export const approveBudgetAndCreateProject = (id: string, value: BudgetApprovalRequest) =>
  call<BudgetApprovalResponse>(`/budgets/${id}/approve-and-create-project`, 'POST', value);
export const rejectBudget = (id: string) => call<Budget>(`/budgets/${id}/reject`, 'POST');
export const duplicateBudget = (id: string, value: DuplicateBudgetRequest) =>
  call<Budget>(`/budgets/${id}/duplicate`, 'POST', value);
export const deleteBudget = (id: string) => call<void>(`/budgets/${id}`, 'DELETE');
export const reloadProjects = getProjects;
