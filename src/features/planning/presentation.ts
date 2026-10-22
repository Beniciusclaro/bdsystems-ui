import type { Budget, Project } from './types/planning';

export const budgetStatusLabel: Record<Budget['status'], string> = {
  DRAFT: 'Rascunho',
  FINALIZED: 'Finalizado',
  APPROVED: 'Aprovado',
  REJECTED: 'Recusado',
};
export const budgetStatusTone: Record<Budget['status'], 'success' | 'warning' | 'danger' | 'info'> =
  {
    DRAFT: 'info',
    FINALIZED: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
  };
export const projectStatusLabel: Record<Project['status'], string> = {
  PLANNING: 'Planeamento',
  ACTIVE: 'Em execução',
  ON_HOLD: 'Pausada',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
};
export const projectStatusTone: Record<
  Project['status'],
  'success' | 'warning' | 'danger' | 'info' | 'neutral'
> = {
  PLANNING: 'info',
  ACTIVE: 'success',
  ON_HOLD: 'warning',
  COMPLETED: 'neutral',
  CANCELLED: 'danger',
};
export const money = (value: number) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
