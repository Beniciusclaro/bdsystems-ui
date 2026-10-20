import { useEffect, useState, type FormEvent } from 'react';
import { DataTable, type DataTableColumn } from '../../../shared/components/ui/DataTable';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { Panel } from '../../../shared/components/ui/Panel';
import {
  getMaterials,
  getMaterialSuppliers,
  getUnits,
} from '../../materials/services/materialService';
import type { Material, MaterialSupplier, UnitOfMeasure } from '../../materials/types/material';
import { getAllToolRentals } from '../../rentals/services/toolRentalService';
import type { ToolRentalResponse } from '../../rentals/types/toolRental';
import { getCompositions, getLaborRoles, saveComposition } from '../services/planningService';
import type {
  ComponentType,
  Composition,
  CompositionComponentRequest,
  LaborRole,
} from '../types/planning';
import './Planning.scss';
type Line = {
  key: string;
  type: ComponentType;
  materialId: string;
  supplierMaterialId: string;
  laborRoleId: string;
  toolRentalId: string;
  description: string;
  unitLabel: string;
  quantity: string;
  unitCost: string;
};

const empty = (type: ComponentType = 'MATERIAL'): Line => ({
  key: crypto.randomUUID(),
  type,
  materialId: '',
  supplierMaterialId: '',
  laborRoleId: '',
  toolRentalId: '',
  description: '',
  unitLabel: '',
  quantity: '1',
  unitCost: '',
});

