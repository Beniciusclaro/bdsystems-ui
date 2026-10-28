import type { PageResult } from '../../../shared/types/pagination';

export interface EmployeeAddressRequest {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export type EmployeePaymentMethod = 'MONTHLY' | 'WEEKLY' | 'DAILY' | 'HOURLY';

export type UserRole = 'USER' | 'MANAGER' | 'ADMIN';

export type UserAccessStatus = 'NONE' | 'PENDING' | 'EXPIRED' | 'ACTIVE';

export interface EmployeeRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  documentNumber?: string;
  birthDate?: string;
  address: EmployeeAddressRequest;
  employeeNumber: string;
  position: string;
  department: string;
  admissionDate: string;
  paymentMethod: EmployeePaymentMethod;
  paymentAmount: number;
  terminationDate?: string;
  status: EmployeeStatus;
  userRole?: UserRole;
}

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'LEASED';

export interface EmployeeFilters {
  status?: EmployeeStatus;
  position?: string;
  department?: string;
}

export interface EmployeeResponse {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  documentNumber: string | null;
  birthDate: string | null;
  address: EmployeeAddressRequest | null;
  companyId: string;
  employeeNumber: string | null;
  position: string | null;
  department: string | null;
  admissionDate: string | null;
  paymentMethod?: EmployeePaymentMethod | null;
  paymentAmount?: number | null;
  terminationDate: string | null;
  status: EmployeeStatus | null;
  userRole: UserRole | null;
  userAccessStatus: UserAccessStatus;
}

export type EmployeePage = PageResult<EmployeeResponse>;
