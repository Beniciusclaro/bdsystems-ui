import { DetailList, type DetailItem } from '../../../shared/components/ui/DetailList';
import { DetailsDialog } from '../../../shared/components/ui/DetailsDialog';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { budgetStatusLabel, budgetStatusTone, money } from '../presentation';
import type { Budget } from '../types/planning';

interface BudgetDetailsDialogProps {
  budget: Budget | null;
  onClose: () => void;
}

const formatDate = (value: string | null) =>
  value ? new Intl.DateTimeFormat('pt-PT').format(new Date(`${value}T00:00:00`)) : '—';

export function BudgetDetailsDialog({ budget, onClose }: BudgetDetailsDialogProps) {
  const items: DetailItem[] = budget
    ? [
        { key: 'client', label: 'Cliente', value: budget.clientName },
        {
          key: 'status',
          label: 'Status',
          value: (
            <StatusBadge tone={budgetStatusTone[budget.status]}>
              {budgetStatusLabel[budget.status]}
            </StatusBadge>
          ),
        },
        {
          key: 'project',
          label: 'Obra',
          value: budget.projectName ?? budget.proposedProjectName,
        },
        { key: 'validUntil', label: 'Validade', value: formatDate(budget.validUntil) },
        { key: 'totalCost', label: 'Custo total', value: money(budget.totalCost) },
        { key: 'totalSalePrice', label: 'Total do orçamento', value: money(budget.totalSalePrice) },
        { key: 'tax', label: 'Imposto', value: `${budget.taxPercent}%` },
        { key: 'margin', label: 'Margem', value: `${budget.marginPercent}%` },
        {
          key: 'stages',
          label: 'Fases',
          value: budget.stages.length || 'Nenhuma fase adicionada',
        },
        {
          key: 'services',
          label: 'Serviços',
          value: budget.stages.reduce((total, stage) => total + stage.items.length, 0),
        },
        {
          key: 'commercialTerms',
          label: 'Condições comerciais',
          value: budget.commercialTerms || '—',
          wide: true,
        },
        { key: 'notes', label: 'Observações', value: budget.notes || '—', wide: true },
      ]
    : [];

  return (
    <DetailsDialog
      open={Boolean(budget)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      eyebrow="Detalhes do orçamento"
      heading={budget ? `${budget.number} · ${budget.title}` : ''}
      closeLabel="Fechar detalhes do orçamento"
    >
      <DetailList items={items} />
    </DetailsDialog>
  );
}
