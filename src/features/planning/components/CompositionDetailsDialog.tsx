import { DetailList, type DetailItem } from '../../../shared/components/ui/DetailList';
import { DetailsDialog } from '../../../shared/components/ui/DetailsDialog';
import { DataTable, type DataTableColumn } from '../../../shared/components/ui/DataTable';
import type { Composition, CompositionComponent } from '../types/planning';
import './CompositionDetailsDialog.scss';

interface CompositionDetailsDialogProps {
  composition: Composition | null;
  onClose: () => void;
}

const componentTypeLabels: Record<CompositionComponent['type'], string> = {
  MATERIAL: 'Material',
  LABOR: 'Mão de obra',
  EQUIPMENT: 'Equipamento',
  CUSTOM: 'Custo adicional',
};

const columns: DataTableColumn<CompositionComponent>[] = [
  {
    key: 'type',
    header: 'Tipo',
    mobileLabel: 'Tipo',
    renderCell: (component) => componentTypeLabels[component.type],
  },
  {
    key: 'description',
    header: 'Componente',
    mobileLabel: 'Componente',
    renderCell: (component) => <strong>{component.description}</strong>,
  },
  {
    key: 'quantity',
    header: 'Quantidade',
    mobileLabel: 'Quantidade',
    renderCell: (component) => `${formatNumber(component.quantity)} ${component.unitLabel}`,
  },
  {
    key: 'unitCost',
    header: 'Custo unitário',
    mobileLabel: 'Custo unitário',
    renderCell: (component) => money(component.unitCost),
  },
  {
    key: 'totalCost',
    header: 'Custo total',
    mobileLabel: 'Custo total',
    renderCell: (component) => money(component.totalCost),
  },
];

export function CompositionDetailsDialog({ composition, onClose }: CompositionDetailsDialogProps) {
  const items: DetailItem[] = composition
    ? [
        { key: 'code', label: 'Código', value: composition.code },
        { key: 'unit', label: 'Unidade', value: composition.unitSymbol },
        {
          key: 'yield',
          label: 'Rendimento-base',
          value: formatNumber(composition.baseYield),
        },
        { key: 'unitCost', label: 'Custo unitário', value: money(composition.unitCost) },
        { key: 'totalCost', label: 'Custo total', value: money(composition.totalCost) },
        {
          key: 'description',
          label: 'Descrição',
          value: composition.description || '—',
          wide: true,
        },
      ]
    : [];

  return (
    <DetailsDialog
      open={Boolean(composition)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      eyebrow="Detalhes da composição"
      heading={composition?.name ?? ''}
    >
      <div className="composition-details-content">
        <DetailList items={items} />

        {composition ? (
          <section aria-labelledby="composition-components-title">
            <h3 id="composition-components-title">Componentes</h3>
            <DataTable
              rows={composition.components}
              columns={columns}
              getRowKey={(component) => component.id ?? `${component.type}-${component.sortOrder}`}
              ariaLabel={`Componentes de ${composition.name}`}
            />
          </section>
        ) : null}
      </div>
    </DetailsDialog>
  );
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 4 }).format(value);

const money = (value: number) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
