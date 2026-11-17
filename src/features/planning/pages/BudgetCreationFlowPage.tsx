import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { Trash2 } from 'lucide-react';
import { useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { ContentState } from '../../../shared/components/ui/ContentState';
import { DataTable, type DataTableColumn } from '../../../shared/components/ui/DataTable';
import { Panel } from '../../../shared/components/ui/Panel';
import { RegistrationDialog } from '../../../shared/components/ui/RegistrationDialog';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { BudgetForm } from '../components/BudgetForm';
import {
  budgetFormToRequest,
  budgetToForm,
  emptyBudgetForm,
  type BudgetFormValue,
} from '../budgetFormModel';
import {
  addBudgetItem,
  addBudgetStage,
  approveBudgetAndCreateProject,
  deleteBudgetItem,
  duplicateBudget,
  finalizeBudget,
  getBudget,
  getClients,
  getCompositions,
  rejectBudget,
  reloadProjects,
  saveBudget,
} from '../services/planningService';
import type {
  Budget,
  BudgetApprovalRequest,
  BudgetItem,
  BudgetStage,
  Composition,
  Client,
  Project,
} from '../types/planning';
import { budgetStatusLabel, budgetStatusTone, money } from '../presentation';
import './Planning.scss';

type DetailTab = 'data' | 'stages' | 'proposal';

const tabs: DetailTab[] = ['data', 'stages', 'proposal'];

interface LocalBudgetItem {
  tempId: string;
  persistedId?: string;
  compositionId: string;
  quantity: number;
}

interface LocalBudgetStage {
  tempId: string;
  persistedId?: string;
  name: string;
  description: string;
  sortOrder: number;
  items: LocalBudgetItem[];
}

export function BudgetCreationFlowPage() {
  const { budgetId: routeBudgetId } = useParams();

  const [searchParams] = useSearchParams();

  const budgetId = routeBudgetId ?? searchParams.get('budgetId') ?? undefined;

  const navigate = useNavigate();

  const outletContext = useOutletContext<{ refreshBudgets?: () => void } | null>();

  const dataTab = useRef<HTMLButtonElement>(null);

  const stagesTab = useRef<HTMLButtonElement>(null);

  const proposalTab = useRef<HTMLButtonElement>(null);

  const localId = useRef(0);

  const [budget, setBudget] = useState<Budget | null>(null);

  const [clients, setClients] = useState<Client[]>([]);

  const [form, setForm] = useState<BudgetFormValue>(emptyBudgetForm);

  const [compositions, setCompositions] = useState<Composition[]>([]);

  const [linkedProject, setLinkedProject] = useState<Project | null>(null);

  const [activeTab, setActiveTab] = useState<DetailTab>('data');

  const [stageName, setStageName] = useState('');

  const [localStages, setLocalStages] = useState<LocalBudgetStage[]>([]);

  const [saveProgress, setSaveProgress] = useState('');

  const [partialSave, setPartialSave] = useState(false);

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
    Promise.all([getBudget(budgetId), getCompositions(), getClients()])
      .then(([loadedBudget, loadedCompositions, loadedClients]) => {
        setBudget(loadedBudget);
        setForm(budgetToForm(loadedBudget));
        setCompositions(loadedCompositions);
        setClients(loadedClients);
      })
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o orçamento.'),
      )
      .finally(() => setLoading(false));
  }, [budgetId]);

  useEffect(() => {
    if (budgetId) return;
    Promise.all([getClients(), getCompositions()])
      .then(([loadedClients, loadedCompositions]) => {
        setClients(loadedClients);
        setCompositions(loadedCompositions);
      })
      .catch((cause) =>
        setError(
          cause instanceof Error ? cause.message : 'Não foi possível carregar o formulário.',
        ),
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

  const changeTab = (event: KeyboardEvent<HTMLButtonElement>, current: DetailTab) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();

    const currentIndex = tabs.indexOf(current);

    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? tabs.length - 1
          : event.key === 'ArrowLeft'
            ? (currentIndex - 1 + tabs.length) % tabs.length
            : (currentIndex + 1) % tabs.length;

    const next = tabs[nextIndex];

    setActiveTab(next);
    ({ data: dataTab, stages: stagesTab, proposal: proposalTab })[next].current?.focus();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (pending || (budget && budget.status !== 'DRAFT')) return;
    setPending(true);
    setError('');
    try {
      let canonicalBudget = budget;

      if (routeBudgetId && canonicalBudget) {
        setSaveProgress('Atualizando dados do orçamento...');
        canonicalBudget = await saveBudget(budgetFormToRequest(form), routeBudgetId);
        setBudget(canonicalBudget);
      }

      if (!canonicalBudget) {
        setSaveProgress('Criando orçamento...');
        canonicalBudget = await saveBudget(budgetFormToRequest(form));
        setBudget(canonicalBudget);
        navigate(`/budgets/new?budgetId=${canonicalBudget.id}`, { replace: true });
      }

      let workingStages = localStages;

      for (const localStage of workingStages) {
        let persistedStageId = localStage.persistedId;

        if (!persistedStageId) {
          setSaveProgress(`Salvando fase ${localStage.name}...`);

          const previousStageIds = new Set(canonicalBudget.stages.map((stage) => stage.id));

          const updatedBudget = await addBudgetStage(canonicalBudget.id, localStage.name);

          const persistedStage = updatedBudget.stages.find(
            (stage) => !previousStageIds.has(stage.id),
          );

          if (!persistedStage) throw new Error(`A API não retornou a fase ${localStage.name}.`);

          persistedStageId = persistedStage.id;
          canonicalBudget = updatedBudget;
          workingStages = workingStages.map((stage) =>
            stage.tempId === localStage.tempId
              ? { ...stage, persistedId: persistedStage.id }
              : stage,
          );
          setLocalStages(workingStages);
          setBudget(updatedBudget);
        }

        const currentStage = workingStages.find((stage) => stage.tempId === localStage.tempId)!;

        for (const localItem of currentStage.items) {
          if (localItem.persistedId) continue;

          const composition = compositions.find(
            (candidate) => candidate.id === localItem.compositionId,
          );

          setSaveProgress(`Adicionando serviço ${composition?.name ?? 'selecionado'}...`);

          const previousItemIds = new Set(
            canonicalBudget.stages
              .find((stage) => stage.id === persistedStageId)
              ?.items.map((item) => item.id) ?? [],
          );

          const updatedBudget = await addBudgetItem(
            canonicalBudget.id,
            persistedStageId,
            localItem.compositionId,
            localItem.quantity,
          );

          const persistedItem = updatedBudget.stages
            .find((stage) => stage.id === persistedStageId)
            ?.items.find((item) => !previousItemIds.has(item.id));

          if (!persistedItem)
            throw new Error(`A API não retornou o serviço ${composition?.name ?? 'selecionado'}.`);

          canonicalBudget = updatedBudget;
          workingStages = workingStages.map((stage) =>
            stage.tempId === localStage.tempId
              ? {
                  ...stage,
                  items: stage.items.map((item) =>
                    item.tempId === localItem.tempId
                      ? { ...item, persistedId: persistedItem.id }
                      : item,
                  ),
                }
              : stage,
          );
          setLocalStages(workingStages);
          setBudget(updatedBudget);
        }
      }

      setBudget(canonicalBudget);
      setForm(budgetToForm(canonicalBudget));
      outletContext?.refreshBudgets?.();
      setSuccess(
        routeBudgetId ? 'Orçamento atualizado com sucesso.' : 'Orçamento cadastrado com sucesso.',
      );
      setSaveProgress('');
      setPartialSave(false);
    } catch (cause) {
      setError(
        `${cause instanceof Error ? cause.message : 'Não foi possível salvar o orçamento.'} O progresso concluído foi preservado; use “Continuar salvamento”.`,
      );
      setSaveProgress('Salvamento parcial. Há fases ou serviços pendentes.');
      setPartialSave(true);
    } finally {
      setPending(false);
    }
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

  if (loading || (budgetId && !budget)) {
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
      title={budget ? `${budget.number} · ${budget.title}` : 'Novo orçamento'}
      isSubmitting={pending}
      closeLabel="Fechar orçamento"
    >
      <div className="budget-details-dialog">
        {budget ? (
          <div className="budget-details-summary">
            <p>
              {budget.clientName} · {budget.projectName ?? budget.proposedProjectName}
            </p>
            <StatusBadge tone={budgetStatusTone[budget.status]}>
              {budgetStatusLabel[budget.status]}
            </StatusBadge>
          </div>
        ) : null}
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
        <div className="planning-tabs" role="tablist" aria-label="Fluxo do orçamento">
          <button
            ref={dataTab}
            type="button"
            role="tab"
            id="budget-data-tab"
            aria-selected={activeTab === 'data'}
            aria-controls="budget-data-panel"
            tabIndex={activeTab === 'data' ? 0 : -1}
            onClick={() => setActiveTab('data')}
            onKeyDown={(event) => changeTab(event, 'data')}
          >
            Dados do orçamento
          </button>
          <button
            ref={stagesTab}
            type="button"
            role="tab"
            id="budget-stages-tab"
            aria-selected={activeTab === 'stages'}
            aria-controls="budget-stages-panel"
            tabIndex={activeTab === 'stages' ? 0 : -1}
            onClick={() => setActiveTab('stages')}
            onKeyDown={(event) => changeTab(event, 'stages')}
          >
            Fases do orçamento
          </button>
          <button
            ref={proposalTab}
            type="button"
            role="tab"
            id="budget-proposal-tab"
            aria-selected={activeTab === 'proposal'}
            aria-controls="budget-proposal-panel"
            tabIndex={activeTab === 'proposal' ? 0 : -1}
            onClick={() => setActiveTab('proposal')}
            onKeyDown={(event) => changeTab(event, 'proposal')}
          >
            Proposta
          </button>
        </div>
        <section
          id="budget-data-panel"
          role="tabpanel"
          aria-labelledby="budget-data-tab"
          hidden={activeTab !== 'data'}
        >
          <BudgetForm
            value={form}
            clients={clients}
            onChange={setForm}
            onSubmit={submit}
            pending={pending}
            submitLabel={
              partialSave &&
              localStages.some(
                (stage) => !stage.persistedId || stage.items.some((item) => !item.persistedId),
              )
                ? 'Continuar salvamento'
                : routeBudgetId
                  ? 'Atualizar orçamento'
                  : 'Cadastrar orçamento'
            }
            onCancel={close}
            readOnly={Boolean(budget && budget.status !== 'DRAFT')}
          />
        </section>
        <section
          id="budget-stages-panel"
          role="tabpanel"
          aria-labelledby="budget-stages-tab"
          hidden={activeTab !== 'stages'}
        >
          {budget ? (
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
          ) : null}
          {!budget ||
          localStages.some(
            (stage) => !stage.persistedId || stage.items.some((item) => !item.persistedId),
          ) ? (
            <LocalBudgetWorkspace
              stages={localStages}
              compositions={compositions}
              stageName={stageName}
              itemDraft={itemDraft}
              pending={pending}
              onStageNameChange={setStageName}
              onItemDraftChange={setItemDraft}
              onAddStage={() => {
                const name = stageName.trim();

                if (!name) return;
                localId.current += 1;
                setLocalStages((current) => [
                  ...current,
                  {
                    tempId: `local-stage-${localId.current}`,
                    name,
                    description: '',
                    sortOrder: current.length,
                    items: [],
                  },
                ]);
                setStageName('');
              }}
              onAddItem={(stageTempId, compositionId, quantity) => {
                localId.current += 1;
                setLocalStages((current) =>
                  current.map((stage) =>
                    stage.tempId === stageTempId
                      ? {
                          ...stage,
                          items: [
                            ...stage.items,
                            {
                              tempId: `local-item-${localId.current}`,
                              compositionId,
                              quantity,
                            },
                          ],
                        }
                      : stage,
                  ),
                );
              }}
              onRemoveStage={(tempId) =>
                setLocalStages((current) =>
                  current
                    .filter((stage) => stage.tempId !== tempId)
                    .map((stage, index) => ({ ...stage, sortOrder: index })),
                )
              }
              onRemoveItem={(stageTempId, itemTempId) =>
                setLocalStages((current) =>
                  current.map((stage) =>
                    stage.tempId === stageTempId
                      ? {
                          ...stage,
                          items: stage.items.filter((item) => item.tempId !== itemTempId),
                        }
                      : stage,
                  ),
                )
              }
            />
          ) : null}
        </section>
        <section
          id="budget-proposal-panel"
          role="tabpanel"
          aria-labelledby="budget-proposal-tab"
          hidden={activeTab !== 'proposal'}
        >
          {budget &&
          !localStages.some(
            (stage) => !stage.persistedId || stage.items.some((item) => !item.persistedId),
          ) ? (
            <Proposal budget={budget} />
          ) : (
            <LocalProposal
              form={form}
              clients={clients}
              compositions={compositions}
              stages={localStages}
            />
          )}
        </section>
        {activeTab === 'proposal' && budget ? (
          <button className="primary-button planning-print" onClick={() => window.print()}>
            Imprimir proposta
          </button>
        ) : null}
        {saveProgress ? (
          <p className="planning-notice" role="status">
            {saveProgress}
          </p>
        ) : null}
        {budget ? (
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
        ) : null}
        {budget ? (
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
        ) : null}
        {budget && removingItem ? (
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
        {budget ? (
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
        ) : null}
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

interface LocalWorkspaceProps {
  stages: LocalBudgetStage[];
  compositions: Composition[];
  stageName: string;
  itemDraft: Record<string, { compositionId: string; quantity: string }>;
  pending: boolean;
  onStageNameChange: (value: string) => void;
  onItemDraftChange: (value: Record<string, { compositionId: string; quantity: string }>) => void;
  onAddStage: () => void;
  onAddItem: (stageTempId: string, compositionId: string, quantity: number) => void;
  onRemoveStage: (tempId: string) => void;
  onRemoveItem: (stageTempId: string, itemTempId: string) => void;
}

function LocalBudgetWorkspace({
  stages,
  compositions,
  stageName,
  itemDraft,
  pending,
  onStageNameChange,
  onItemDraftChange,
  onAddStage,
  onAddItem,
  onRemoveStage,
  onRemoveItem,
}: LocalWorkspaceProps) {
  return (
    <Panel className="planning-wide">
      <p className="planning-notice">
        Monte as fases e serviços localmente. Nada será enviado até “Cadastrar orçamento”.
      </p>
      <form
        className="planning-form planning-inline-form"
        onSubmit={(event) => {
          event.preventDefault();
          onAddStage();
        }}
      >
        <label>
          Nova fase
          <input
            required
            placeholder="Ex.: Mobilização"
            value={stageName}
            onChange={(event) => onStageNameChange(event.target.value)}
          />
        </label>
        <button disabled={pending}>Adicionar fase</button>
      </form>
      {stages.length === 0 ? (
        <ContentState variant="empty" title="Nenhuma fase adicionada" />
      ) : null}
      {stages.map((stage) => {
        const line = itemDraft[stage.tempId] ?? { compositionId: '', quantity: '1' };

        return (
          <section className="budget-stage" key={stage.tempId}>
            <div className="planning-actions">
              <h3>{stage.name}</h3>
              <button
                type="button"
                className="text-button"
                disabled={pending || Boolean(stage.persistedId)}
                onClick={() => onRemoveStage(stage.tempId)}
              >
                Remover fase
              </button>
            </div>
            {stage.items.map((item) => {
              const composition = compositions.find(
                (candidate) => candidate.id === item.compositionId,
              );

              return (
                <div className="budget-item" key={item.tempId}>
                  <span>
                    {composition?.name ?? 'Composição'} · {item.quantity}{' '}
                    {composition?.unitSymbol ?? ''}
                  </span>
                  <span>Custo {money((composition?.unitCost ?? 0) * item.quantity)}</span>
                  <button
                    type="button"
                    className="budget-item-remove"
                    aria-label={`Remover ${composition?.name ?? 'serviço'} da fase ${stage.name}`}
                    disabled={pending || Boolean(item.persistedId)}
                    onClick={() => onRemoveItem(stage.tempId, item.tempId)}
                  >
                    <Trash2 aria-hidden="true" />
                  </button>
                </div>
              );
            })}
            <form
              className="composition-line"
              onSubmit={(event) => {
                event.preventDefault();

                const quantity = Number(line.quantity);

                if (!line.compositionId || quantity <= 0) return;
                onAddItem(stage.tempId, line.compositionId, quantity);
                onItemDraftChange({
                  ...itemDraft,
                  [stage.tempId]: { compositionId: '', quantity: '1' },
                });
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
                      [stage.tempId]: { ...line, compositionId: event.target.value },
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
                      [stage.tempId]: { ...line, quantity: event.target.value },
                    })
                  }
                />
              </label>
              <button disabled={pending}>Adicionar serviço</button>
            </form>
          </section>
        );
      })}
    </Panel>
  );
}

function LocalProposal({
  form,
  clients,
  compositions,
  stages,
}: {
  form: BudgetFormValue;
  clients: Client[];
  compositions: Composition[];
  stages: LocalBudgetStage[];
}) {
  const client = clients.find((candidate) => candidate.id === form.clientId);

  const multiplier =
    (1 + Number(form.marginPercent || 0) / 100) * (1 + Number(form.taxPercent || 0) / 100);

  const total = stages.reduce(
    (stageTotal, stage) =>
      stageTotal +
      stage.items.reduce((itemTotal, item) => {
        const composition = compositions.find((candidate) => candidate.id === item.compositionId);

        return itemTotal + (composition?.unitCost ?? 0) * item.quantity * multiplier;
      }, 0),
    0,
  );

  return (
    <Panel className="planning-wide proposal">
      <p className="planning-notice">
        Prévia não salva. Os valores finais serão recalculados pelo servidor ao cadastrar.
      </p>
      <header className="proposal-header">
        <div>
          <p>PRÉVIA DA PROPOSTA {form.number || 'SEM NÚMERO'}</p>
          <h2>{form.title || 'Novo orçamento'}</h2>
          <p>
            Cliente: {client?.name ?? 'Não selecionado'}
            <br />
            Obra: {form.proposedProjectName || 'Não informada'}
          </p>
        </div>
      </header>
      {stages.map((stage) => (
        <section key={stage.tempId}>
          <h3>{stage.name}</h3>
          {stage.items.map((item) => {
            const composition = compositions.find(
              (candidate) => candidate.id === item.compositionId,
            );

            const unitSalePrice = (composition?.unitCost ?? 0) * multiplier;

            return (
              <div className="budget-item" key={item.tempId}>
                <span>{composition?.name ?? 'Composição'}</span>
                <span>
                  {item.quantity} {composition?.unitSymbol ?? ''}
                </span>
                <strong>{money(unitSalePrice * item.quantity)}</strong>
              </div>
            );
          })}
        </section>
      ))}
      <footer className="proposal-total">
        <div>
          <strong>Condições comerciais</strong>
          <p>{form.commercialTerms || 'A combinar.'}</p>
        </div>
        <h2>Total estimado: {money(total)}</h2>
      </footer>
    </Panel>
  );
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
            void onRun(() => addBudgetStage(budget.id, stageName), 'Fase adicionada.').then(
              (result) => {
                if (result) onStageNameChange('');
              },
            );
          }}
        >
          <label>
            Nova fase
            <input
              required
              placeholder="Ex.: Mobilização"
              value={stageName}
              onChange={(event) => onStageNameChange(event.target.value)}
            />
          </label>
          <button disabled={pending}>Adicionar fase</button>
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
