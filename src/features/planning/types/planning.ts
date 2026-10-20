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
  projectId: string;
  projectName: string;
  validUntil: string | null;
  commercialTerms: string | null;
  notes: string | null;
  taxPercent: number;
  marginPercent: number;
  status: 'DRAFT' | 'FINALIZED';
  finalizedAt: string | null;
  totalCost: number;
  totalSalePrice: number;
  stages: BudgetStage[];
}
export interface BudgetRequest {
  clientId: string;
  projectId: string;
  number: string;
  title: string;
  validUntil: string | null;
  commercialTerms: string;
  notes: string;
  taxPercent: number;
  marginPercent: number;
}
