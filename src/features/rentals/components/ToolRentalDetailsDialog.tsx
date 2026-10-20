import { useState } from 'react';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { ContentState } from '../../../shared/components/ui/ContentState';
import { DataTable } from '../../../shared/components/ui/DataTable';
import type { DataTableColumn } from '../../../shared/components/ui/DataTable';
import { DetailsDialog } from '../../../shared/components/ui/DetailsDialog';
import { IconActionButton, RowActions } from '../../../shared/components/ui/RowActions';
import { ToolRentalForm } from '../components/ToolRentalForm';
import {
  createToolRental,
  deleteToolRental,
  updateToolRental,
} from '../services/toolRentalService';
import type { SupplierResponse } from '../../suppliers/types/supplier';
import type { ToolResponse } from '../../tools/types/tool';
import type { ToolRentalRequest, ToolRentalResponse } from '../types/toolRental';

interface ToolRentalDetailsDialogProps {
  embedded?: boolean;
  readOnly?: boolean;
  tool: ToolResponse | null;
  open: boolean;
  rentals: ToolRentalResponse[];
  isLoadingRentals: boolean;
  rentalError: string | null;
  onRetryRentals: () => void;
  suppliers: SupplierResponse[] | null;
  isLoadingSuppliers: boolean;
  supplierError: string | null;
  onLoadSuppliers: () => void;
  onRentalDataChanged: () => void;
  onOpenChange: (open: boolean) => void;
}

const rentalPeriodLabels = {
  HOUR: 'Hora',
  DAY: 'Dia',
  WEEK: 'Semana',
  MONTH: 'Mês',
} as const;

