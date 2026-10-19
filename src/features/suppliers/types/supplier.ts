import type { PageResult } from '../../../shared/types/pagination';

export interface SupplierAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface SupplierRequest {
  legalName: string;
  tradeName: string | null;
  taxNumber: string | null;
  email: string | null;
  phoneNumber: string | null;
  address: SupplierAddress;
}

export interface SupplierResponse {
  id: string;
  legalName: string;
  tradeName: string | null;
  taxNumber: string | null;
  email: string | null;
  phoneNumber: string | null;
  address: SupplierAddress;
  companyId: string;
  active: boolean;
}

export type SupplierPage = PageResult<SupplierResponse>;
