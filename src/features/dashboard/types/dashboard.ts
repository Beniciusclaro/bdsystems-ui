import type { Budget, Project } from '../../planning/types/planning';

export interface DashboardMetric {
  id: 'active-projects' | 'draft-budgets' | 'materials' | 'tools';
  label: string;
  value: number | null;
  hint: string;
  error?: string;
}

export interface ProjectStatusDatum {
  status: Project['status'];
  label: string;
  value: number;
}

export interface BudgetComparisonDatum {
  name: string;
  cost: number;
  sale: number;
}

export interface DashboardData {
  metrics: DashboardMetric[];
  projectStatuses: ProjectStatusDatum[];
  budgetComparison: BudgetComparisonDatum[];
  recentProjects: Project[];
  recentBudgets: Budget[];
  projectError?: string;
  budgetError?: string;
}
