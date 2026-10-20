import { getMaterials } from '../../materials/services/materialService';
import { getBudgets, getProjects } from '../../planning/services/planningService';
import { getTools } from '../../tools/services/toolService';
import type { DashboardData, DashboardMetric, ProjectStatusDatum } from '../types/dashboard';

const projectStatusLabels = {
  PLANNING: 'Planeamento',
  ACTIVE: 'Em execução',
  ON_HOLD: 'Em pausa',
  COMPLETED: 'Concluídas',
  CANCELLED: 'Canceladas',
} as const;

function errorMessage(reason: unknown, fallback: string) {
  return reason instanceof Error ? reason.message : fallback;
}

export async function getDashboardData(): Promise<DashboardData> {
  const [projectsResult, budgetsResult, materialsResult, toolsResult] = await Promise.allSettled([
    getProjects(),
    getBudgets(),
    getMaterials(0, 1, {}),
    getTools(0, 1),
  ]);

  const projects = projectsResult.status === 'fulfilled' ? projectsResult.value : [];

  const budgets = budgetsResult.status === 'fulfilled' ? budgetsResult.value : [];

  const projectStatuses = Object.entries(projectStatusLabels)
    .map<ProjectStatusDatum>(([status, label]) => ({
      status: status as ProjectStatusDatum['status'],
      label,
      value: projects.filter((project) => project.status === status).length,
    }))
    .filter((item) => item.value > 0);

  const metrics: DashboardMetric[] = [
    {
      id: 'active-projects',
      label: 'Obras em execução',
      value:
        projectsResult.status === 'fulfilled'
          ? projects.filter((project) => project.status === 'ACTIVE').length
          : null,
      hint: 'Projetos com atividade em curso',
      ...(projectsResult.status === 'rejected'
        ? { error: errorMessage(projectsResult.reason, 'Não foi possível carregar as obras.') }
        : {}),
    },
    {
      id: 'draft-budgets',
      label: 'Orçamentos em rascunho',
      value:
        budgetsResult.status === 'fulfilled'
          ? budgets.filter((budget) => budget.status === 'DRAFT').length
          : null,
      hint: 'Aguardando conclusão',
      ...(budgetsResult.status === 'rejected'
        ? { error: errorMessage(budgetsResult.reason, 'Não foi possível carregar os orçamentos.') }
        : {}),
    },
    {
      id: 'materials',
      label: 'Materiais cadastrados',
      value:
        materialsResult.status === 'fulfilled' ? materialsResult.value.page.totalElements : null,
      hint: 'Itens disponíveis para composições',
      ...(materialsResult.status === 'rejected'
        ? { error: errorMessage(materialsResult.reason, 'Não foi possível carregar os materiais.') }
        : {}),
    },
    {
      id: 'tools',
      label: 'Ferramentas cadastradas',
      value: toolsResult.status === 'fulfilled' ? toolsResult.value.page.totalElements : null,
      hint: 'Equipamentos sob gestão',
      ...(toolsResult.status === 'rejected'
        ? { error: errorMessage(toolsResult.reason, 'Não foi possível carregar as ferramentas.') }
        : {}),
    },
  ];

  return {
    metrics,
    projectStatuses,
    budgetComparison: budgets
      .slice(0, 6)
      .reverse()
      .map((budget) => ({
        name: budget.number,
        cost: budget.totalCost,
        sale: budget.totalSalePrice,
      })),
    recentProjects: projects.slice(0, 5),
    recentBudgets: budgets.slice(0, 5),
    ...(projectsResult.status === 'rejected'
      ? { projectError: errorMessage(projectsResult.reason, 'Não foi possível carregar as obras.') }
      : {}),
    ...(budgetsResult.status === 'rejected'
      ? {
          budgetError: errorMessage(
            budgetsResult.reason,
            'Não foi possível carregar os orçamentos.',
          ),
        }
      : {}),
  };
}
