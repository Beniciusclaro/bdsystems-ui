export interface EmployeeAddressRequest {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

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
  terminationDate?: string;
  status: EmployeeStatus;
}

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'TERMINATED';

export interface EmployeeResponse {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  documentNumber: string | null;
  birthDate: string | null;
  address: EmployeeAddressRequest;
  companyId: string;
  employeeNumber: string;
  position: string;
  department: string;
  admissionDate: string;
  terminationDate: string | null;
  status: EmployeeStatus | null;
}

export interface EmployeePage {
  content: EmployeeResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}
