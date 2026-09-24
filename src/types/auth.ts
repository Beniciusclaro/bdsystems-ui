export type Role = 'ADMIN' | 'USER' | 'MANAGER' | string;

export interface AddressRequest {
  street: string;
  city: string;
  state: string;
  zipcode: string;
}

export interface CompanyRequest {
  name?: string;
  id?: string;
  address?: AddressRequest;
}

export interface UserRequest {
  name: string;
  email: string;
  password: string;
  role: Role;
  companyName: string;
  address: AddressRequest;
  company?: CompanyRequest;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserResponse {
  token?: string;
}

export interface LoginResponse {
  token?: string;
}
