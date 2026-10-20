import { ToolRentalDetailsDialog } from '../../rentals/components/ToolRentalDetailsDialog';
import type { useToolRentalData } from '../../rentals/hooks/useToolRentalData';
import { DetailList } from '../../../shared/components/ui/DetailList';
import { DetailsDialog } from '../../../shared/components/ui/DetailsDialog';

type ToolRentalData = ReturnType<typeof useToolRentalData>;

export function ToolDetailsDialog({ rental }: { rental: ToolRentalData }) {
  const {
    selectedTool,
    selectedToolRentals,
    selectedToolRentalError,
    isLoadingSelectedToolRentals,
    refreshSelectedToolRentals,
    suppliers,
    isLoadingSuppliers,
    supplierError,
    loadSuppliers,
    closeTool,
  } = rental;

  return (
    <DetailsDialog
      open={Boolean(selectedTool)}
      onOpenChange={(open) => {
        if (!open) closeTool();
      }}
      eyebrow="Detalhes da ferramenta"
      heading={selectedTool?.name ?? ''}
    >
      {selectedTool ? (
        <>
          <DetailList
            items={[
              { key: 'code', label: 'Código', value: selectedTool.code },
              { key: 'status', label: 'Estado', value: selectedTool.active ? 'Ativa' : 'Inativa' },
            ]}
          />
          <ToolRentalDetailsDialog
            embedded
            readOnly
            tool={selectedTool}
            open
            rentals={selectedToolRentals ?? []}
            isLoadingRentals={isLoadingSelectedToolRentals}
            rentalError={selectedToolRentalError}
            onRetryRentals={refreshSelectedToolRentals}
            suppliers={suppliers}
            isLoadingSuppliers={isLoadingSuppliers}
            supplierError={supplierError}
            onLoadSuppliers={() => void loadSuppliers()}
            onRentalDataChanged={refreshSelectedToolRentals}
            onOpenChange={() => {}}
          />
        </>
      ) : null}
    </DetailsDialog>
  );
}
