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
import { deleteSupplier, getSupplier, getSuppliers, SupplierNotFoundError } from '../services/supplierService';
import type { SupplierPage, SupplierResponse } from '../types/supplier';
import { SupplierDetailsDialog } from '../components/SupplierDetailsDialog';
import { getSupplierDisplayName } from '../presentation';
import { usePaginatedResource } from '../../../shared/hooks/usePaginatedResource';
import './SupplierListPage.scss';

const PAGE_SIZE_OPTIONS = [10, 20, 50];
type SupplierFilters = { id?: string };
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getSuppliersPage(page: number, size: number, filters: SupplierFilters): Promise<SupplierPage> {
  if (!filters.id) return getSuppliers(page, size);

  let content: SupplierResponse[];
  try {
    content = [await getSupplier(filters.id)];
  } catch (error: unknown) {
    if (!(error instanceof SupplierNotFoundError)) throw error;
    content = [];
  }
  return {
    content,
    page: { number: 0, size, totalElements: content.length, totalPages: content.length },
  };
}

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
  } = usePaginatedResource<SupplierResponse, SupplierFilters>(
    getSuppliersPage,
    {},
    'Não foi possível carregar os fornecedores.',
  );
  const [searchId, setSearchId] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const clearSearch = () => {
    setSearchId('');
    setSearchError(null);
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
          {supplier.tradeName ? (
            <span className="supplier-meta">{supplier.legalName}</span>
          ) : null}
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
        <PageHeader eyebrow="Cadastros" title="Fornecedores" action={<span className="supplier-total">{totalElements} {totalElements === 1 ? 'fornecedor' : 'fornecedores'}</span>} />

        <Panel className="supplier-list-card" labelledBy="supplier-list-heading">
          <div className="supplier-list-heading">
            <div>
              <h2 id="supplier-list-heading">Lista de fornecedores</h2>
            </div>
            <span className="supplier-page-count" aria-live="polite">
              {suppliers.length} {suppliers.length === 1 ? 'fornecedor' : 'fornecedores'} nesta página
            </span>
          </div>

          <form className="supplier-filters" aria-label="Busca de fornecedores" onSubmit={(event) => {
            event.preventDefault();
            const id = searchId.trim();
            if (id && !UUID_PATTERN.test(id)) {
              setSearchError('Informe um ID de fornecedor válido (UUID).');
              return;
            }
            setSearchError(null);
            applyFilters(id ? { id } : {});
          }}>
            <label className="field">
              <span>ID do fornecedor</span>
              <input
                type="search"
                value={searchId}
                onChange={(event) => { setSearchId(event.target.value); setSearchError(null); }}
                placeholder="Informe o UUID do fornecedor"
                aria-invalid={Boolean(searchError)}
                aria-describedby={searchError ? 'supplier-search-error' : undefined}
              />
            </label>
            <button type="submit" className="primary-button" disabled={isLoading}>Buscar</button>
            <button type="button" className="text-button" onClick={clearSearch}>Limpar</button>
            {searchError ? <p id="supplier-search-error" role="alert">{searchError}</p> : null}
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
              action={(
                <button type="button" className="text-button" onClick={retryLoading}>
                  Tentar novamente
                </button>
              )}
            />
          ) : suppliers.length === 0 && totalElements === 0 ? (
            <ContentState
              variant="empty"
              title={appliedFilters.id ? "Fornecedor não encontrado" : "Nenhum fornecedor cadastrado"}
              description={appliedFilters.id ? "Nenhum fornecedor foi encontrado com o ID informado." : "Cadastre um fornecedor para começar a organizar seus parceiros."}
              action={appliedFilters.id ? <button type="button" className="text-button" onClick={clearSearch}>Limpar busca</button> : <Link to="/suppliers/new" className="primary-button">Cadastrar fornecedor</Link>}
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

          {!appliedFilters.id && !isLoading && !error && suppliers.length > 0 ? (
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

      <SupplierDetailsDialog supplier={selectedSupplier} onClose={() => setSelectedSupplier(null)} />

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
          description={(
            <>
              Você está prestes a excluir <strong>{getSupplierDisplayName(supplierToDelete)}</strong>.
              Essa ação não pode ser desfeita.
            </>
          )}
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
