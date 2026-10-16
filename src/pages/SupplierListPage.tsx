import { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/sidebar/Sidebar';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ContentState } from '../components/ui/ContentState';
import { DataTable } from '../components/ui/DataTable';
import type { DataTableColumn } from '../components/ui/DataTable';
import { DetailsDialog } from '../components/ui/DetailsDialog';
import { IconActionButton, RowActions } from '../components/ui/RowActions';
import { Pagination } from '../components/ui/Pagination';
import { StatusBadge } from '../components/ui/StatusBadge';
import { clearAuthToken, getAuthToken } from '../lib/session';
import { deleteSupplier, getSuppliers } from '../services/supplierService';
import type { SupplierResponse } from '../types/supplier';
import './SupplierListPage.scss';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function getSupplierDisplayName(supplier: SupplierResponse): string {
  return supplier.tradeName || supplier.legalName;
}

function formatAddress(supplier: SupplierResponse): string {
  const { street, city, state, zipCode } = supplier.address;
  return `${street}, ${city} — ${state}, ${zipCode}`;
}

export function SupplierListPage() {
  const navigate = useNavigate();
  const token = getAuthToken();
  const [suppliers, setSuppliers] = useState<SupplierResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [deletingSupplierId, setDeletingSupplierId] = useState<string | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<SupplierResponse | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    let ignore = false;

    getSuppliers(page, pageSize)
      .then((result) => {
        if (!ignore) {
          setSuppliers(result.content);
          setTotalElements(result.page.totalElements);
          setTotalPages(result.page.totalPages);
        }
      })
      .catch((requestError: unknown) => {
        if (!ignore) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Não foi possível carregar os fornecedores.',
          );
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [navigate, page, pageSize, reloadCount, token]);

  const handleLogout = () => {
    clearAuthToken();
    navigate('/login');
  };

  const refreshSuppliers = () => {
    setError(null);
    setIsLoading(true);
    setReloadCount((current) => current + 1);
  };

  const retryLoading = () => {
    setError(null);
    setIsLoading(true);
    setReloadCount((current) => current + 1);
  };

  const goToPage = (nextPage: number) => {
    setError(null);
    setIsLoading(true);
    setPage(nextPage);
  };

  const changePageSize = (nextPageSize: number) => {
    setError(null);
    setIsLoading(true);
    setPageSize(nextPageSize);
    setPage(0);
  };

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
        setPage(page - 1);
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

  if (!token) {
    return null;
  }

  return (
    <main className="dashboard-page supplier-list-page">
      <Sidebar onLogout={handleLogout} />

      <section className="dashboard-content">
        <header className="topbar">
          <div>
            <p className="dashboard-eyebrow">Cadastros</p>
            <h1>Fornecedores</h1>
          </div>
          <span className="supplier-total">
            {totalElements} {totalElements === 1 ? 'fornecedor' : 'fornecedores'}
          </span>
        </header>

        <section className="panel-card supplier-list-card" aria-labelledby="supplier-list-heading">
          <div className="supplier-list-heading">
            <div>
              <h2 id="supplier-list-heading">Lista de fornecedores</h2>
            </div>
            <span className="supplier-page-count" aria-live="polite">
              {suppliers.length} {suppliers.length === 1 ? 'fornecedor' : 'fornecedores'} nesta página
            </span>
          </div>

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
              title="Nenhum fornecedor cadastrado"
              description="Cadastre um fornecedor para começar a organizar seus parceiros."
              action={<Link to="/suppliers/new" className="primary-button">Cadastrar fornecedor</Link>}
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
        </section>
      </section>

      <Link to="/suppliers/new" className="supplier-create-fab">
        <span aria-hidden="true">+</span>
        Cadastrar fornecedor
      </Link>

      <Outlet context={{ refreshSuppliers, suppliers, isLoading }} />

      <DetailsDialog
        open={Boolean(selectedSupplier)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSupplier(null);
          }
        }}
        eyebrow="Detalhes do fornecedor"
        heading={selectedSupplier ? getSupplierDisplayName(selectedSupplier) : ''}
      >
        {selectedSupplier ? (
          <dl className="supplier-details-grid">
            <div>
              <dt>Razão social</dt>
              <dd>{selectedSupplier.legalName}</dd>
            </div>
            <div>
              <dt>Nome fantasia</dt>
              <dd>{selectedSupplier.tradeName || '—'}</dd>
            </div>
            <div>
              <dt>Documento fiscal</dt>
              <dd>{selectedSupplier.taxNumber || '—'}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{selectedSupplier.active ? 'Ativo' : 'Inativo'}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{selectedSupplier.email || '—'}</dd>
            </div>
            <div>
              <dt>Telefone</dt>
              <dd>{selectedSupplier.phoneNumber || '—'}</dd>
            </div>
            <div className="supplier-address-detail">
              <dt>Endereço</dt>
              <dd>{formatAddress(selectedSupplier)}</dd>
            </div>
          </dl>
        ) : null}
      </DetailsDialog>

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
    </main>
  );
}
