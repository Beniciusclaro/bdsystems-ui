import type { Budget, BudgetRequest } from './types/planning';

export type BudgetFormValue = Omit<BudgetRequest, 'taxPercent' | 'marginPercent' | 'validUntil'> & {
  validUntil: string;
  taxPercent: string;
  marginPercent: string;
};
export const emptyBudgetForm: BudgetFormValue = {
  clientId: '',
  number: '',
  title: '',
  proposedProjectName: '',
  proposedProjectDescription: '',
  proposedProjectStreet: '',
  proposedProjectCity: '',
  proposedProjectState: '',
  proposedProjectZipCode: '',
  validUntil: '',
  commercialTerms: '',
  notes: '',
  taxPercent: '0',
  marginPercent: '0',
};
export const budgetToForm = (budget: Budget): BudgetFormValue => ({
  clientId: budget.clientId,
  number: budget.number,
  title: budget.title,
  proposedProjectName: budget.proposedProjectName,
  proposedProjectDescription: budget.proposedProjectDescription ?? '',
  proposedProjectStreet: budget.proposedProjectStreet ?? '',
  proposedProjectCity: budget.proposedProjectCity ?? '',
  proposedProjectState: budget.proposedProjectState ?? '',
  proposedProjectZipCode: budget.proposedProjectZipCode ?? '',
  validUntil: budget.validUntil ?? '',
  commercialTerms: budget.commercialTerms ?? '',
  notes: budget.notes ?? '',
  taxPercent: String(budget.taxPercent),
  marginPercent: String(budget.marginPercent),
});
export const budgetFormToRequest = (form: BudgetFormValue): BudgetRequest => ({
  ...form,
  validUntil: form.validUntil || null,
  taxPercent: Number(form.taxPercent),
  marginPercent: Number(form.marginPercent),
});
