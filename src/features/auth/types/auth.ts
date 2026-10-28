export interface AddressRequest {
  street: string;
  city: string;
  state: string;
  zipcode: string;
}

export interface CompanyRequest {
  name: string;
  address: AddressRequest;
}

export interface UserRequest {
  name: string;
  email: string;
  password: string;
  company: CompanyRequest;
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

export interface AcceptInvitationRequest {
  token: string;
  password: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  password: string;
}
