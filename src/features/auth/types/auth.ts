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
  rememberMe: boolean;
}

export interface AuthResponse {
  token: string;
  expiresInSeconds: number;
}

export type UserResponse = AuthResponse;
export type LoginResponse = AuthResponse;

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