function formatDate(value: string | null): string {
  if (!value) {
    return 'Não definido';
  }

  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getSupplierDisplayName(supplier: SupplierResponse): string {
  return supplier.tradeName || supplier.legalName;
}

export function ToolRentalDetailsDialog({
  embedded = false,
  readOnly = false,
  tool,
  open,
  rentals,
  isLoadingRentals,
  rentalError,
  onRetryRentals,
  suppliers,
  isLoadingSuppliers,
  supplierError,
  onLoadSuppliers,
  onRentalDataChanged,
  onOpenChange,
}: ToolRentalDetailsDialogProps) {
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [selectedRental, setSelectedRental] = useState<ToolRentalResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutationSuccess, setMutationSuccess] = useState<string | null>(null);
  const [rentalToDelete, setRentalToDelete] = useState<ToolRentalResponse | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openForm = (mode: 'create' | 'edit', rental?: ToolRentalResponse) => {
    setSelectedRental(rental ?? null);
    setFormMode(mode);
    setMutationError(null);
    setMutationSuccess(null);
    if (suppliers === null) {
      onLoadSuppliers();
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && (isSubmitting || isDeleting)) {
      return;
    }
    if (!nextOpen) {
      setFormMode(null);
      setSelectedRental(null);
    }
    onOpenChange(nextOpen);
  };

  const submitRental = async (payload: ToolRentalRequest) => {
    if (!tool) {
      return;
    }

    setMutationError(null);
    setMutationSuccess(null);
    setIsSubmitting(true);
    try {
      if (formMode === 'edit' && selectedRental) {
        await updateToolRental(selectedRental.id, payload);
        setMutationSuccess('Registo de aluguer atualizado com sucesso.');
      } else {
        await createToolRental(payload);
        setMutationSuccess('Registo de aluguer cadastrado com sucesso.');
      }
      setFormMode(null);
      setSelectedRental(null);
      onRentalDataChanged();
    } catch (requestError: unknown) {
      setMutationError(
        requestError instanceof Error
          ? requestError.message
          : 'Não foi possível guardar o registo de aluguer.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteRental = async () => {
    if (!rentalToDelete) {
      return;
    }

    setDeleteError(null);
    setIsDeleting(true);
    try {
      await deleteToolRental(rentalToDelete.id);
      setRentalToDelete(null);
      setMutationSuccess('Registo de aluguer eliminado com sucesso.');
      onRentalDataChanged();
    } catch (requestError: unknown) {
      setDeleteError(
        requestError instanceof Error
          ? requestError.message
          : 'Não foi possível eliminar o registo de aluguer.',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const rentalInformationColumns: DataTableColumn<ToolRentalResponse>[] = [
    {
      key: 'supplier',
      header: 'Fornecedor',
      mobileLabel: 'Fornecedor',
      renderCell: (rental) => {
        const supplier = suppliers?.find((item) => item.id === rental.supplierId);
        return supplier
          ? getSupplierDisplayName(supplier)
          : supplierError
            ? 'Fornecedor indisponível'
            : 'Não definido';
      },
    },
    {
      key: 'price',
      header: 'Preço',
      mobileLabel: 'Preço',
      renderCell: (rental: ToolRentalResponse) =>
        `${formatPrice(rental.price)} / ${rentalPeriodLabels[rental.rentalPeriod].toLowerCase()}`,
    },
    {
      key: 'dates',
      header: 'Período',
      mobileLabel: 'Período',
      renderCell: (rental) => (
        <span>
          {formatDate(rental.rentalStartDate)} – {formatDate(rental.rentalEndDate)}
        </span>
      ),
    },
  ];

  const rentalColumns: DataTableColumn<ToolRentalResponse>[] = [
    ...rentalInformationColumns,
    {
      key: 'actions',
      header: 'Ações',
      mobileLabel: 'Ações',
      headerClassName: 'tool-actions-heading',
      cellClassName: 'tool-actions-cell',
      renderCell: (rental: ToolRentalResponse) => (
        <RowActions>
          <IconActionButton
            label="Editar registo de aluguer"
            variant="accent"
            onClick={() => openForm('edit', rental)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path d="M12 20h9" />
              <path d="m16.5 3.5 4 4L9 19l-5 1 1-5L16.5 3.5Z" />
            </svg>
          </IconActionButton>
          <IconActionButton
            label="Eliminar registo de aluguer"
            variant="danger"
            onClick={() => {
              setDeleteError(null);
              setRentalToDelete(rental);
            }}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18" />
              <path d="M8 6V4h8v2" />
              <path d="m19 6-1 14H6L5 6" />
              <path d="M10 11v5M14 11v5" />
            </svg>
          </IconActionButton>
        </RowActions>
      ),
    },
  ];

  const readOnlyContent = tool ? (
    isLoadingRentals ? (
      <ContentState variant="loading" title="Carregando registos de aluguer..." />
    ) : rentalError ? (
      <ContentState variant="error" title={rentalError} />
    ) : rentals.length === 0 ? (
      <ContentState
        variant="empty"
        title="Nenhum registo de aluguer"
        description="Esta ferramenta ainda não tem alugueres associados."
      />
    ) : (
      <DataTable
        rows={rentals}
        columns={rentalInformationColumns}
        getRowKey={(rental) => rental.id}
        ariaLabel={`Registos de aluguer de ${tool.name}`}
        className="tool-rental-table"
      />
    )
  ) : null;

  const managementContent = (
    <>
      {mutationSuccess ? (
        <p className="message success tool-rental-feedback" role="status">
          {mutationSuccess}
        </p>
      ) : null}

      {tool && formMode ? (
        <>
          {mutationError ? (
            <p className="message error tool-rental-feedback" role="alert">
              {mutationError}
            </p>
          ) : null}
          {isLoadingSuppliers ? (
            <ContentState variant="loading" title="Carregando fornecedores..." />
          ) : supplierError ? (
            <ContentState
              variant="error"
              title={supplierError}
              action={
                <button type="button" className="text-button" onClick={onLoadSuppliers}>
                  Tentar novamente
                </button>
              }
            />
          ) : suppliers ? (
            <ToolRentalForm
              key={`${formMode}-${selectedRental?.id ?? tool.id}`}
              tool={tool}
              suppliers={suppliers}
              initialValues={selectedRental ?? undefined}
              isSubmitting={isSubmitting}
              submitLabel={formMode === 'edit' ? 'Atualizar registo' : 'Cadastrar registo'}
              submittingLabel={formMode === 'edit' ? 'Atualizando...' : 'Cadastrando...'}
              onSubmit={submitRental}
              onCancel={() => {
                setFormMode(null);
                setSelectedRental(null);
                setMutationError(null);
              }}
            />
          ) : null}
        </>
      ) : tool && isLoadingRentals ? (
        <ContentState variant="loading" title="Carregando registos de aluguer..." />
      ) : tool && rentalError ? (
        <ContentState
          variant="error"
          title={rentalError}
          action={
            !readOnly ? (
              <button type="button" className="text-button" onClick={onRetryRentals}>
                Tentar novamente
              </button>
            ) : undefined
          }
        />
      ) : tool && rentals.length === 0 ? (
        <div className="tool-rental-empty">
          <ContentState
            variant="empty"
            title="Nenhum registo de aluguer"
            description="Esta ferramenta ainda não tem alugueres associados."
          />
          {!readOnly && tool.active ? (
            <button type="button" className="primary-button" onClick={() => openForm('create')}>
              Criar registo de aluguer
            </button>
          ) : !readOnly && !tool.active ? (
            <p className="tool-field-hint">
              Ative a ferramenta antes de criar um registo de aluguer.
            </p>
          ) : null}
        </div>
      ) : tool ? (
        <div className="tool-rental-details">
          {isLoadingSuppliers && !readOnly ? (
            <ContentState variant="loading" title="Carregando fornecedores..." />
          ) : supplierError && !readOnly ? (
            <ContentState
              variant="error"
              title={supplierError}
              action={
                <button type="button" className="text-button" onClick={onLoadSuppliers}>
                  Tentar novamente
                </button>
              }
            />
          ) : (
            <>
              <DataTable
                rows={rentals}
                columns={rentalColumns}
                getRowKey={(rental) => rental.id}
                ariaLabel={`Registos de aluguer de ${tool.name}`}
                className="tool-rental-table"
              />
              {!readOnly && tool.active ? (
                <button
                  type="button"
                  className="primary-button tool-add-rental"
                  onClick={() => openForm('create')}
                >
                  Criar registo de aluguer
                </button>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </>
  );
  const content = readOnly ? readOnlyContent : managementContent;

  return (
    <>
      {embedded ? (
        <section className="tool-rental-embedded" aria-labelledby="tool-rental-embedded-heading">
          <header className="tool-rental-embedded__header">
            <div>
              <p className="eyebrow">Alugueres</p>
              <h2 id="tool-rental-embedded-heading">
                {formMode === 'create'
                  ? 'Novo registo de aluguer'
                  : formMode === 'edit'
                    ? 'Editar registo de aluguer'
                    : 'Registos associados'}
              </h2>
            </div>
          </header>
          {content}
        </section>
      ) : (
        <DetailsDialog
          open={open}
          onOpenChange={handleOpenChange}
          eyebrow={formMode ? 'Gestão de alugueres' : 'Alugueres da ferramenta'}
          heading={
            formMode === 'create'
              ? 'Novo registo de aluguer'
              : formMode === 'edit'
                ? 'Editar registo de aluguer'
                : (tool?.name ?? '')
          }
        >
          {content}
        </DetailsDialog>
      )}

      {rentalToDelete ? (
        <ConfirmDialog
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen && !isDeleting) {
              setRentalToDelete(null);
              setDeleteError(null);
            }
          }}
          eyebrow="Confirmar eliminação"
          title="Eliminar registo de aluguer?"
          description="Esta ação elimina apenas este registo de aluguer e não pode ser desfeita."
          error={deleteError}
          isConfirming={isDeleting}
          confirmLabel="Eliminar registo"
          confirmingLabel="Eliminando..."
          onConfirm={confirmDeleteRental}
        />
      ) : null}
    </>
  );
}
