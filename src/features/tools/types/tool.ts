import type { PageResult } from '../../../shared/types/pagination';

export interface ToolRequest {
  code: string;
  name: string;
}

export interface ToolResponse {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

export type ToolPage = PageResult<ToolResponse>;

export interface ToolFilters {
  active?: boolean;
  q?: string;
}
