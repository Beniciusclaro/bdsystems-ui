import type { EmployeeStatus } from './types/employee';

export const statusLabels: Record<EmployeeStatus, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  TERMINATED: 'Desligado',
  LEASED: 'Alocado',
};
const statusTones: Record<EmployeeStatus, 'success' | 'warning' | 'danger' | 'info'> = {
  ACTIVE: 'success',
  INACTIVE: 'warning',
  TERMINATED: 'danger',
  LEASED: 'info',
};
export const paymentMethodLabels = {
  MONTHLY: 'Mensal',
  WEEKLY: 'Semanal',
  DAILY: 'Diário',
  HOURLY: 'Hora',
} as const;

export const missingEmployeeValue = 'Não informado';

export function formatEmployeeValue(value: string | null | undefined): string {
  return value?.trim() || missingEmployeeValue;
}

export function getStatusLabel(status: EmployeeStatus | null): string {
  return status ? statusLabels[status] : missingEmployeeValue;
}
export function getStatusTone(status: EmployeeStatus | null) {
  return status ? statusTones[status] : 'neutral';
}
export function isEmployeeStatus(value: string): value is EmployeeStatus {
  return Object.prototype.hasOwnProperty.call(statusLabels, value);
}
export function formatDate(value: string | null): string {
  if (!value) return missingEmployeeValue;
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}
