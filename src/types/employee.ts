export interface EmployeeAddressRequest {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface EmployeeRequest {
  fullName: string;
  email: string;
  phoneNumber?: string;
  documentNumber?: string;
  birthDate?: string;
  address: EmployeeAddressRequest;
  employeeNumber: string;
  position: string;
  department: string;
  admissionDate: string;
  terminationDate?: string;
}
