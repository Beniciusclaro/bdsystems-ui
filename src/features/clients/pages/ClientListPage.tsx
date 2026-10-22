import { useEffect, useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { ContentState } from '../../../shared/components/ui/ContentState';
import { DataTable, type DataTableColumn } from '../../../shared/components/ui/DataTable';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { Pagination } from '../../../shared/components/ui/Pagination';
import { Panel } from '../../../shared/components/ui/Panel';
import { IconActionButton, RowActions } from '../../../shared/components/ui/RowActions';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import type { Client, ClientType } from '../../planning/types/planning';
import { ClientDetailsDialog } from '../components/ClientDetailsDialog';
import { deleteClient, listClients, type ClientFilters } from '../services/clientService';
import './ClientListPage.scss';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function ClientListPage() {
  const navigate = useNavigate();

  const [clients, setClients] = useState<Client[]>([]);

  const [filters, setFilters] = useState<ClientFilters>({ type: '', active: '' });

  const [appliedFilters, setAppliedFilters] = useState<ClientFilters>({ type: '', active: '' });

  const [page, setPage] = useState(0);

  const [pageSize, setPageSize] = useState(10);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState('');

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let current = true;

    listClients(appliedFilters)
      .then((result) => {
        if (current) setClients(result);
      })
      .catch((cause: unknown) => {
        if (current) {
          setError(
            cause instanceof Error ? cause.message : 'Não foi possível carregar os clientes.',
          );
        }
      })
      .finally(() => {
        if (current) setIsLoading(false);
      });

    return () => {
      current = false;
    };
  }, [appliedFilters, revision]);

  const totalPages = Math.max(1, Math.ceil(clients.length / pageSize));

  const visibleClients = useMemo(
    () => clients.slice(page * pageSize, page * pageSize + pageSize),
    [clients, page, pageSize],
  );

  const hasFilters = Boolean(
    appliedFilters.query || appliedFilters.type || appliedFilters.active !== '',
  );

  const clearFilters = () => {
    const emptyFilters: ClientFilters = { type: '', active: '' };

    setFilters(emptyFilters);
    setIsLoading(true);
    setError('');
    setAppliedFilters(emptyFilters);
    setPage(0);
  };

  const handleConfirmDeleteClient = async () => {
    if (!clientToDelete) {
      return;
    }

    const client = clientToDelete;

    setDeleteError(null);
    setDeletingClientId(client.id);

    try {
      await deleteClient(client.id);
      setClientToDelete(null);
      setSelectedClient(null);

      if (visibleClients.length === 1 && page > 0) {
        setPage(page - 1);
      }

      setIsLoading(true);
      setError('');
      setRevision((value) => value + 1);
    } catch (requestError: unknown) {
      setDeleteError(
        requestError instanceof Error
          ? requestError.message
          : 'Não foi possível excluir o cliente.',
      );
    } finally {
      setDeletingClientId(null);
    }
  };

  const columns: DataTableColumn<Client>[] = [
    {
      key: 'name',
      header: 'Cliente',
      mobileLabel: 'Cliente',
      renderCell: (client) => <strong>{client.name}</strong>,
    },
    {
      key: 'type',
      header: 'Tipo',
      mobileLabel: 'Tipo',
      renderCell: (client) => (client.type === 'COMPANY' ? 'Empresa' : 'Pessoa física'),
    },
    {
      key: 'document',
      header: 'Documento fiscal',
      mobileLabel: 'Documento fiscal',
      renderCell: (client) => client.document || '—',
    },
    {
      key: 'contact',
      header: 'Contato',
      mobileLabel: 'Contato',
      renderCell: (client) => client.email || client.phone || '—',
    },
    {
      key: 'active',
      header: 'Status',
      mobileLabel: 'Status',
      renderCell: (client) => (
        <StatusBadge tone={client.active ? 'success' : 'neutral'}>
          {client.active ? 'Ativo' : 'Inativo'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      mobileLabel: 'Ações',
      headerClassName: 'client-actions-heading',
      cellClassName: 'client-actions-cell',
      renderCell: (client) => (
        <RowActions>
          <IconActionButton
            label={`Editar ${client.name}`}
            variant="accent"
            onClick={() => navigate(`/clients/${client.id}/edit`)}
          >
            <Pencil aria-hidden="true" />
          </IconActionButton>
          <IconActionButton
            label={`Excluir ${client.name}`}
            variant="danger"
            onClick={() => {
              setDeleteError(null);
              setClientToDelete(client);
            }}
            disabled={deletingClientId === client.id}
          >
            <Trash2 aria-hidden="true" />
          </IconActionButton>
        </RowActions>
      ),
    },
  ];

  return (
    <section className="dashboard-content client-list-page">
      <PageHeader
        eyebrow="Cadastros"
        title="Clientes"
        action={
          <span className="client-total">
            {clients.length} {clients.length === 1 ? 'cliente' : 'clientes'}
          </span>
        }
      />

      <Panel className="client-list-card" labelledBy="client-list-heading">
        <div className="client-list-heading">
          <div>
            <h2 id="client-list-heading">Lista de clientes</h2>
            <p>Consulte e mantenha os clientes vinculados às suas obras e orçamentos.</p>
          </div>
          <span aria-live="polite">
            {visibleClients.length} {visibleClients.length === 1 ? 'cliente' : 'clientes'} nesta
            página
          </span>
        </div>

        <form
          className="client-filters"
          aria-label="Filtros de clientes"
          onSubmit={(event) => {
            event.preventDefault();
            setIsLoading(true);
            setError('');
            setAppliedFilters({ ...filters, query: filters.query?.trim() });
            setPage(0);
          }}
        >
          <label className="client-search-field">
            Pesquisar
            <input
              type="search"
              value={filters.query ?? ''}
              onChange={(event) => setFilters({ ...filters, query: event.target.value })}
              placeholder="Nome, documento ou email"
            />
          </label>
          <label>
            Tipo
            <select
              value={filters.type ?? ''}
              onChange={(event) =>
                setFilters({ ...filters, type: event.target.value as ClientType | '' })
              }
            >
              <option value="">Todos</option>
              <option value="INDIVIDUAL">Pessoa física</option>
              <option value="COMPANY">Empresa</option>
            </select>
          </label>
          <label>
            Status
            <select
              value={String(filters.active)}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  active: event.target.value === '' ? '' : event.target.value === 'true',
                })
              }
            >
              <option value="">Todos</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
            </select>
          </label>
          <button type="submit" className="primary-button">
            Buscar
          </button>
          <button type="button" className="text-button" onClick={clearFilters}>
            Limpar filtros
          </button>
        </form>

        {isLoading ? (
          <ContentState variant="loading" title="Carregando clientes..." />
        ) : error ? (
          <ContentState
            variant="error"
            title={error}
            action={
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setIsLoading(true);
                  setError('');
                  setRevision((value) => value + 1);
                }}
              >
                Tentar novamente
              </button>
            }
          />
        ) : clients.length === 0 ? (
          <ContentState
            variant={hasFilters ? 'no-results' : 'empty'}
            title={hasFilters ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            description={
              hasFilters
                ? 'Altere os filtros ou limpe a pesquisa para ver outros clientes.'
                : 'Cadastre um cliente para começar a vinculá-lo às suas obras.'
            }
            action={
              hasFilters ? (
                <button type="button" className="text-button" onClick={clearFilters}>
                  Limpar filtros
                </button>
              ) : (
                <Link to="/clients/new" className="primary-button">
                  Cadastrar cliente
                </Link>
              )
            }
          />
        ) : (
          <DataTable
            rows={visibleClients}
            columns={columns}
            getRowKey={(client) => client.id}
            getRowLabel={(client) => `Abrir detalhes de ${client.name}`}
            onRowActivate={setSelectedClient}
            ariaLabel="Lista de clientes"
          />
        )}

        {!isLoading && !error && clients.length > 0 ? (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(0);
            }}
            ariaLabel="Paginação da lista de clientes"
            className="client-list-controls"
          />
        ) : null}
      </Panel>

      <Link to="/clients/new" className="list-create-fab">
        <span aria-hidden="true">+</span>
        Cadastrar cliente
      </Link>

      <Outlet
        context={{
          refreshClients: () => {
            setIsLoading(true);
            setError('');
            setRevision((value) => value + 1);
          },
          clients,
        }}
      />

      <ClientDetailsDialog client={selectedClient} onClose={() => setSelectedClient(null)} />

      {clientToDelete ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open && !deletingClientId) {
              setClientToDelete(null);
              setDeleteError(null);
            }
          }}
          eyebrow="Confirmar exclusão"
          title="Excluir cliente?"
          description={
            <>
              Você está prestes a excluir <strong>{clientToDelete.name}</strong>. Essa ação é
              permanente e não pode ser desfeita.
            </>
          }
          error={deleteError}
          isConfirming={Boolean(deletingClientId)}
          confirmLabel="Excluir cliente"
          confirmingLabel="Excluindo..."
          onConfirm={handleConfirmDeleteClient}
        />
      ) : null}
    </section>
  );
}
