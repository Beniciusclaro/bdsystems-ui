import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ContentState } from '../../../shared/components/ui/ContentState';
import { RegistrationDialog } from '../../../shared/components/ui/RegistrationDialog';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { BudgetForm } from '../components/BudgetForm';
import {
  budgetFormToRequest,
  budgetToForm,
  emptyBudgetForm,
  type BudgetFormValue,
} from '../budgetFormModel';
import { budgetStatusLabel, budgetStatusTone } from '../presentation';
import { getBudget, getClients, saveBudget } from '../services/planningService';
import type { Budget, Client } from '../types/planning';
import './Planning.scss';

export function BudgetDetailsPage() {
  const { budgetId } = useParams();

  const navigate = useNavigate();

  const outletContext = useOutletContext<{ refreshBudgets?: () => void } | null>();

  const [budget, setBudget] = useState<Budget | null>(null);

  const [clients, setClients] = useState<Client[]>([]);

  const [form, setForm] = useState<BudgetFormValue>(emptyBudgetForm);

  const [loading, setLoading] = useState(true);

  const [pending, setPending] = useState(false);

  const [error, setError] = useState('');

  const [success, setSuccess] = useState('');

  const close = () => {
    if (!pending) navigate('/budgets', { replace: true });
  };

  useEffect(() => {
    if (!budgetId) return;

    Promise.all([getBudget(budgetId), getClients()])
      .then(([loadedBudget, loadedClients]) => {
        setBudget(loadedBudget);
        setForm(budgetToForm(loadedBudget));
        setClients(loadedClients);
      })
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o orçamento.'),
      )
      .finally(() => setLoading(false));
  }, [budgetId]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!budget || budget.status !== 'DRAFT' || pending) return;

    setPending(true);
    setError('');
    setSuccess('');

    try {
      const saved = await saveBudget(budgetFormToRequest(form), budget.id);

      setBudget(saved);
      setForm(budgetToForm(saved));
      setSuccess('Orçamento atualizado com sucesso.');
      outletContext?.refreshBudgets?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o orçamento.');
    } finally {
      setPending(false);
    }
  };

  return (
    <RegistrationDialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
      kind="budget"
      eyebrow="Orçamentos"
      title={budget ? `${budget.number} · ${budget.title}` : 'Dados do orçamento'}
      isSubmitting={pending}
      closeLabel="Fechar orçamento"
    >
      {loading ? (
        <ContentState variant="loading" title="Carregando orçamento..." />
      ) : !budget ? (
        <ContentState
          variant="error"
          title={error || 'Orçamento não encontrado'}
          action={
            <button type="button" className="text-button" onClick={close}>
              Voltar aos orçamentos
            </button>
          }
        />
      ) : (
        <div className="budget-details-dialog">
          <div className="budget-details-summary">
            <p>
              {budget.clientName} · {budget.projectName ?? budget.proposedProjectName}
            </p>
            <StatusBadge tone={budgetStatusTone[budget.status]}>
              {budgetStatusLabel[budget.status]}
            </StatusBadge>
          </div>
          {error ? (
            <p className="planning-alert" role="alert">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="message success" role="status">
              {success}
            </p>
          ) : null}
          <BudgetForm
            value={form}
            clients={clients}
            onChange={setForm}
            onSubmit={submit}
            pending={pending}
            submitLabel="Salvar orçamento"
            onCancel={close}
            readOnly={budget.status !== 'DRAFT'}
          />
        </div>
      )}
    </RegistrationDialog>
  );
}
