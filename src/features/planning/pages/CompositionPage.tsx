import { useEffect, useState, type FormEvent } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { ContentState } from '../../../shared/components/ui/ContentState';
import { DataTable, type DataTableColumn } from '../../../shared/components/ui/DataTable';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { Panel } from '../../../shared/components/ui/Panel';
import { Pagination } from '../../../shared/components/ui/Pagination';
import { RegistrationDialog } from '../../../shared/components/ui/RegistrationDialog';
import { IconActionButton, RowActions } from '../../../shared/components/ui/RowActions';
import { usePaginatedResource } from '../../../shared/hooks/usePaginatedResource';
import {
  getMaterials,
  getMaterialSuppliers,
  getUnits,
} from '../../materials/services/materialService';
import type { Material, MaterialSupplier, UnitOfMeasure } from '../../materials/types/material';
import { getAllToolRentals } from '../../rentals/services/toolRentalService';
import type { ToolRentalResponse } from '../../rentals/types/toolRental';
import { CompositionDetailsDialog } from '../components/CompositionDetailsDialog';
import {
  getCompositionsPage,
  getLaborRoles,
  saveComposition,
  setCompositionStatus,
} from '../services/planningService';
import type {
  ComponentType,
  Composition,
  CompositionComponentRequest,
  CompositionFilters,
  LaborRole,
} from '../types/planning';
import './Planning.scss';
import './CompositionPage.scss';

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

