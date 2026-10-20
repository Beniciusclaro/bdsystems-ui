export interface UnitOfMeasure {
  id: string;
  code: string;
  name: string;
  symbol: string;
  active: boolean;
}
export interface MaterialCategory {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
}
export interface Material {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  unitOfMeasure: UnitOfMeasure;
  category: MaterialCategory | null;
  active: boolean;
  createdAt: string;
}
export interface MaterialSupplierRequest {
  supplierId: string;
  supplierCode: string;
  referencePrice: number | null;
}
export interface MaterialSupplier extends MaterialSupplierRequest {
  id: string;
  supplierName: string;
}
export interface MaterialRequest {
  code: string;
  name: string;
  description: string;
  unitOfMeasureId: string;
  categoryId: string | null;
  active: boolean;
  suppliers: MaterialSupplierRequest[];
}
export interface MaterialFilters {
  name?: string;
  code?: string;
  categoryId?: string;
  active?: boolean;
  sort?: string;
}
