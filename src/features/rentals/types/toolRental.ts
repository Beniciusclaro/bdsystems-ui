import type { PageResult } from '../../../shared/types/pagination';

export type RentalPeriod = 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';

export interface ToolRentalRequest {
  toolId: string;
  supplierId: string;
  price: number;
  rentalPeriod: RentalPeriod;
  rentalStartDate: string | null;
  rentalEndDate: string | null;
}

export interface ToolRentalDraft {
  supplierId: string;
  price: string;
  rentalPeriod: RentalPeriod;
  rentalStartDate: string;
  rentalEndDate: string;
}

export const EMPTY_TOOL_RENTAL_DRAFT: ToolRentalDraft = {
  supplierId: '',
  price: '',
  rentalPeriod: 'DAY',
  rentalStartDate: '',
  rentalEndDate: '',
};

export interface ToolRentalResponse {
  id: string;
  toolId: string;
  supplierId: string;
  price: number;
  rentalPeriod: RentalPeriod;
  rentalStartDate: string | null;
  rentalEndDate: string | null;
}

export type ToolRentalPage = PageResult<ToolRentalResponse>;
