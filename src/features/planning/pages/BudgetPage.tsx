import { useEffect, useState, type FormEvent } from 'react';
import { DataTable, type DataTableColumn } from '../../../shared/components/ui/DataTable';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { Panel } from '../../../shared/components/ui/Panel';
import {
  addBudgetItem,
  addBudgetStage,
  finalizeBudget,
  getBudgets,
  getClients,
  getCompositions,
  getProjects,
  saveBudget,
} from '../services/planningService';
import type { Budget, Client, Composition, Project } from '../types/planning';
import './Planning.scss';

export function BudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);

  const [clients, setClients] = useState<Client[]>([]);

  const [projects, setProjects] = useState<Project[]>([]);

  const [compositions, setCompositions] = useState<Composition[]>([]);

  const [current, setCurrent] = useState<Budget | null>(null);

  const [form, setForm] = useState({
    clientId: '',
    projectId: '',
    number: '',
    title: '',
    validUntil: '',
    commercialTerms: '',
    notes: '',
    taxPercent: '0',
    marginPercent: '0',
  });

  const [stageName, setStageName] = useState('');

  const [itemDraft, setItemDraft] = useState<
    Record<string, { compositionId: string; quantity: string }>
  >({});

  const [error, setError] = useState('');

  const [pending, setPending] = useState(false);

  const load = () =>
    Promise.all([getBudgets(), getClients(), getProjects(), getCompositions()]).then(
      ([b, c, p, co]) => {
        setBudgets(b);
        setClients(c);
        setProjects(p);
        setCompositions(co);
      },
    );

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : 'Falha ao carregar orçamentos.'));
  }, []);

  const perform = async (action: () => Promise<Budget>) => {
    setPending(true);
    setError('');
    try {
      const value = await action();
      setCurrent(value);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível atualizar o orçamento.');
    } finally {
      setPending(false);
    }
  };

  const create = (e: FormEvent) => {
    e.preventDefault();
    void perform(() =>
      saveBudget({
        clientId: form.clientId,
        projectId: form.projectId,
        number: form.number,
        title: form.title,
        validUntil: form.validUntil || null,
        commercialTerms: form.commercialTerms,
        notes: form.notes,
        taxPercent: Number(form.taxPercent),
        marginPercent: Number(form.marginPercent),
      }),
    );
  };
  return (
    <main className="dashboard-content planning-page">
      <PageHeader
        eyebrow="Planejamento comercial"
        title="Orçamentos"
        action={current && <button onClick={() => window.print()}>Imprimir proposta</button>}
      />
      {error && (
        <p className="planning-alert" role="alert">
          {error}
        </p>
      )}
      <div className="planning-grid planning-editor">
        <Panel>
          <h2>Novo orçamento</h2>
          <form className="planning-form" onSubmit={create}>
            <label>
              Cliente
              <select
                required
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value, projectId: '' })}
              >
                <option value="">Selecione</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Obra
              <select
                required
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
              >
                <option value="">Selecione</option>
                {projects
                  .filter((p) => p.clientId === form.clientId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Número
              <input
                required
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
              />
            </label>
            <label>
              Título
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>
            <label>
              Validade
              <input
                type="date"
                value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
              />
            </label>
            <label>
              Imposto (%)
              <input
                min="0"
                step="0.01"
                type="number"
                value={form.taxPercent}
                onChange={(e) => setForm({ ...form, taxPercent: e.target.value })}
              />
            </label>
            <label>
              Margem (%)
              <input
                min="0"
                step="0.01"
                type="number"
                value={form.marginPercent}
                onChange={(e) => setForm({ ...form, marginPercent: e.target.value })}
              />
            </label>
            <label>
              Condições
              <textarea
                value={form.commercialTerms}
                onChange={(e) => setForm({ ...form, commercialTerms: e.target.value })}
              />
            </label>
            <button className="primary-button" disabled={pending}>
              Criar orçamento
            </button>
          </form>
        </Panel>
        <Panel>
          <h2>Orçamentos</h2>
          <div className="planning-records">
            {budgets.map((b) => (
              <button key={b.id} onClick={() => setCurrent(b)}>
                <strong>{b.number}</strong> · {b.title} · {money(b.totalSalePrice)}
              </button>
            ))}
          </div>
        </Panel>
      </div>
      {current && (
        <>
          <Panel className="planning-editor planning-wide">
            <div className="proposal-header">
              <div>
                <h2>
                  {current.number} · {current.title}
                </h2>
                <p>
                  {current.clientName} · {current.projectName}
                </p>
              </div>
              <strong>{current.status === 'DRAFT' ? 'Rascunho' : 'Finalizado'}</strong>
            </div>
            {current.status === 'DRAFT' && (
              <form
                className="planning-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void perform(() => addBudgetStage(current.id, stageName)).then(() =>
                    setStageName(''),
                  );
                }}
              >
                <label>
                  Nova etapa
                  <input
                    required
                    placeholder="Ex.: Mobilização"
                    value={stageName}
                    onChange={(e) => setStageName(e.target.value)}
                  />
                </label>
                <button disabled={pending}>Adicionar etapa</button>
              </form>
            )}
            {current.stages.map((stage) => {
              const draft = itemDraft[stage.id] ?? { compositionId: '', quantity: '1' };
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
                    </div>
                  ))}
                  {current.status === 'DRAFT' && (
                    <form
                      className="composition-line"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void perform(() =>
                          addBudgetItem(
                            current.id,
                            stage.id,
                            draft.compositionId,
                            Number(draft.quantity),
                          ),
                        );
                      }}
                    >
                      <label>
                        Composição
                        <select
                          required
                          value={draft.compositionId}
                          onChange={(e) =>
                            setItemDraft({
                              ...itemDraft,
                              [stage.id]: { ...draft, compositionId: e.target.value },
                            })
                          }
                        >
                          <option value="">Selecione</option>
                          {compositions
                            .filter((c) => c.active)
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} · {money(c.unitCost)}/{c.unitSymbol}
                              </option>
                            ))}
                        </select>
                      </label>
                      <label>
                        Quantidade
                        <input
                          required
                          min="0.0001"
                          step="0.0001"
                          type="number"
                          value={draft.quantity}
                          onChange={(e) =>
                            setItemDraft({
                              ...itemDraft,
                              [stage.id]: { ...draft, quantity: e.target.value },
                            })
                          }
                        />
                      </label>
                      <button disabled={pending}>Adicionar serviço</button>
                    </form>
                  )}
                </section>
              );
            })}
            {current.status === 'DRAFT' && (
              <button
                className="primary-button"
                disabled={pending}
                onClick={() => void perform(() => finalizeBudget(current.id))}
              >
                Finalizar e bloquear orçamento
              </button>
            )}
          </Panel>
          <Proposal budget={current} />
        </>
      )}
    </main>
  );
}

