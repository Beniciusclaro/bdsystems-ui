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
  companyName: string;
  company: CompanyRequest & {
    name: string;
    address: AddressRequest;
  };
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
