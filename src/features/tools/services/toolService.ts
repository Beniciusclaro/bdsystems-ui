import { parsePage } from '../../../shared/api/parsePage';
import { apiFetch } from '../../../shared/api/client';
import { getApiErrorMessage } from '../../../shared/api/apiError';
import type { ToolFilters, ToolPage, ToolRequest, ToolResponse } from '../types/tool';

const TOOL_ERROR_MESSAGES: Partial<Record<number, string>> = {
  400: 'Confira os dados informados e tente novamente.',
  401: 'Sua sessão expirou. Entre novamente para continuar.',
  403: 'Você não tem autorização para consultar as ferramentas desta empresa.',
  404: 'A ferramenta não foi encontrada.',
  409: 'Já existe uma ferramenta com este código nesta empresa.',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTool(value: unknown): value is ToolResponse {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.code === 'string' &&
    typeof value.name === 'string' &&
    typeof value.active === 'boolean'
  );
}

function parseToolPage(value: unknown): ToolPage {
  return parsePage<ToolResponse>(value, isTool, 'A resposta da lista de ferramentas está em um formato inválido.');
}

function parseTool(value: unknown): ToolResponse {
  if (!isTool(value)) {
    throw new Error('A resposta dos dados da ferramenta está em um formato inválido.');
  }

  return value;
}

export async function getTools(
  page: number,
  size: number,
  filters: ToolFilters = {},
): Promise<ToolPage> {
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort: 'name,asc',
  });
  if (filters.active !== undefined) {
    query.set('active', String(filters.active));
  }
  if (filters.q) {
    query.set('q', filters.q);
  }

  const response = await apiFetch(`/api/tools?${query}`);
  if (!response.ok) {
    throw new Error(await getApiErrorMessage(
      response,
      'Não foi possível carregar as ferramentas.',
      TOOL_ERROR_MESSAGES,
    ));
  }

  return parseToolPage(await response.json());
}

export async function getTool(toolId: string): Promise<ToolResponse> {
  const response = await apiFetch(`/api/tools/${encodeURIComponent(toolId)}`);
  if (!response.ok) {
    throw new Error(await getApiErrorMessage(
      response,
      'Não foi possível carregar os dados da ferramenta.',
      TOOL_ERROR_MESSAGES,
    ));
  }

  return parseTool(await response.json());
}

export async function createTool(payload: ToolRequest): Promise<ToolResponse> {
  const response = await apiFetch(`/api/tools`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await getApiErrorMessage(
      response,
      'Não foi possível cadastrar a ferramenta.',
      TOOL_ERROR_MESSAGES,
    ));
  }

  return parseTool(await response.json());
}

export async function updateTool(toolId: string, payload: ToolRequest): Promise<void> {
  const response = await apiFetch(`/api/tools/${encodeURIComponent(toolId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await getApiErrorMessage(
      response,
      'Não foi possível atualizar a ferramenta.',
      TOOL_ERROR_MESSAGES,
    ));
  }
}

async function changeToolStatus(toolId: string, action: 'activate' | 'deactivate'): Promise<void> {
  const response = await apiFetch(
    `/api/tools/${encodeURIComponent(toolId)}/${action}`,
    {
      method: 'PATCH',
      },
  );
  if (!response.ok) {
    throw new Error(await getApiErrorMessage(
      response,
      `Não foi possível ${action === 'activate' ? 'ativar' : 'desativar'} a ferramenta.`,
      TOOL_ERROR_MESSAGES,
    ));
  }
}

export async function activateTool(toolId: string): Promise<void> {
  await changeToolStatus(toolId, 'activate');
}

export async function deactivateTool(toolId: string): Promise<void> {
  await changeToolStatus(toolId, 'deactivate');
}