function Proposal({ budget }: { budget: Budget }) {
  const proposalColumns: DataTableColumn<Budget['stages'][number]['items'][number]>[] = [
    {
      key: 'name',
      header: 'Serviço',
      mobileLabel: 'Serviço',
      renderCell: (item) => item.name,
    },
    {
      key: 'unit',
      header: 'Un.',
      mobileLabel: 'Unidade',
      renderCell: (item) => item.unitSymbol,
    },
    {
      key: 'quantity',
      header: 'Qtd.',
      mobileLabel: 'Quantidade',
      headerClassName: 'number',
      cellClassName: 'number',
      renderCell: (item) => item.quantity,
    },
    {
      key: 'unitPrice',
      header: 'Preço unit.',
      mobileLabel: 'Preço unitário',
      headerClassName: 'number',
      cellClassName: 'number',
      renderCell: (item) => money(item.unitSalePrice),
    },
    {
      key: 'total',
      header: 'Total',
      mobileLabel: 'Total',
      headerClassName: 'number',
      cellClassName: 'number',
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
            Obra: {budget.projectName}
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
            columns={proposalColumns}
            getRowKey={(item) => item.id}
            ariaLabel={`Serviços da etapa ${stage.name}`}
            className="planning-table"
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

const money = (v: number) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v);
