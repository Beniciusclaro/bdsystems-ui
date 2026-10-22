import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ContentState } from '../../../shared/components/ui/ContentState';
import { RegistrationDialog } from '../../../shared/components/ui/RegistrationDialog';
import { BudgetForm } from '../components/BudgetForm';
import {
  budgetFormToRequest,
  budgetToForm,
  emptyBudgetForm,
  type BudgetFormValue,
} from '../budgetFormModel';
import { getBudget, getClients, saveBudget } from '../services/planningService';
import type { Client } from '../types/planning';

export function BudgetRegistrationPage() {
  const { budgetId } = useParams();

  const navigate = useNavigate();

  const { refreshBudgets, notify } = useOutletContext<{
    refreshBudgets: () => void;
    notify: (message: string) => void;
  }>();

  const [clients, setClients] = useState<Client[]>([]);

  const [form, setForm] = useState<BudgetFormValue>(emptyBudgetForm);

  const [loading, setLoading] = useState(true);

  const [pending, setPending] = useState(false);

  const [error, setError] = useState('');

  const submitting = useRef(false);

  useEffect(() => {
    Promise.all([getClients(), budgetId ? getBudget(budgetId) : Promise.resolve(null)])
      .then(([loadedClients, budget]) => {
        setClients(loadedClients);
        if (budget) {
          if (budget.status !== 'DRAFT')
            throw new Error('Somente orçamentos em rascunho podem ser editados.');
          setForm(budgetToForm(budget));
        }
      })
      .catch((cause) =>
        setError(
          cause instanceof Error ? cause.message : 'Não foi possível carregar o formulário.',
        ),
      )
      .finally(() => setLoading(false));
  }, [budgetId]);

  const close = () => {
    if (!submitting.current) navigate('/budgets', { replace: true });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    setError('');
    try {
      await saveBudget(budgetFormToRequest(form), budgetId);
      refreshBudgets();
      notify(budgetId ? 'Orçamento atualizado com sucesso.' : 'Orçamento criado com sucesso.');
      navigate('/budgets', { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o orçamento.');
    } finally {
      submitting.current = false;
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
      eyebrow="Planeamento comercial"
      title={budgetId ? 'Editar orçamento' : 'Novo orçamento'}
      isSubmitting={pending}
    >
      {loading ? (
        <ContentState variant="loading" title="Carregando formulário..." />
      ) : error && clients.length === 0 ? (
        <ContentState variant="error" title={error} />
      ) : (
        <>
          {error ? (
            <p className="message error" role="alert">
              {error}
            </p>
          ) : null}
          <BudgetForm
            value={form}
            clients={clients}
            onChange={setForm}
            onSubmit={submit}
            pending={pending}
            submitLabel={budgetId ? 'Salvar orçamento' : 'Criar orçamento'}
            onCancel={close}
          />
        </>
      )}
    </RegistrationDialog>
  );
}
