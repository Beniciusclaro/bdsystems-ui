import { Panel } from '../../../shared/components/ui/Panel';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { ContentState } from '../../../shared/components/ui/ContentState';
import { DataTable } from '../../../shared/components/ui/DataTable';
import type { DataTableColumn } from '../../../shared/components/ui/DataTable';
import { IconActionButton, RowActions } from '../../../shared/components/ui/RowActions';
import { Pagination } from '../../../shared/components/ui/Pagination';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import {
  deleteSupplier,
  getSuppliers,
  type SupplierListFilters,
} from '../services/supplierService';
import type { SupplierResponse } from '../types/supplier';
import { SupplierDetailsDialog } from '../components/SupplierDetailsDialog';
import { getSupplierDisplayName } from '../presentation';
import { usePaginatedResource } from '../../../shared/hooks/usePaginatedResource';
import './SupplierListPage.scss';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const getSuppliersPage = (page: number, size: number, filters: SupplierListFilters) =>
  getSuppliers(page, size, filters);

export function SupplierListPage() {
  const navigate = useNavigate();

  const {
    rows: suppliers,
    totalElements,
    totalPages,
    page,
    pageSize,
    filters: appliedFilters,
    applyFilters,
    isLoading,
    error,
    goToPage,
    changePageSize,
    refresh,
  } = usePaginatedResource<SupplierResponse, SupplierListFilters>(
    getSuppliersPage,
    {},
    'Não foi possível carregar os fornecedores.',
  );

  const [draftFilters, setDraftFilters] = useState<SupplierListFilters>({});

  const hasFilters = Boolean(appliedFilters.name || appliedFilters.taxNumber);

  const clearSearch = () => {
    setDraftFilters({});
    applyFilters({});
  };

  const [selectedSupplier, setSelectedSupplier] = useState<SupplierResponse | null>(null);

  const [deletingSupplierId, setDeletingSupplierId] = useState<string | null>(null);

  const [supplierToDelete, setSupplierToDelete] = useState<SupplierResponse | null>(null);

  const [deleteError, setDeleteError] = useState<string | null>(null);

  const refreshSuppliers = refresh;

  const retryLoading = refresh;

  const supplierColumns: DataTableColumn<SupplierResponse>[] = [
    {
      key: 'supplier',
      header: 'Fornecedor',
      mobileLabel: 'Fornecedor',
      renderCell: (supplier) => (
        <>
          <button
            type="button"
            className="supplier-name supplier-detail-trigger"
            aria-label={`Ver detalhes de ${getSupplierDisplayName(supplier)}`}
            onClick={() => setSelectedSupplier(supplier)}
          >
            {getSupplierDisplayName(supplier)}
          </button>
          {supplier.tradeName ? <span className="supplier-meta">{supplier.legalName}</span> : null}
        </>
      ),
    },
    {
      key: 'taxNumber',
      header: 'Documento fiscal',
      mobileLabel: 'Documento fiscal',
      renderCell: (supplier) => supplier.taxNumber || '—',
    },
    {
      key: 'contact',
      header: 'Contato',
      mobileLabel: 'Contato',
      renderCell: (supplier) => (
        <>
          <span>{supplier.email || '—'}</span>
          {supplier.phoneNumber ? (
            <span className="supplier-meta">{supplier.phoneNumber}</span>
          ) : null}
        </>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      mobileLabel: 'Status',
      renderCell: (supplier) => (
        <StatusBadge tone={supplier.active ? 'success' : 'neutral'}>
          {supplier.active ? 'Ativo' : 'Inativo'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      mobileLabel: 'Ações',
      headerClassName: 'supplier-actions-heading',
      cellClassName: 'supplier-actions-cell',
      renderCell: (supplier) => (
        <RowActions>
          <IconActionButton
            label={`Editar ${getSupplierDisplayName(supplier)}`}
            variant="accent"
            onClick={() => navigate(`/suppliers/${supplier.id}/edit`)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path d="M12 20h9" />
              <path d="m16.5 3.5 4 4L9 19l-5 1 1-5L16.5 3.5Z" />
            </svg>
          </IconActionButton>
          <IconActionButton
            label={`Excluir ${getSupplierDisplayName(supplier)}`}
            variant="danger"
            onClick={() => {
              setDeleteError(null);
              setSupplierToDelete(supplier);
            }}
            disabled={deletingSupplierId === supplier.id}
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

  const handleConfirmDeleteSupplier = async () => {
    if (!supplierToDelete) {
      return;
    }

    const supplier = supplierToDelete;
    setDeleteError(null);
    setDeletingSupplierId(supplier.id);

    try {
      await deleteSupplier(supplier.id);
      setSupplierToDelete(null);
      setSelectedSupplier(null);

      if (suppliers.length === 1 && page > 0) {
        goToPage(page - 1);
      }

      refreshSuppliers();
    } catch (requestError: unknown) {
      setDeleteError(
        requestError instanceof Error
          ? requestError.message
          : 'Não foi possível excluir o fornecedor.',
      );
    } finally {
      setDeletingSupplierId(null);
    }
  };

  return (
    <section className="dashboard-content supplier-list-page">
      <PageHeader
        eyebrow="Cadastros"
        title="Fornecedores"
        action={
          <span className="supplier-total">
            {totalElements} {totalElements === 1 ? 'fornecedor' : 'fornecedores'}
          </span>
        }
      />

      <Panel className="supplier-list-card" labelledBy="supplier-list-heading">
        <div className="supplier-list-heading">
          <div>
            <h2 id="supplier-list-heading">Lista de fornecedores</h2>
          </div>
          <span className="supplier-page-count" aria-live="polite">
            {suppliers.length} {suppliers.length === 1 ? 'fornecedor' : 'fornecedores'} nesta página
          </span>
        </div>

        <form
          className="supplier-filters"
          aria-label="Busca de fornecedores"
          onSubmit={(event) => {
            event.preventDefault();
            applyFilters({
              name: draftFilters.name?.trim() || undefined,
              taxNumber: draftFilters.taxNumber?.trim() || undefined,
            });
          }}
        >
          <label className="field">
            <span>Nome</span>
            <input
              type="search"
              value={draftFilters.name ?? ''}
              onChange={(event) => setDraftFilters({ ...draftFilters, name: event.target.value })}
              placeholder="Razão social ou nome fantasia"
            />
          </label>
          <label className="field">
            <span>Documento fiscal</span>
            <input
              type="search"
              value={draftFilters.taxNumber ?? ''}
              onChange={(event) =>
                setDraftFilters({ ...draftFilters, taxNumber: event.target.value })
              }
              placeholder="NIF, CNPJ ou CPF"
            />
          </label>
          <button type="submit" className="primary-button" disabled={isLoading}>
            Buscar
          </button>
          <button type="button" className="text-button" onClick={clearSearch}>
            Limpar
          </button>
        </form>

        {isLoading ? (
          <ContentState
            variant="loading"
            title="Carregando fornecedores..."
            className="supplier-list-state"
          />
        ) : error ? (
          <ContentState
            variant="error"
            title={error}
            action={
              <button type="button" className="text-button" onClick={retryLoading}>
                Tentar novamente
              </button>
            }
          />
        ) : suppliers.length === 0 && totalElements === 0 ? (
          <ContentState
            variant="empty"
            title={hasFilters ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor cadastrado'}
            description={
              hasFilters
                ? 'Altere os filtros ou limpe a busca para encontrar outros fornecedores.'
                : 'Cadastre um fornecedor para começar a organizar seus parceiros.'
            }
            action={
              hasFilters ? (
                <button type="button" className="text-button" onClick={clearSearch}>
                  Limpar busca
                </button>
              ) : (
                <Link to="/suppliers/new" className="primary-button">
                  Cadastrar fornecedor
                </Link>
              )
            }
            className="supplier-list-state"
          />
        ) : (
          <DataTable
            rows={suppliers}
            columns={supplierColumns}
            getRowKey={(supplier) => supplier.id}
            getRowLabel={(supplier) => `Abrir detalhes de ${getSupplierDisplayName(supplier)}`}
            onRowActivate={setSelectedSupplier}
            ariaLabel="Lista de fornecedores"
            className="supplier-table"
            wrapperClassName="supplier-table-wrap"
          />
        )}

        {!isLoading && !error && suppliers.length > 0 ? (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageChange={goToPage}
            onPageSizeChange={changePageSize}
            ariaLabel="Paginação da lista de fornecedores"
            className="supplier-list-controls"
          />
        ) : null}
      </Panel>
      <Link to="/suppliers/new" className="supplier-create-fab">
        <span aria-hidden="true">+</span>
        Cadastrar fornecedor
      </Link>

      <Outlet context={{ refreshSuppliers, suppliers }} />

      <SupplierDetailsDialog
        supplier={selectedSupplier}
        onClose={() => setSelectedSupplier(null)}
      />

      {supplierToDelete ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open && !deletingSupplierId) {
              setSupplierToDelete(null);
              setDeleteError(null);
            }
          }}
          eyebrow="Confirmar exclusão"
          title="Excluir fornecedor?"
          description={
            <>
              Você está prestes a excluir{' '}
              <strong>{getSupplierDisplayName(supplierToDelete)}</strong>. Essa ação não pode ser
              desfeita.
            </>
          }
          error={deleteError}
          isConfirming={Boolean(deletingSupplierId)}
          confirmLabel="Excluir fornecedor"
          confirmingLabel="Excluindo..."
          onConfirm={handleConfirmDeleteSupplier}
        >
          <div className="supplier-delete-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 8v5" />
              <path d="M12 17h.01" />
              <path d="M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3l-7.6-13.1a2 2 0 0 0-3.4 0Z" />
            </svg>
          </div>
        </ConfirmDialog>
      ) : null}
    </section>
  );
}
