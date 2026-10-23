import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { ContentState } from '../../../shared/components/ui/ContentState';
import { DataTable, type DataTableColumn } from '../../../shared/components/ui/DataTable';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { Panel } from '../../../shared/components/ui/Panel';
import { Pagination } from '../../../shared/components/ui/Pagination';
import { IconActionButton, RowActions } from '../../../shared/components/ui/RowActions';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { usePaginatedResource } from '../../../shared/hooks/usePaginatedResource';
import { deleteBudget, getBudgetsPage } from '../services/planningService';
import type { Budget, BudgetFilters } from '../types/planning';
import { budgetStatusLabel, budgetStatusTone, money } from '../presentation';
import './Planning.scss';

export function BudgetPage() {
  const navigate = useNavigate();

  const resource = usePaginatedResource<Budget, BudgetFilters>(
    getBudgetsPage,
    {},
    'Não foi possível carregar os orçamentos.',
  );

  const [draft, setDraft] = useState({ search: '', status: '' });

  const [deleting, setDeleting] = useState<Budget | null>(null);

  const [pending, setPending] = useState(false);

  const [deleteError, setDeleteError] = useState('');

  const [success, setSuccess] = useState('');

  const hasFilters = Boolean(resource.filters.search || resource.filters.status);

  const clear = () => {
    setDraft({ search: '', status: '' });
    resource.applyFilters({});
  };

  const remove = async () => {
    if (!deleting || deleting.status !== 'DRAFT' || pending) return;
    setPending(true);
    setDeleteError('');
    try {
      await deleteBudget(deleting.id);
      setDeleting(null);
      setSuccess('Orçamento excluído com sucesso.');
      resource.refresh();
    } catch (cause) {
      setDeleteError(
        cause instanceof Error ? cause.message : 'Não foi possível excluir o orçamento.',
      );
    } finally {
      setPending(false);
    }
  };

  const columns: DataTableColumn<Budget>[] = [
    {
      key: 'number',
      header: 'Número',
      mobileLabel: 'Número',
      renderCell: (budget) => <strong>{budget.number}</strong>,
    },
    {
      key: 'title',
      header: 'Orçamento',
      mobileLabel: 'Orçamento',
      renderCell: (budget) => budget.title,
    },
    {
      key: 'client',
      header: 'Cliente',
      mobileLabel: 'Cliente',
      renderCell: (budget) => budget.clientName,
    },
    {
      key: 'project',
      header: 'Obra',
      mobileLabel: 'Obra',
      renderCell: (budget) => budget.projectName ?? budget.proposedProjectName,
    },
    {
      key: 'status',
      header: 'Status',
      mobileLabel: 'Status',
      renderCell: (budget) => (
        <StatusBadge tone={budgetStatusTone[budget.status]}>
          {budgetStatusLabel[budget.status]}
        </StatusBadge>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      mobileLabel: 'Total',
      renderCell: (budget) => money(budget.totalSalePrice),
      cellClassName: 'number',
    },
    {
      key: 'actions',
      header: 'Ações',
      mobileLabel: 'Ações',
      renderCell: (budget) => (
        <RowActions>
          {budget.status === 'DRAFT' ? (
            <IconActionButton
              label={`Editar ${budget.number}`}
              variant="accent"
              onClick={() => navigate(`/budgets/${budget.id}/edit`)}
            >
              <span aria-hidden="true">✎</span>
            </IconActionButton>
          ) : null}
          {budget.status === 'DRAFT' ? (
            <IconActionButton
              label={`Excluir ${budget.number}`}
              variant="danger"
              onClick={() => {
                setDeleteError('');
                setDeleting(budget);
              }}
            >
              <Trash2 aria-hidden="true" />
            </IconActionButton>
          ) : null}
        </RowActions>
      ),
    },
  ];

  return (
    <main className="dashboard-content planning-page">
      <PageHeader
        eyebrow="Planeamento comercial"
        title="Orçamentos"
        action={
          <span>
            {resource.totalElements} {resource.totalElements === 1 ? 'orçamento' : 'orçamentos'}
          </span>
        }
      />
      {success ? (
        <p className="message success" role="status">
          {success}
        </p>
      ) : null}
      <Panel labelledBy="budget-list-heading">
        <div className="planning-list-heading">
          <div>
            <h2 id="budget-list-heading">Lista de orçamentos</h2>
            <p>Consulte propostas, acompanhe aprovações e prepare novas revisões.</p>
          </div>
        </div>
        <form
          className="planning-filters"
          aria-label="Filtros de orçamentos"
          onSubmit={(event) => {
            event.preventDefault();
            resource.applyFilters({
              search: draft.search.trim() || undefined,
              status: (draft.status || undefined) as Budget['status'] | undefined,
            });
          }}
        >
          <label>
            Número, orçamento, cliente ou obra
            <input
              type="search"
              value={draft.search}
              onChange={(event) => setDraft({ ...draft, search: event.target.value })}
            />
          </label>
          <label>
            Status
            <select
              value={draft.status}
              onChange={(event) => setDraft({ ...draft, status: event.target.value })}
            >
              <option value="">Todos</option>
              <option value="DRAFT">Rascunho</option>
              <option value="FINALIZED">Finalizado</option>
              <option value="APPROVED">Aprovado</option>
              <option value="REJECTED">Rejeitado</option>
            </select>
          </label>
          <button className="primary-button">Buscar</button>
          {(hasFilters || draft.search || draft.status) && (
            <button type="button" className="text-button" onClick={clear}>
              Limpar filtros
            </button>
          )}
        </form>
        {resource.error ? (
          <ContentState
            variant="error"
            title={resource.error}
            action={
              <button className="text-button" onClick={resource.refresh}>
                Tentar novamente
              </button>
            }
          />
        ) : resource.isLoading ? (
          <ContentState variant="loading" title="Carregando orçamentos..." />
        ) : resource.rows.length === 0 ? (
          <ContentState
            variant={hasFilters ? 'no-results' : 'empty'}
            title={hasFilters ? 'Nenhum orçamento encontrado' : 'Nenhum orçamento cadastrado'}
            action={
              hasFilters ? (
                <button className="text-button" onClick={clear}>
                  Limpar filtros
                </button>
              ) : (
                <Link className="primary-button" to="/budgets/new">
                  Novo orçamento
                </Link>
              )
            }
          />
        ) : (
          <DataTable
            rows={resource.rows}
            columns={columns}
            getRowKey={(budget) => budget.id}
            getRowLabel={(budget) => `Abrir detalhes do orçamento ${budget.number}`}
            onRowActivate={(budget) => navigate(`/budgets/${budget.id}`)}
            ariaLabel="Lista de orçamentos"
          />
        )}
        {!resource.isLoading && !resource.error && resource.rows.length > 0 && (
          <Pagination
            currentPage={resource.page}
            totalPages={resource.totalPages}
            pageSize={resource.pageSize}
            pageSizeOptions={[10, 20, 50]}
            onPageChange={resource.goToPage}
            onPageSizeChange={resource.changePageSize}
            ariaLabel="Paginação de orçamentos"
          />
        )}
      </Panel>
      <Link className="list-create-fab" to="/budgets/new">
        <span aria-hidden="true">+</span>Novo orçamento
      </Link>
      <Outlet context={{ refreshBudgets: resource.refresh, notify: setSuccess }} />
      {deleting ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open && !pending) setDeleting(null);
          }}
          title="Excluir orçamento?"
          description={`${deleting.number} será excluído permanentemente. Esta ação só é permitida para rascunhos.`}
          onConfirm={remove}
          confirmLabel="Excluir orçamento"
          confirmingLabel="Excluindo..."
          isConfirming={pending}
          error={deleteError}
        />
      ) : null}
    </main>
  );
}
