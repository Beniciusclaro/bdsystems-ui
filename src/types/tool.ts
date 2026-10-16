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

export interface ToolPage {
  content: ToolResponse[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface ToolFilters {
  active?: boolean;
  q?: string;
}
