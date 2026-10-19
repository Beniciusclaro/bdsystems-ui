import { DetailList, type DetailItem } from '../../../shared/components/ui/DetailList';
import { DetailsDialog } from '../../../shared/components/ui/DetailsDialog';
import type { SupplierResponse } from '../types/supplier';
import { formatAddress, getSupplierDisplayName } from '../presentation';

interface SupplierDetailsDialogProps {
  supplier: SupplierResponse | null;
  onClose: () => void;
}

export function SupplierDetailsDialog({ supplier, onClose }: SupplierDetailsDialogProps) {
  const items: DetailItem[] = supplier ? [
    { key: 'legal', label: 'Razão social', value: supplier.legalName },
    { key: 'trade', label: 'Nome fantasia', value: supplier.tradeName || '—' },
    { key: 'tax', label: 'Documento fiscal', value: supplier.taxNumber || '—' },
    { key: 'status', label: 'Status', value: supplier.active ? 'Ativo' : 'Inativo' },
    { key: 'email', label: 'Email', value: supplier.email || '—' },
    { key: 'phone', label: 'Telefone', value: supplier.phoneNumber || '—' },
    { key: 'address', label: 'Endereço', value: formatAddress(supplier), wide: true },
  ] : [];

  return (
    <DetailsDialog
      open={Boolean(supplier)}
      onOpenChange={(open) => { if (!open) onClose(); }}
      eyebrow="Detalhes do fornecedor"
      heading={supplier ? getSupplierDisplayName(supplier) : ''}
    >
      <DetailList items={items} />
    </DetailsDialog>
  );
}
