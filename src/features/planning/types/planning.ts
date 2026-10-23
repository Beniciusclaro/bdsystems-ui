export type ClientType = 'INDIVIDUAL' | 'COMPANY';
export interface Client {
  id: string;
  type: ClientType;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  active: boolean;
}
export type ClientRequest = Omit<Client, 'id'>;
export interface Project {
  id: string;
  clientId: string;
  clientName: string;
  code: string;
  name: string;
  description: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  plannedStartDate: string | null;
  plannedEndDate: string | null;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  active: boolean;
}
export type ProjectRequest = Omit<Project, 'id' | 'clientName'>;
export interface ProjectFilters {
  search?: string;
  status?: Project['status'];
  active?: boolean;
  clientId?: string;
  sort?: string;
}
export interface LaborRole {
  id: string;
  code: string;
  name: string;
  description: string | null;
  costingMode: 'EMPLOYEE_AVERAGE' | 'MANUAL';
  manualHourlyCost: number | null;
  currentHourlyCost: number | null;
  eligibleEmployees: number;
  active: boolean;
}
export interface LaborRoleRequest {
  code: string;
  name: string;
  description: string;
  costingMode: LaborRole['costingMode'];
  manualHourlyCost: number | null;
  active: boolean;
}
export interface LaborRoleFilters {
  search?: string;
  active?: boolean;
  sort?: string;
}
export interface LaborCostProfile {
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  position: string;
  paymentMethod: 'MONTHLY' | 'WEEKLY' | 'DAILY' | 'HOURLY' | null;
  paymentAmount: number | null;
  configured: boolean;
  laborRoleId?: string | null;
  laborRoleCode?: string | null;
  laborRoleName?: string | null;
  productiveHoursMonth?: number | null;
  workDaysMonth?: number | null;
  employerChargesPercent?: number | null;
  monthlyBenefits?: number | null;
  otherMonthlyCosts?: number | null;
  effectiveHourlyCost?: number | null;
}
export interface LaborCostProfileFilters {
  search?: string;
  configured?: boolean;
  sort?: string;
}
export type ComponentType = 'MATERIAL' | 'LABOR' | 'EQUIPMENT' | 'CUSTOM';
export interface CompositionComponent {
  id?: string;
  type: ComponentType;
  referenceId?: string | null;
  description: string;
  unitLabel: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  sortOrder: number;
}
export interface Composition {
  id: string;
  code: string;
  name: string;
  description: string | null;
  unitOfMeasureId: string;
  unitSymbol: string;
  baseYield: number;
  active: boolean;
  components: CompositionComponent[];
  totalCost: number;
  unitCost: number;
}
export interface CompositionComponentRequest {
  type: ComponentType;
  materialId?: string;
  supplierMaterialId?: string;
  laborRoleId?: string;
  toolRentalId?: string;
  description?: string;
  unitLabel?: string;
  quantity: number;
  unitCost?: number;
  sortOrder: number;
}
export interface CompositionRequest {
  code: string;
  name: string;
  description: string;
  unitOfMeasureId: string;
  baseYield: number;
  active: boolean;
  components: CompositionComponentRequest[];
}
export interface CompositionFilters {
  search?: string;
  active?: boolean;
  sort?: string;
}
export interface BudgetItem {
  id: string;
  sourceCompositionId: string;
  code: string;
  name: string;
  description: string | null;
  unitSymbol: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  unitSalePrice: number;
  totalSalePrice: number;
  components: CompositionComponent[];
}
export interface BudgetStage {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  totalCost: number;
  totalSalePrice: number;
  items: BudgetItem[];
}
export interface Budget {
  id: string;
  number: string;
  title: string;
  clientId: string;
  clientName: string;
  proposedProjectName: string;
  proposedProjectDescription: string | null;
  proposedProjectStreet: string | null;
  proposedProjectCity: string | null;
  proposedProjectState: string | null;
  proposedProjectZipCode: string | null;
  projectId?: string | null;
  projectName?: string | null;
  projectLinkOrigin: 'LEGACY' | 'GENERATED' | null;
  validUntil: string | null;
  commercialTerms: string | null;
  notes: string | null;
  taxPercent: number;
  marginPercent: number;
  status: 'DRAFT' | 'FINALIZED' | 'APPROVED' | 'REJECTED';
  finalizedAt: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  totalCost: number;
  totalSalePrice: number;
  stages: BudgetStage[];
}
export interface BudgetRequest {
  clientId: string;
  number: string;
  title: string;
  proposedProjectName: string;
  proposedProjectDescription: string;
  proposedProjectStreet: string;
  proposedProjectCity: string;
  proposedProjectState: string;
  proposedProjectZipCode: string;
  validUntil: string | null;
  commercialTerms: string;
  notes: string;
  taxPercent: number;
  marginPercent: number;
}
export interface BudgetFilters {
  search?: string;
  status?: Budget['status'];
  sort?: string;
}

export interface BudgetApprovalRequest {
  code: string;
  name: string;
  description: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  plannedStartDate: string | null;
  plannedEndDate: string | null;
}

export interface BudgetApprovalResponse {
  budget: Budget;
  project: Project;
}

export interface DuplicateBudgetRequest {
  number: string;
}