const initialForm = {
  code: '',
  name: '',
  description: '',
  unitOfMeasureId: '',
  baseYield: '1',
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
  const resource = usePaginatedResource<Composition, CompositionFilters>(
    getCompositionsPage,
    { active: true },
    'Falha ao carregar composições.',
  );

  const [filterDraft, setFilterDraft] = useState({ search: '', active: 'true' });

  const [materials, setMaterials] = useState<Material[]>([]);

  const [suppliers, setSuppliers] = useState<Record<string, MaterialSupplier[]>>({});

  const [units, setUnits] = useState<UnitOfMeasure[]>([]);

  const [roles, setRoles] = useState<LaborRole[]>([]);

  const [rentals, setRentals] = useState<ToolRentalResponse[]>([]);

  const [lines, setLines] = useState<Line[]>([empty()]);

  const [form, setForm] = useState(initialForm);

  const [dialogOpen, setDialogOpen] = useState(false);

  const [editingComposition, setEditingComposition] = useState<Composition | null>(null);

  const [selectedComposition, setSelectedComposition] = useState<Composition | null>(null);

  const [compositionToDelete, setCompositionToDelete] = useState<Composition | null>(null);

  const [catalogError, setCatalogError] = useState('');

  const [formError, setFormError] = useState('');

  const [success, setSuccess] = useState('');

  const [pending, setPending] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getMaterials(0, 200, { active: true }),
      getUnits(),
      getLaborRoles(),
      getAllToolRentals(),
    ])
      .then(async ([materialPage, loadedUnits, loadedRoles, toolRentals]) => {
        setMaterials(materialPage.content);
        setUnits(loadedUnits);
        setRoles(loadedRoles);
        setRentals(toolRentals);

        const entries = await Promise.all(
          materialPage.content.map(
            async (material) => [material.id, await getMaterialSuppliers(material.id)] as const,
          ),
        );

        setSuppliers(Object.fromEntries(entries));
      })
      .catch((error) => {
        setCatalogError(
          error instanceof Error ? error.message : 'Falha ao carregar dados do cadastro.',
        );
      });
  }, []);

  const change = (key: string, patch: Partial<Line>) => {
    setLines((currentLines) =>
      currentLines.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  };

  const resetRegistration = () => {
    setForm(initialForm);
    setLines([empty()]);
    setFormError('');
    setEditingComposition(null);
  };

  const handleDialogChange = (open: boolean) => {
    if (pending) return;

    setDialogOpen(open);

    if (!open) resetRegistration();
  };

  const openRegistration = (composition?: Composition) => {
    setSuccess('');
    setFormError('');

    if (composition) {
      setEditingComposition(composition);
      setForm({
        code: composition.code,
        name: composition.name,
        description: composition.description ?? '',
        unitOfMeasureId: composition.unitOfMeasureId,
        baseYield: String(composition.baseYield),
      });
      setLines(
        composition.components
          .slice()
          .sort((first, second) => first.sortOrder - second.sortOrder)
          .map((component) => {
            const line = empty(component.type);

            if (component.type === 'MATERIAL') {
              const materialEntry = Object.entries(suppliers).find(([, materialSuppliers]) =>
                materialSuppliers.some((supplier) => supplier.id === component.referenceId),
              );

              line.materialId = materialEntry?.[0] ?? '';
              line.supplierMaterialId = component.referenceId ?? '';
            }

            if (component.type === 'LABOR') line.laborRoleId = component.referenceId ?? '';
            if (component.type === 'EQUIPMENT') line.toolRentalId = component.referenceId ?? '';

            if (component.type === 'CUSTOM') {
              line.description = component.description;
              line.unitLabel = component.unitLabel;
              line.unitCost = String(component.unitCost);
            }

            line.quantity = String(component.quantity);
            return line;
          }),
      );
    } else {
      resetRegistration();
    }

    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!compositionToDelete) return;

    const composition = compositionToDelete;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await setCompositionStatus(composition.id, false);
      setSelectedComposition(null);
      setCompositionToDelete(null);
      setSuccess('Composição excluída da listagem ativa.');
      resource.refresh();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Falha ao excluir composição.');
    } finally {
      setIsDeleting(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setFormError('');

    try {
      const components: CompositionComponentRequest[] = lines.map((line, index) => ({
        type: line.type,
        quantity: Number(line.quantity),
        sortOrder: index,
        ...(line.type === 'MATERIAL'
          ? { materialId: line.materialId, supplierMaterialId: line.supplierMaterialId }
          : {}),
        ...(line.type === 'LABOR' ? { laborRoleId: line.laborRoleId } : {}),
        ...(line.type === 'EQUIPMENT' ? { toolRentalId: line.toolRentalId } : {}),
        ...(line.type === 'CUSTOM'
          ? {
              description: line.description,
              unitLabel: line.unitLabel,
              unitCost: Number(line.unitCost),
            }
          : {}),
      }));

      await saveComposition(
        {
          ...form,
          baseYield: Number(form.baseYield),
          active: true,
          components,
        },
        editingComposition?.id,
      );

      const wasEditing = Boolean(editingComposition);
      resetRegistration();
      setDialogOpen(false);
      setSuccess(
        wasEditing ? 'Composição atualizada com sucesso.' : 'Composição cadastrada com sucesso.',
      );
      resource.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Falha ao salvar composição.');
    } finally {
      setPending(false);
    }
  };

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
    {
      key: 'actions',
      header: 'Ações',
      mobileLabel: 'Ações',
      headerClassName: 'composition-actions-heading',
      cellClassName: 'composition-actions-cell',
      renderCell: (composition) => (
        <RowActions>
          <IconActionButton
            label={`Editar ${composition.name}`}
            variant="accent"
            onClick={() => openRegistration(composition)}
          >
            <Pencil aria-hidden="true" />
          </IconActionButton>

          <IconActionButton
            label={`Excluir ${composition.name}`}
            variant="danger"
            onClick={() => {
              setDeleteError(null);
              setCompositionToDelete(composition);
            }}
            disabled={isDeleting && compositionToDelete?.id === composition.id}
          >
            <Trash2 aria-hidden="true" />
          </IconActionButton>
        </RowActions>
      ),
    },
  ];

  return (
    <section className="dashboard-content composition-list-page">
      <PageHeader
        eyebrow="Orçamentos"
        title="Composições de serviço"
        action={
          <span className="composition-total">
            {resource.totalElements} {resource.totalElements === 1 ? 'composição' : 'composições'}
          </span>
        }
      />

      {success && (
        <p role="status" className="message success">
          {success}
        </p>
      )}

      <Panel className="composition-list-card" labelledBy="composition-list-heading">
        <div className="composition-list-heading">
          <div>
            <h2 id="composition-list-heading">Lista de composições</h2>
            <p>Consulte os serviços e os custos que podem ser aplicados aos orçamentos.</p>
          </div>

          <span aria-live="polite">
            {resource.rows.length}{' '}
            {resource.rows.length === 1 ? 'item nesta página' : 'itens nesta página'}
          </span>
        </div>

        <form
          className="planning-filters"
          aria-label="Filtros de composições"
          onSubmit={(event) => {
            event.preventDefault();
            resource.applyFilters({
              search: filterDraft.search.trim() || undefined,
              active: filterDraft.active === '' ? undefined : filterDraft.active === 'true',
            });
          }}
        >
          <label>
            Código ou serviço
            <input
              type="search"
              value={filterDraft.search}
              onChange={(event) => setFilterDraft({ ...filterDraft, search: event.target.value })}
            />
          </label>
          <label>
            Situação
            <select
              value={filterDraft.active}
              onChange={(event) => setFilterDraft({ ...filterDraft, active: event.target.value })}
            >
              <option value="true">Ativas</option>
              <option value="false">Inativas</option>
              <option value="">Todas</option>
            </select>
          </label>
          <button className="primary-button">Buscar</button>
          {(resource.filters.search ||
            resource.filters.active !== true ||
            filterDraft.search ||
            filterDraft.active !== 'true') && (
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setFilterDraft({ search: '', active: 'true' });
                resource.applyFilters({ active: true });
              }}
            >
              Limpar filtros
            </button>
          )}
        </form>

        {resource.error ? (
          <ContentState
            variant="error"
            title={resource.error}
            action={
              <button type="button" className="text-button" onClick={resource.refresh}>
                Tentar novamente
              </button>
            }
          />
        ) : resource.isLoading ? (
          <ContentState variant="loading" title="Carregando composições..." />
        ) : resource.rows.length === 0 ? (
          <ContentState
            variant={
              resource.filters.search || resource.filters.active !== true ? 'no-results' : 'empty'
            }
            title={
              resource.filters.search || resource.filters.active !== true
                ? 'Nenhuma composição encontrada'
                : 'Nenhuma composição ativa'
            }
            description={
              resource.filters.search || resource.filters.active !== true
                ? undefined
                : 'Cadastre uma composição para reunir materiais, mão de obra e equipamentos.'
            }
            action={
              <button type="button" className="primary-button" onClick={() => openRegistration()}>
                Nova composição
              </button>
            }
          />
        ) : (
          <DataTable
            rows={resource.rows}
            columns={compositionColumns}
            getRowKey={(composition) => composition.id}
            getRowLabel={(composition) => `Abrir detalhes de ${composition.name}`}
            onRowActivate={setSelectedComposition}
            ariaLabel="Lista de composições"
            className="composition-table"
          />
        )}
        {!resource.isLoading && !resource.error && resource.rows.length > 0 ? (
          <Pagination
            currentPage={resource.page}
            totalPages={resource.totalPages}
            pageSize={resource.pageSize}
            pageSizeOptions={[10, 20, 50]}
            onPageChange={resource.goToPage}
            onPageSizeChange={resource.changePageSize}
            ariaLabel="Paginação de composições"
          />
        ) : null}
      </Panel>

      <button type="button" className="list-create-fab" onClick={() => openRegistration()}>
        <span aria-hidden="true">+</span>
        Cadastrar composição
      </button>

      <RegistrationDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        kind="composition"
        eyebrow="Orçamentos"
        title={editingComposition ? 'Editar composição' : 'Cadastrar composição'}
        isSubmitting={pending}
      >
        {catalogError && (
          <p role="alert" className="planning-alert">
            {catalogError}
          </p>
        )}

        {formError && (
          <p role="alert" className="planning-alert">
            {formError}
          </p>
        )}

        <form className="planning-form composition-registration-form" onSubmit={submit}>
          <div className="composition-fields">
            <label>
              Código
              <input
                required
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value })}
              />
            </label>

            <label>
              Serviço
              <input
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </label>

            <label>
              Unidade
              <select
                required
                value={form.unitOfMeasureId}
                onChange={(event) => setForm({ ...form, unitOfMeasureId: event.target.value })}
              >
                <option value="">Selecione</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name} ({unit.symbol})
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
                onChange={(event) => setForm({ ...form, baseYield: event.target.value })}
              />
            </label>
          </div>

          <label>
            Descrição
            <textarea
              rows={3}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </label>

          <div className="composition-components-heading">
            <div>
              <h2>Componentes</h2>
              <p>Informe os recursos e as quantidades necessários para executar o serviço.</p>
            </div>
          </div>

          <div className="composition-lines">
            {lines.map((line, index) => (
              <fieldset className="composition-line" key={line.key}>
                <legend>Componente {index + 1}</legend>

                <label>
                  Tipo
                  <select
                    value={line.type}
                    onChange={(event) =>
                      change(line.key, {
                        ...empty(event.target.value as ComponentType),
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
                        onChange={(event) =>
                          change(line.key, {
                            materialId: event.target.value,
                            supplierMaterialId: '',
                          })
                        }
                      >
                        <option value="">Selecione</option>
                        {materials.map((material) => (
                          <option key={material.id} value={material.id}>
                            {material.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Fornecedor/preço
                      <select
                        required
                        value={line.supplierMaterialId}
                        onChange={(event) =>
                          change(line.key, { supplierMaterialId: event.target.value })
                        }
                      >
                        <option value="">Selecione</option>
                        {(suppliers[line.materialId] ?? [])
                          .filter((supplier) => supplier.referencePrice != null)
                          .map((supplier) => (
                            <option key={supplier.id} value={supplier.id}>
                              {supplier.supplierName} · {money(supplier.referencePrice!)}
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
                      onChange={(event) => change(line.key, { laborRoleId: event.target.value })}
                    >
                      <option value="">Selecione</option>
                      {roles
                        .filter((role) => role.active && role.currentHourlyCost != null)
                        .map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name} · {money(role.currentHourlyCost!)}/h
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
                      onChange={(event) => change(line.key, { toolRentalId: event.target.value })}
                    >
                      <option value="">Selecione</option>
                      {rentals.map((rental) => (
                        <option key={rental.id} value={rental.id}>
                          {rental.rentalPeriod} · {money(rental.price)}
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
                        onChange={(event) => change(line.key, { description: event.target.value })}
                      />
                    </label>

                    <label>
                      Unidade
                      <input
                        required
                        value={line.unitLabel}
                        onChange={(event) => change(line.key, { unitLabel: event.target.value })}
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
                        onChange={(event) => change(line.key, { unitCost: event.target.value })}
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
                    onChange={(event) => change(line.key, { quantity: event.target.value })}
                  />
                </label>

                <button
                  type="button"
                  onClick={() =>
                    setLines((currentLines) =>
                      currentLines.filter((currentLine) => currentLine.key !== line.key),
                    )
                  }
                  disabled={lines.length === 1}
                >
                  Remover
                </button>
              </fieldset>
            ))}
          </div>

          <button
            type="button"
            className="secondary-button composition-add-component"
            onClick={() => setLines((current) => [...current, empty()])}
          >
            + Adicionar componente
          </button>

          <div className="composition-form-actions">
            <button type="button" onClick={() => handleDialogChange(false)} disabled={pending}>
              Cancelar
            </button>

            <button className="primary-button" disabled={pending || Boolean(catalogError)}>
              {pending
                ? 'Salvando...'
                : editingComposition
                  ? 'Salvar alterações'
                  : 'Salvar composição'}
            </button>
          </div>
        </form>
      </RegistrationDialog>

      <CompositionDetailsDialog
        composition={selectedComposition}
        onClose={() => setSelectedComposition(null)}
      />

      {compositionToDelete ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open && !isDeleting) {
              setCompositionToDelete(null);
              setDeleteError(null);
            }
          }}
          eyebrow="Confirmar exclusão"
          title="Excluir composição?"
          description={
            <>
              <strong>{compositionToDelete.name}</strong> será removida das listagens e não poderá
              ser usada em novos orçamentos. Os orçamentos existentes serão preservados.
            </>
          }
          error={deleteError}
          isConfirming={isDeleting}
          confirmLabel="Excluir composição"
          confirmingLabel="Excluindo..."
          onConfirm={confirmDelete}
        />
      ) : null}
    </section>
  );
}

const money = (value: number) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
