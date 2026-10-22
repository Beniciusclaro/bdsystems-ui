import { useCallback, useEffect, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { ContentState } from '../../../shared/components/ui/ContentState';
import { DataTable, type DataTableColumn } from '../../../shared/components/ui/DataTable';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { Panel } from '../../../shared/components/ui/Panel';
import { IconActionButton, RowActions } from '../../../shared/components/ui/RowActions';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { deleteBudget, getBudgets } from '../services/planningService';
import type { Budget } from '../types/planning';
import { budgetStatusLabel, budgetStatusTone, money } from '../presentation';
import './Planning.scss';

export function BudgetPage() {
  const navigate = useNavigate();

  const [budgets, setBudgets] = useState<Budget[]>([]);

  const [deleting, setDeleting] = useState<Budget | null>(null);

  const [loading, setLoading] = useState(true);

  const [pending, setPending] = useState(false);

  const [error, setError] = useState('');

  const [deleteError, setDeleteError] = useState('');

  const [success, setSuccess] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    getBudgets()
      .then(setBudgets)
      .catch((cause) =>
        setError(
          cause instanceof Error ? cause.message : 'Não foi possível carregar os orçamentos.',
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Synchronize the list with the planning API on route entry.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const remove = async () => {
    if (!deleting || deleting.status !== 'DRAFT' || pending) return;
    setPending(true);
    setDeleteError('');
    try {
      await deleteBudget(deleting.id);
      setBudgets((rows) => rows.filter((row) => row.id !== deleting.id));
      setDeleting(null);
      setSuccess('Orçamento excluído com sucesso.');
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
              <span aria-hidden="true">×</span>
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
            {budgets.length} {budgets.length === 1 ? 'orçamento' : 'orçamentos'}
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
        {error ? (
          <ContentState
            variant="error"
            title={error}
            action={
              <button className="text-button" onClick={load}>
                Tentar novamente
              </button>
            }
          />
        ) : loading ? (
          <ContentState variant="loading" title="Carregando orçamentos..." />
        ) : budgets.length === 0 ? (
          <ContentState
            variant="empty"
            title="Nenhum orçamento cadastrado"
            action={
              <Link className="primary-button" to="/budgets/new">
                Novo orçamento
              </Link>
            }
          />
        ) : (
          <DataTable
            rows={budgets}
            columns={columns}
            getRowKey={(budget) => budget.id}
            getRowLabel={(budget) => `Abrir detalhes do orçamento ${budget.number}`}
            onRowActivate={(budget) => navigate(`/budgets/${budget.id}`)}
            ariaLabel="Lista de orçamentos"
          />
        )}
      </Panel>
      <Link className="list-create-fab" to="/budgets/new">
        <span aria-hidden="true">+</span>Novo orçamento
      </Link>
      <Outlet context={{ refreshBudgets: load, notify: setSuccess }} />
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
