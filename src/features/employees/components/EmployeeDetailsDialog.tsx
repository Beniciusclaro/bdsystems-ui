import { DetailList, type DetailItem } from '../../../shared/components/ui/DetailList';
import { DetailsDialog } from '../../../shared/components/ui/DetailsDialog';
import type { EmployeeResponse } from '../types/employee';
import { formatDate, getStatusLabel, paymentMethodLabels } from '../presentation';

interface EmployeeDetailsDialogProps {
  employee: EmployeeResponse | null;
  onClose: () => void;
}

export function EmployeeDetailsDialog({ employee, onClose }: EmployeeDetailsDialogProps) {
  const items: DetailItem[] = employee ? [
    { key: 'number', label: 'Matrícula', value: employee.employeeNumber },
    { key: 'status', label: 'Status', value: getStatusLabel(employee.status) },
    { key: 'email', label: 'Email', value: employee.email },
    { key: 'phone', label: 'Telefone', value: employee.phoneNumber || '—' },
    { key: 'document', label: 'Documento', value: employee.documentNumber || '—' },
    { key: 'birth', label: 'Data de nascimento', value: formatDate(employee.birthDate) },
    { key: 'position', label: 'Cargo', value: employee.position },
    { key: 'department', label: 'Departamento', value: employee.department },
    { key: 'admission', label: 'Admissão', value: formatDate(employee.admissionDate) },
    { key: 'payment', label: 'Forma de pagamento', value: employee.paymentMethod ? paymentMethodLabels[employee.paymentMethod] : '—' },
    { key: 'amount', label: 'Valor', value: employee.paymentAmount == null ? '—' : employee.paymentAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
    { key: 'termination', label: 'Desligamento', value: formatDate(employee.terminationDate) },
    { key: 'address', label: 'Endereço', value: `${employee.address.street}, ${employee.address.city} — ${employee.address.state}, ${employee.address.zipCode}`, wide: true },
  ] : [];

  return (
    <DetailsDialog
      open={Boolean(employee)}
      onOpenChange={(open) => { if (!open) onClose(); }}
      eyebrow="Detalhes do funcionário"
      heading={employee?.fullName ?? ''}
    >
      <DetailList items={items} />
    </DetailsDialog>
  );
}