export function CompositionPage() {
  const [rows, setRows] = useState<Composition[]>([]);

  const [materials, setMaterials] = useState<Material[]>([]);

  const [suppliers, setSuppliers] = useState<Record<string, MaterialSupplier[]>>({});

  const [units, setUnits] = useState<UnitOfMeasure[]>([]);

  const [roles, setRoles] = useState<LaborRole[]>([]);

  const [rentals, setRentals] = useState<ToolRentalResponse[]>([]);

  const [lines, setLines] = useState<Line[]>([empty()]);

  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    unitOfMeasureId: '',
    baseYield: '1',
  });

  const [error, setError] = useState('');

  const [pending, setPending] = useState(false);

  const reload = () => getCompositions().then(setRows);

  const compositionColumns: DataTableColumn<Composition>[] = [
    {
      key: 'code',
      header: 'Código',
      mobileLabel: 'Código',
      renderCell: (composition) => composition.code,
    },
    {
      key: 'name',
      header: 'Serviço',
      mobileLabel: 'Serviço',
      renderCell: (composition) => <strong>{composition.name}</strong>,
    },
    {
      key: 'unit',
      header: 'Unidade',
      mobileLabel: 'Unidade',
      renderCell: (composition) => composition.unitSymbol,
    },
    {
      key: 'unitCost',
      header: 'Custo unitário',
      mobileLabel: 'Custo unitário',
      renderCell: (composition) => money(composition.unitCost),
    },
    {
      key: 'components',
      header: 'Componentes',
      mobileLabel: 'Componentes',
      renderCell: (composition) => composition.components.length,
    },
  ];

  useEffect(() => {
    Promise.all([
      getMaterials(0, 200, { active: true }),
      getUnits(),
      getLaborRoles(),
      getAllToolRentals(),
    ])
      .then(async ([m, u, r, tr]) => {
        setMaterials(m.content);
        setUnits(u);
        setRoles(r);
        setRentals(tr);
        const entries = await Promise.all(
          m.content.map(
            async (material) => [material.id, await getMaterialSuppliers(material.id)] as const,
          ),
        );
        setSuppliers(Object.fromEntries(entries));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Falha ao carregar componentes.'));
    reload().catch(() => undefined);
  }, []);

  const change = (key: string, patch: Partial<Line>) =>
    setLines((v) => v.map((line) => (line.key === key ? { ...line, ...patch } : line)));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError('');
    try {
      const components: CompositionComponentRequest[] = lines.map((l, index) => ({
        type: l.type,
        quantity: Number(l.quantity),
        sortOrder: index,
        ...(l.type === 'MATERIAL'
          ? { materialId: l.materialId, supplierMaterialId: l.supplierMaterialId }
          : {}),
        ...(l.type === 'LABOR' ? { laborRoleId: l.laborRoleId } : {}),
        ...(l.type === 'EQUIPMENT' ? { toolRentalId: l.toolRentalId } : {}),
        ...(l.type === 'CUSTOM'
          ? { description: l.description, unitLabel: l.unitLabel, unitCost: Number(l.unitCost) }
          : {}),
      }));
      await saveComposition({
        ...form,
        baseYield: Number(form.baseYield),
        active: true,
        components,
      });
      setForm({ ...form, code: '', name: '', description: '' });
      setLines([empty()]);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao salvar composição.');
    } finally {
      setPending(false);
    }
  };
  return (
    <main className="dashboard-content planning-page">
      <PageHeader eyebrow="Orçamentos" title="Composições de serviço" />
      {error && (
        <p role="alert" className="planning-alert">
          {error}
        </p>
      )}
      <div className="planning-grid">
        <Panel className="planning-wide">
          <form className="planning-form" onSubmit={submit}>
            <div className="composition-line">
              <label>
                Código
                <input
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </label>
              <label>
                Serviço
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label>
                Unidade
                <select
                  required
                  value={form.unitOfMeasureId}
                  onChange={(e) => setForm({ ...form, unitOfMeasureId: e.target.value })}
                >
                  <option value="">Selecione</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.symbol})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Rendimento-base
                <input
                  required
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  value={form.baseYield}
                  onChange={(e) => setForm({ ...form, baseYield: e.target.value })}
                />
              </label>
            </div>
            <label>
              Descrição
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
            <h2>Componentes</h2>
            <div className="composition-lines">
              {lines.map((line) => (
                <div className="composition-line" key={line.key}>
                  <label>
                    Tipo
                    <select
                      value={line.type}
                      onChange={(e) =>
                        change(line.key, {
                          ...empty(e.target.value as ComponentType),
                          key: line.key,
                        })
                      }
                    >
                      <option value="MATERIAL">Material</option>
                      <option value="LABOR">Mão de obra</option>
                      <option value="EQUIPMENT">Equipamento</option>
                      <option value="CUSTOM">Custo adicional</option>
                    </select>
                  </label>
                  {line.type === 'MATERIAL' && (
                    <>
                      <label>
                        Material
                        <select
                          required
                          value={line.materialId}
                          onChange={(e) =>
                            change(line.key, { materialId: e.target.value, supplierMaterialId: '' })
                          }
                        >
                          <option value="">Selecione</option>
                          {materials.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Fornecedor/preço
                        <select
                          required
                          value={line.supplierMaterialId}
                          onChange={(e) => change(line.key, { supplierMaterialId: e.target.value })}
                        >
                          <option value="">Selecione</option>
                          {(suppliers[line.materialId] ?? [])
                            .filter((s) => s.referencePrice != null)
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.supplierName} · {money(s.referencePrice!)}
                              </option>
                            ))}
                        </select>
                      </label>
                    </>
                  )}
                  {line.type === 'LABOR' && (
                    <label>
                      Função
                      <select
                        required
                        value={line.laborRoleId}
                        onChange={(e) => change(line.key, { laborRoleId: e.target.value })}
                      >
                        <option value="">Selecione</option>
                        {roles
                          .filter((r) => r.active && r.currentHourlyCost != null)
                          .map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name} · {money(r.currentHourlyCost!)}/h
                            </option>
                          ))}
                      </select>
                    </label>
                  )}
                  {line.type === 'EQUIPMENT' && (
                    <label>
                      Locação
                      <select
                        required
                        value={line.toolRentalId}
                        onChange={(e) => change(line.key, { toolRentalId: e.target.value })}
                      >
                        <option value="">Selecione</option>
                        {rentals.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.rentalPeriod} · {money(r.price)}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {line.type === 'CUSTOM' && (
                    <>
                      <label>
                        Descrição
                        <input
                          required
                          value={line.description}
                          onChange={(e) => change(line.key, { description: e.target.value })}
                        />
                      </label>
                      <label>
                        Unidade
                        <input
                          required
                          value={line.unitLabel}
                          onChange={(e) => change(line.key, { unitLabel: e.target.value })}
                        />
                      </label>
                      <label>
                        Custo unitário
                        <input
                          required
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.unitCost}
                          onChange={(e) => change(line.key, { unitCost: e.target.value })}
                        />
                      </label>
                    </>
                  )}
                  <label>
                    Quantidade
                    <input
                      required
                      type="number"
                      min="0.0001"
                      step="0.0001"
                      value={line.quantity}
                      onChange={(e) => change(line.key, { quantity: e.target.value })}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setLines((v) => v.filter((x) => x.key !== line.key))}
                    disabled={lines.length === 1}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
            <div>
              <button type="button" onClick={() => setLines((v) => [...v, empty()])}>
                Adicionar componente
              </button>{' '}
              <button className="primary-button" disabled={pending}>
                Salvar composição
              </button>
            </div>
          </form>
        </Panel>
        <Panel className="planning-wide">
          <h2>Composições cadastradas</h2>
          {rows.length ? (
            <DataTable
              rows={rows}
              columns={compositionColumns}
              getRowKey={(composition) => composition.id}
              ariaLabel="Composições cadastradas"
              className="planning-table"
            />
          ) : (
            <p className="planning-empty">Nenhuma composição cadastrada.</p>
          )}
        </Panel>
      </div>
    </main>
  );
}

const money = (v: number) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v);
