import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { ContentState } from '../../../shared/components/ui/ContentState';
import { DataTable, type DataTableColumn } from '../../../shared/components/ui/DataTable';
import { Panel } from '../../../shared/components/ui/Panel';
import { RegistrationDialog } from '../../../shared/components/ui/RegistrationDialog';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import {
  addBudgetItem,
  addBudgetStage,
  approveBudgetAndCreateProject,
  deleteBudgetItem,
  duplicateBudget,
  finalizeBudget,
  getBudget,
  getCompositions,
  rejectBudget,
  reloadProjects,
} from '../services/planningService';
import type {
  Budget,
  BudgetApprovalRequest,
  BudgetItem,
  BudgetStage,
  Composition,
  Project,
} from '../types/planning';
import { budgetStatusLabel, budgetStatusTone, money } from '../presentation';
import './Planning.scss';

type DetailTab = 'budget' | 'proposal';

export function BudgetDetailsPage() {
  const { budgetId } = useParams();

  const navigate = useNavigate();

  const budgetTab = useRef<HTMLButtonElement>(null);

  const proposalTab = useRef<HTMLButtonElement>(null);

  const [budget, setBudget] = useState<Budget | null>(null);

  const [compositions, setCompositions] = useState<Composition[]>([]);

  const [linkedProject, setLinkedProject] = useState<Project | null>(null);

  const [activeTab, setActiveTab] = useState<DetailTab>('budget');

  const [stageName, setStageName] = useState('');

  const [itemDraft, setItemDraft] = useState<
    Record<string, { compositionId: string; quantity: string }>
  >({});

  const [approvalOpen, setApprovalOpen] = useState(false);

  const [approval, setApproval] = useState<BudgetApprovalRequest | null>(null);

  const [rejectOpen, setRejectOpen] = useState(false);

  const [duplicateOpen, setDuplicateOpen] = useState(false);

  const [duplicateNumber, setDuplicateNumber] = useState('');

  const [removingItem, setRemovingItem] = useState<{
    item: BudgetItem;
    stage: BudgetStage;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  const [pending, setPending] = useState(false);

  const [error, setError] = useState('');

  const [success, setSuccess] = useState('');

  const close = () => {
    if (!pending) navigate('/budgets', { replace: true });
  };

  useEffect(() => {
    if (!budgetId) return;
    Promise.all([getBudget(budgetId), getCompositions()])
      .then(([loadedBudget, loadedCompositions]) => {
        setBudget(loadedBudget);
        setCompositions(loadedCompositions);
      })
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o orçamento.'),
      )
      .finally(() => setLoading(false));
  }, [budgetId]);

  const run = async (action: () => Promise<Budget>, message: string) => {
    if (pending) return null;
    setPending(true);
    setError('');
    setSuccess('');
    try {
      const updated = await action();
      setBudget(updated);
      setSuccess(message);
      return updated;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar o orçamento.');
      return null;
    } finally {
      setPending(false);
    }
  };

  const changeTab = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next: DetailTab =
      event.key === 'ArrowLeft' || event.key === 'Home' ? 'budget' : 'proposal';
    setActiveTab(next);
    (next === 'budget' ? budgetTab : proposalTab).current?.focus();
  };

  const openApproval = () => {
    if (!budget) return;
    setApproval({
      code: budget.number,
      name: budget.proposedProjectName,
      description: budget.proposedProjectDescription ?? '',
      street: budget.proposedProjectStreet ?? '',
      city: budget.proposedProjectCity ?? '',
      state: budget.proposedProjectState ?? '',
      zipCode: budget.proposedProjectZipCode ?? '',
      plannedStartDate: null,
      plannedEndDate: null,
    });
    setApprovalOpen(true);
  };

  const approve = async (event: FormEvent) => {
    event.preventDefault();
    if (!budget || !approval || pending) return;
    setPending(true);
    setError('');
    try {
      const response = await approveBudgetAndCreateProject(budget.id, approval);
      setBudget(response.budget);
      setLinkedProject(response.project);
      setApprovalOpen(false);
      await reloadProjects();
      setSuccess(
        budget.projectLinkOrigin === 'LEGACY'
          ? 'Orçamento aprovado e obra existente vinculada.'
          : 'Orçamento aprovado e obra gerada com sucesso.',
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível aprovar o orçamento.');
    } finally {
      setPending(false);
    }
  };

  if (loading || !budget) {
    return (
      <RegistrationDialog
        open
        onOpenChange={(open) => {
          if (!open) close();
        }}
        kind="budget"
        eyebrow="Orçamentos"
        title={loading ? 'Carregando orçamento' : 'Orçamento não encontrado'}
        closeLabel="Fechar orçamento"
      >
        {loading ? (
          <ContentState variant="loading" title="Carregando orçamento..." />
        ) : (
          <ContentState
            variant="error"
            title={error || 'Orçamento não encontrado'}
            action={
              <button type="button" className="text-button" onClick={close}>
                Voltar aos orçamentos
              </button>
            }
          />
        )}
      </RegistrationDialog>
    );
  }

  return (
    <RegistrationDialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
      kind="budget-details"
      eyebrow="Orçamentos"
      title={`${budget.number} · ${budget.title}`}
      isSubmitting={pending}
      closeLabel="Fechar orçamento"
    >
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
        <div className="planning-tabs" role="tablist" aria-label="Visualização do orçamento">
          <button
            ref={budgetTab}
            type="button"
            role="tab"
            aria-selected={activeTab === 'budget'}
            aria-controls="budget-panel"
            tabIndex={activeTab === 'budget' ? 0 : -1}
            onClick={() => setActiveTab('budget')}
            onKeyDown={changeTab}
          >
            Orçamento
          </button>
          <button
            ref={proposalTab}
            type="button"
            role="tab"
            aria-selected={activeTab === 'proposal'}
            aria-controls="proposal-panel"
            tabIndex={activeTab === 'proposal' ? 0 : -1}
            onClick={() => setActiveTab('proposal')}
            onKeyDown={changeTab}
          >
            Proposta
          </button>
        </div>
        <section id="budget-panel" role="tabpanel" hidden={activeTab !== 'budget'}>
          <BudgetWorkspace
            budget={budget}
            compositions={compositions}
            itemDraft={itemDraft}
            stageName={stageName}
            pending={pending}
            linkedProject={linkedProject}
            onItemDraftChange={setItemDraft}
            onStageNameChange={setStageName}
            onRun={run}
            onFinalize={() =>
              void run(() => finalizeBudget(budget.id), 'Orçamento finalizado e bloqueado.')
            }
            onApprove={openApproval}
            onReject={() => setRejectOpen(true)}
            onDuplicate={() => setDuplicateOpen(true)}
            onRemoveItem={(item, stage) => setRemovingItem({ item, stage })}
          />
        </section>
        <section id="proposal-panel" role="tabpanel" hidden={activeTab !== 'proposal'}>
          <Proposal budget={budget} />
        </section>
        {activeTab === 'proposal' ? (
          <button className="primary-button planning-print" onClick={() => window.print()}>
            Imprimir proposta
          </button>
        ) : null}
        <RegistrationDialog
          open={approvalOpen}
          onOpenChange={setApprovalOpen}
          kind="project"
          eyebrow="Orçamento finalizado"
          title={
            budget.projectLinkOrigin === 'LEGACY'
              ? 'Aprovar e vincular obra existente'
              : 'Aprovar e gerar obra'
          }
          isSubmitting={pending}
        >
          {budget.projectLinkOrigin === 'LEGACY' ? (
            <p className="planning-notice">
              Já existe uma obra vinculada; nenhuma segunda obra será criada.
            </p>
          ) : null}
          {approval ? (
            <ApprovalForm
              value={approval}
              onChange={setApproval}
              onSubmit={approve}
              pending={pending}
            />
          ) : null}
        </RegistrationDialog>
        <ConfirmDialog
          open={rejectOpen}
          onOpenChange={setRejectOpen}
          title="Marcar orçamento como recusado?"
          description="O orçamento ficará bloqueado e poderá ser duplicado para revisão."
          onConfirm={async () => {
            const result = await run(
              () => rejectBudget(budget.id),
              'Orçamento marcado como recusado.',
            );
            if (result) setRejectOpen(false);
          }}
          confirmLabel="Marcar como recusado"
          confirmingLabel="A recusar..."
          isConfirming={pending}
        />
        {removingItem ? (
          <ConfirmDialog
            open
            onOpenChange={(open) => {
              if (!open && !pending) setRemovingItem(null);
            }}
            eyebrow="Orçamento em rascunho"
            title="Remover serviço?"
            description={
              <>
                <strong>{removingItem.item.name}</strong> será removido da etapa{' '}
                <strong>{removingItem.stage.name}</strong> e os totais serão recalculados.
              </>
            }
            onConfirm={async () => {
              const result = await run(
                () => deleteBudgetItem(budget.id, removingItem.item.id),
                'Serviço removido com sucesso.',
              );
              if (result) setRemovingItem(null);
            }}
            confirmLabel="Remover serviço"
            confirmingLabel="Removendo..."
            isConfirming={pending}
            error={removingItem && error ? error : undefined}
          />
        ) : null}
        <RegistrationDialog
          open={duplicateOpen}
          onOpenChange={setDuplicateOpen}
          kind="budget"
          eyebrow="Nova revisão"
          title="Duplicar orçamento recusado"
          isSubmitting={pending}
        >
          <form
            className="planning-form"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!duplicateNumber.trim() || duplicateNumber.trim() === budget.number) return;
              const result = await run(
                () => duplicateBudget(budget.id, { number: duplicateNumber.trim() }),
                'Revisão criada.',
              );
              if (result) navigate(`/budgets/${result.id}`);
            }}
          >
            <label>
              Novo número
              <input
                required
                value={duplicateNumber}
                onChange={(event) => setDuplicateNumber(event.target.value)}
              />
            </label>
            <button
              className="primary-button"
              disabled={
                pending || !duplicateNumber.trim() || duplicateNumber.trim() === budget.number
              }
            >
              Criar revisão
            </button>
          </form>
        </RegistrationDialog>
      </div>
    </RegistrationDialog>
  );
}

