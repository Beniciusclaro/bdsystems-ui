import { DetailList, type DetailItem } from '../../../shared/components/ui/DetailList';
import { DetailsDialog } from '../../../shared/components/ui/DetailsDialog';
import type { Client } from '../../planning/types/planning';

interface ClientDetailsDialogProps {
  client: Client | null;
  onClose: () => void;
}

function formatAddress(client: Client): string {
  return (
    [client.street, client.city, client.state, client.zipCode].filter(Boolean).join(', ') || '—'
  );
}

export function ClientDetailsDialog({ client, onClose }: ClientDetailsDialogProps) {
  const items: DetailItem[] = client
    ? [
        {
          key: 'type',
          label: 'Tipo',
          value: client.type === 'COMPANY' ? 'Empresa' : 'Pessoa física',
        },
        { key: 'document', label: 'Documento fiscal', value: client.document || '—' },
        { key: 'email', label: 'Email', value: client.email || '—' },
        { key: 'phone', label: 'Telefone', value: client.phone || '—' },
        { key: 'status', label: 'Status', value: client.active ? 'Ativo' : 'Inativo' },
        { key: 'address', label: 'Morada', value: formatAddress(client), wide: true },
      ]
    : [];

  return (
    <DetailsDialog
      open={Boolean(client)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      eyebrow="Detalhes do cliente"
      heading={client?.name ?? ''}
    >
      <DetailList items={items} />
    </DetailsDialog>
  );
}