interface WorkspaceProps {
  budget: Budget;
  compositions: Composition[];
  itemDraft: Record<string, { compositionId: string; quantity: string }>;
  stageName: string;
  pending: boolean;
  linkedProject: Project | null;
  onItemDraftChange: (value: Record<string, { compositionId: string; quantity: string }>) => void;
  onStageNameChange: (value: string) => void;
  onRun: (action: () => Promise<Budget>, message: string) => Promise<Budget | null>;
  onFinalize: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDuplicate: () => void;
  onRemoveItem: (item: BudgetItem, stage: BudgetStage) => void;
}

function BudgetWorkspace({
  budget,
  compositions,
  itemDraft,
  stageName,
  pending,
  linkedProject,
  onItemDraftChange,
  onStageNameChange,
  onRun,
  onFinalize,
  onApprove,
  onReject,
  onDuplicate,
  onRemoveItem,
}: WorkspaceProps) {
  const draft = budget.status === 'DRAFT';
  return (
    <Panel className="planning-wide">
      <div className="planning-actions">
        {draft ? (
          <Link className="secondary-button" to={`/budgets/${budget.id}/edit`}>
            Editar dados
          </Link>
        ) : null}
      </div>
      {budget.status === 'APPROVED' ? (
        <p className="planning-notice">
          Obra vinculada: <strong>{linkedProject?.code ?? budget.projectId ?? '—'}</strong> ·{' '}
          {linkedProject?.name ?? budget.projectName ?? budget.proposedProjectName}
        </p>
      ) : null}
      {draft ? (
        <form
          className="planning-form planning-inline-form"
          onSubmit={(event) => {
            event.preventDefault();
            void onRun(() => addBudgetStage(budget.id, stageName), 'Etapa adicionada.').then(
              (result) => {
                if (result) onStageNameChange('');
              },
            );
          }}
        >
          <label>
            Nova etapa
            <input
              required
              placeholder="Ex.: Mobilização"
              value={stageName}
              onChange={(event) => onStageNameChange(event.target.value)}
            />
          </label>
          <button disabled={pending}>Adicionar etapa</button>
        </form>
      ) : null}
      {budget.stages.map((stage) => {
        const line = itemDraft[stage.id] ?? { compositionId: '', quantity: '1' };
        return (
          <section className="budget-stage" key={stage.id}>
            <h3>{stage.name}</h3>
            {stage.items.map((item) => (
              <div className="budget-item" key={item.id}>
                <span>
                  {item.name} · {item.quantity} {item.unitSymbol}
                </span>
                <span>Custo {money(item.totalCost)}</span>
                <strong>Venda {money(item.totalSalePrice)}</strong>
                {draft ? (
                  <button
                    type="button"
                    className="budget-item-remove"
                    aria-label={`Remover ${item.name} da etapa ${stage.name}`}
                    disabled={pending}
                    onClick={() => onRemoveItem(item, stage)}
                  >
                    <Trash2 aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            ))}
            {draft ? (
              <form
                className="composition-line"
                onSubmit={(event) => {
                  event.preventDefault();
                  void onRun(
                    () =>
                      addBudgetItem(budget.id, stage.id, line.compositionId, Number(line.quantity)),
                    'Serviço adicionado.',
                  );
                }}
              >
                <label>
                  Composição
                  <select
                    required
                    value={line.compositionId}
                    onChange={(event) =>
                      onItemDraftChange({
                        ...itemDraft,
                        [stage.id]: { ...line, compositionId: event.target.value },
                      })
                    }
                  >
                    <option value="">Selecione</option>
                    {compositions.map((composition) => (
                      <option key={composition.id} value={composition.id}>
                        {composition.name} · {money(composition.unitCost)}/{composition.unitSymbol}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Quantidade
                  <input
                    required
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    value={line.quantity}
                    onChange={(event) =>
                      onItemDraftChange({
                        ...itemDraft,
                        [stage.id]: { ...line, quantity: event.target.value },
                      })
                    }
                  />
                </label>
                <button disabled={pending}>Adicionar serviço</button>
              </form>
            ) : null}
          </section>
        );
      })}
      <div className="planning-actions">
        {draft ? (
          <button className="primary-button" disabled={pending} onClick={onFinalize}>
            Finalizar e bloquear orçamento
          </button>
        ) : null}
        {budget.status === 'FINALIZED' ? (
          <>
            <button className="primary-button" disabled={pending} onClick={onApprove}>
              {budget.projectLinkOrigin === 'LEGACY'
                ? 'Aprovar e vincular obra existente'
                : 'Aprovar e gerar obra'}
            </button>
            <button disabled={pending} onClick={onReject}>
              Marcar como recusado
            </button>
          </>
        ) : null}
        {budget.status === 'REJECTED' ? (
          <button className="primary-button" disabled={pending} onClick={onDuplicate}>
            Duplicar para revisão
          </button>
        ) : null}
      </div>
    </Panel>
  );
}

interface ApprovalProps {
  value: BudgetApprovalRequest;
  onChange: (value: BudgetApprovalRequest) => void;
  onSubmit: (event: FormEvent) => void;
  pending: boolean;
}

function ApprovalForm({ value, onChange, onSubmit, pending }: ApprovalProps) {
  const field =
    (key: keyof BudgetApprovalRequest) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange({ ...value, [key]: event.target.value || (key.startsWith('planned') ? null : '') });
  return (
    <form className="planning-form planning-sectioned-form" onSubmit={onSubmit}>
      <fieldset className="planning-form-section">
        <legend>Identificação da obra</legend>
        <div className="planning-form-grid planning-form-grid--two">
          <label>
            Código
            <input required value={value.code} onChange={field('code')} />
          </label>
          <label>
            Nome
            <input required value={value.name} onChange={field('name')} />
          </label>
          <label className="planning-field--full">
            Descrição
            <textarea rows={3} value={value.description} onChange={field('description')} />
          </label>
        </div>
      </fieldset>

      <fieldset className="planning-form-section">
        <legend>Localização e planeamento</legend>
        <div className="planning-form-grid">
          <label className="planning-field--full">
            Morada
            <input value={value.street} onChange={field('street')} />
          </label>
          <label>
            Cidade
            <input value={value.city} onChange={field('city')} />
          </label>
          <label>
            Estado
            <input value={value.state} onChange={field('state')} />
          </label>
          <label>
            Código postal
            <input value={value.zipCode} onChange={field('zipCode')} />
          </label>
          <label>
            Data inicial
            <input
              type="date"
              value={value.plannedStartDate ?? ''}
              onChange={field('plannedStartDate')}
            />
          </label>
          <label>
            Data final
            <input
              type="date"
              min={value.plannedStartDate ?? undefined}
              value={value.plannedEndDate ?? ''}
              onChange={field('plannedEndDate')}
            />
          </label>
        </div>
      </fieldset>

      <div className="planning-actions planning-form-footer">
        <button className="primary-button" disabled={pending}>
          {pending ? 'A aprovar...' : 'Confirmar aprovação'}
        </button>
      </div>
    </form>
  );
}

function Proposal({ budget }: { budget: Budget }) {
  const columns: DataTableColumn<Budget['stages'][number]['items'][number]>[] = [
    { key: 'name', header: 'Serviço', mobileLabel: 'Serviço', renderCell: (item) => item.name },
    { key: 'unit', header: 'Un.', mobileLabel: 'Unidade', renderCell: (item) => item.unitSymbol },
    {
      key: 'quantity',
      header: 'Qtd.',
      mobileLabel: 'Quantidade',
      renderCell: (item) => item.quantity,
    },
    {
      key: 'price',
      header: 'Preço unit.',
      mobileLabel: 'Preço unitário',
      renderCell: (item) => money(item.unitSalePrice),
    },
    {
      key: 'total',
      header: 'Total',
      mobileLabel: 'Total',
      renderCell: (item) => money(item.totalSalePrice),
    },
  ];
  return (
    <Panel className="planning-wide proposal">
      <header className="proposal-header">
        <div>
          <p>PROPOSTA {budget.number}</p>
          <h2>{budget.title}</h2>
          <p>
            Cliente: {budget.clientName}
            <br />
            Obra: {budget.projectName ?? budget.proposedProjectName}
          </p>
        </div>
        <p>
          Validade
          <br />
          <strong>{budget.validUntil ?? 'A combinar'}</strong>
        </p>
      </header>
      {budget.stages.map((stage) => (
        <section key={stage.id}>
          <h3>{stage.name}</h3>
          <DataTable
            rows={stage.items}
            columns={columns}
            getRowKey={(item) => item.id}
            ariaLabel={`Serviços da etapa ${stage.name}`}
          />
        </section>
      ))}
      <footer className="proposal-total">
        <div>
          <strong>Condições comerciais</strong>
          <p>{budget.commercialTerms || 'A combinar.'}</p>
        </div>
        <h2>Total: {money(budget.totalSalePrice)}</h2>
      </footer>
    </Panel>
  );
}
