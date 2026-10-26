import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { ContentState } from '../../../shared/components/ui/ContentState';
import { DataTable, type DataTableColumn } from '../../../shared/components/ui/DataTable';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { Pagination } from '../../../shared/components/ui/Pagination';
import { Panel } from '../../../shared/components/ui/Panel';
import { RegistrationDialog } from '../../../shared/components/ui/RegistrationDialog';
import { IconActionButton, RowActions } from '../../../shared/components/ui/RowActions';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import { usePaginatedResource } from '../../../shared/hooks/usePaginatedResource';
import { getEmployees } from '../../employees/services/employeeService';
import type { EmployeeResponse } from '../../employees/types/employee';
import { getLaborRolesPage, saveLaborProfile, saveLaborRole } from '../services/planningService';
import type { LaborRole, LaborRoleFilters } from '../types/planning';
import './Planning.scss';

type DialogTab = 'role' | 'cost';

const roleDefaults = {
  code: '',
  name: '',
  description: '',
  costingMode: 'MANUAL' as LaborRole['costingMode'],
  manualHourlyCost: '',
  active: true,
};

const costDefaults = {
  employeeId: '',
  productiveHoursMonth: '160',
  workDaysMonth: '22',
  employerChargesPercent: '0',
  monthlyBenefits: '0',
  otherMonthlyCosts: '0',
};

export function LaborPage() {
  const resource = usePaginatedResource<LaborRole, LaborRoleFilters>(
    getLaborRolesPage,
    { active: true },
    'Não foi possível carregar as funções de mão de obra.',
  );

  const [draft, setDraft] = useState({ search: '', active: 'true' });

  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);

  const [employeeError, setEmployeeError] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);

  const [dialogTab, setDialogTab] = useState<DialogTab>('role');

  const [editingRole, setEditingRole] = useState<LaborRole | null>(null);

  const [roleForm, setRoleForm] = useState(roleDefaults);

  const [costForm, setCostForm] = useState(costDefaults);

  const [statusTarget, setStatusTarget] = useState<LaborRole | null>(null);

  const [pending, setPending] = useState(false);

  const [formError, setFormError] = useState('');

  const [dialogSuccess, setDialogSuccess] = useState('');

  const [success, setSuccess] = useState('');

  const hasFilters = Boolean(resource.filters.search || resource.filters.active !== true);

  useEffect(() => {
    let active = true;

    getEmployees(0, 200, { status: 'ACTIVE' })
      .then((result) => {
        if (active) setEmployees(result.content);
      })
      .catch((cause: unknown) => {
        if (active) {
          setEmployeeError(
            cause instanceof Error ? cause.message : 'Não foi possível carregar os funcionários.',
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const clear = () => {
    setDraft({ search: '', active: 'true' });
    resource.applyFilters({ active: true });
  };

  const openRole = (role?: LaborRole) => {
    setEditingRole(role ?? null);
    setRoleForm(
      role
        ? {
            code: role.code,
            name: role.name,
            description: role.description ?? '',
            costingMode: role.costingMode,
            manualHourlyCost: role.manualHourlyCost == null ? '' : String(role.manualHourlyCost),
            active: role.active,
          }
        : roleDefaults,
    );
    setCostForm(costDefaults);
    setDialogTab('role');
    setFormError('');
    setDialogSuccess('');
    setSuccess('');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (!pending) setDialogOpen(false);
  };

  const switchDialogTab = (nextTab: DialogTab) => {
    setDialogTab(nextTab);
    setFormError('');
    setDialogSuccess('');
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

    event.preventDefault();

    const nextTab: DialogTab = dialogTab === 'role' ? 'cost' : 'role';

    switchDialogTab(nextTab);
    document.getElementById(`labor-dialog-${nextTab}-tab`)?.focus();
  };

  const submitRole = async (event: FormEvent) => {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setFormError('');
    setDialogSuccess('');

    try {
      const saved = await saveLaborRole(
        {
          code: roleForm.code,
          name: roleForm.name,
          description: roleForm.description,
          costingMode: roleForm.costingMode,
          manualHourlyCost:
            roleForm.costingMode === 'MANUAL' ? Number(roleForm.manualHourlyCost) : null,
          active: roleForm.active,
        },
        editingRole?.id,
      );

      setEditingRole(saved);
      setRoleForm({
        code: saved.code,
        name: saved.name,
        description: saved.description ?? '',
        costingMode: saved.costingMode,
        manualHourlyCost: saved.manualHourlyCost == null ? '' : String(saved.manualHourlyCost),
        active: saved.active,
      });
      setDialogSuccess('Função salva. Agora pode adicionar um custo por funcionário.');
      resource.refresh();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Não foi possível salvar a função.');
    } finally {
      setPending(false);
    }
  };

  const submitCost = async (event: FormEvent) => {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setFormError('');
    setDialogSuccess('');

    try {
      let targetRole = editingRole;

      if (!targetRole) {
        if (!roleForm.code.trim() || !roleForm.name.trim()) {
          throw new Error('Preencha o código e a função antes de adicionar o custo.');
        }

        if (roleForm.costingMode === 'MANUAL' && !roleForm.manualHourlyCost) {
          throw new Error('Informe o custo por hora antes de adicionar o custo do funcionário.');
        }

        targetRole = await saveLaborRole({
          code: roleForm.code,
          name: roleForm.name,
          description: roleForm.description,
          costingMode: roleForm.costingMode,
          manualHourlyCost:
            roleForm.costingMode === 'MANUAL' ? Number(roleForm.manualHourlyCost) : null,
          active: roleForm.active,
        });
        setEditingRole(targetRole);
      }

      await saveLaborProfile(costForm.employeeId, {
        laborRoleId: targetRole.id,
        productiveHoursMonth: Number(costForm.productiveHoursMonth),
        workDaysMonth: costForm.workDaysMonth ? Number(costForm.workDaysMonth) : null,
        employerChargesPercent: Number(costForm.employerChargesPercent),
        monthlyBenefits: Number(costForm.monthlyBenefits),
        otherMonthlyCosts: Number(costForm.otherMonthlyCosts),
      });
      setCostForm(costDefaults);
      setDialogSuccess('Custo por funcionário adicionado à função.');
      resource.refresh();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Não foi possível adicionar o custo.');
    } finally {
      setPending(false);
    }
  };

  const toggleRole = async () => {
    if (!statusTarget || pending) return;

    setPending(true);
    setFormError('');

    try {
      await saveLaborRole(
        {
          code: statusTarget.code,
          name: statusTarget.name,
          description: statusTarget.description ?? '',
          costingMode: statusTarget.costingMode,
          manualHourlyCost: statusTarget.manualHourlyCost,
          active: !statusTarget.active,
        },
        statusTarget.id,
      );
      setSuccess(
        `Função ${statusTarget.active ? 'removida da listagem ativa' : 'ativada'} com sucesso.`,
      );
      setStatusTarget(null);
      resource.refresh();
    } catch (cause) {
      setFormError(
        cause instanceof Error ? cause.message : 'Não foi possível alterar o status da função.',
      );
    } finally {
      setPending(false);
    }
  };

  const columns: DataTableColumn<LaborRole>[] = [
    { key: 'code', header: 'Código', mobileLabel: 'Código', renderCell: (row) => row.code },
    {
      key: 'name',
      header: 'Função',
      mobileLabel: 'Função',
      renderCell: (row) => <strong>{row.name}</strong>,
    },
    {
      key: 'mode',
      header: 'Modo',
      mobileLabel: 'Modo',
      renderCell: (row) =>
        row.costingMode === 'MANUAL' ? 'Custo manual' : 'Média dos funcionários',
    },
    {
      key: 'eligible',
      header: 'Funcionários',
      mobileLabel: 'Funcionários',
      renderCell: (row) => row.eligibleEmployees,
    },
    {
      key: 'cost',
      header: 'Custo atual',
      mobileLabel: 'Custo atual',
      renderCell: (row) =>
        row.currentHourlyCost == null ? 'Sem custo' : `${money(row.currentHourlyCost)}/h`,
    },
    {
      key: 'status',
      header: 'Status',
      mobileLabel: 'Status',
      renderCell: (row) => (
        <StatusBadge tone={row.active ? 'success' : 'neutral'}>
          {row.active ? 'Ativa' : 'Inativa'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      mobileLabel: 'Ações',
      renderCell: (row) => (
        <RowActions>
          <IconActionButton
            label={`Editar ${row.name}`}
            variant="accent"
            onClick={() => openRole(row)}
          >
            <Pencil aria-hidden="true" />
          </IconActionButton>
          {row.active ? (
            <IconActionButton
              label={`Remover ${row.name}`}
              variant="danger"
              onClick={() => {
                setFormError('');
                setStatusTarget(row);
              }}
            >
              <Trash2 aria-hidden="true" />
            </IconActionButton>
          ) : (
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setFormError('');
                setStatusTarget(row);
              }}
            >
              Ativar
            </button>
          )}
        </RowActions>
      ),
    },
  ];

  return (
    <main className="dashboard-content planning-page labor-page">
      <PageHeader
        eyebrow="Planeamento"
        title="Mão de obra"
        action={
          <span>
            {resource.totalElements} {resource.totalElements === 1 ? 'função' : 'funções'}
          </span>
        }
      />

      {success ? (
        <p className="message success" role="status">
          {success}
        </p>
      ) : null}

      <Panel labelledBy="labor-roles-heading">
        <div className="planning-list-heading">
          <div>
            <h2 id="labor-roles-heading">Funções de mão de obra</h2>
            <p>Gerencie as funções e os custos por funcionário usados nas composições.</p>
          </div>
          <button type="button" className="primary-button" onClick={() => openRole()}>
            Nova função
          </button>
        </div>

        <form
          className="planning-filters"
          aria-label="Filtros de funções"
          onSubmit={(event) => {
            event.preventDefault();
            resource.applyFilters({
              search: draft.search.trim() || undefined,
              active: draft.active === '' ? undefined : draft.active === 'true',
            });
          }}
        >
          <label>
            Código ou função
            <input
              type="search"
              value={draft.search}
              onChange={(event) => setDraft({ ...draft, search: event.target.value })}
            />
          </label>
          <label>
            Status
            <select
              value={draft.active}
              onChange={(event) => setDraft({ ...draft, active: event.target.value })}
            >
              <option value="true">Ativas</option>
              <option value="false">Inativas</option>
              <option value="">Todas</option>
            </select>
          </label>
          <button className="primary-button">Buscar</button>
          {(hasFilters || draft.search || draft.active !== 'true') && (
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
          <ContentState variant="loading" title="Carregando funções..." />
        ) : resource.rows.length === 0 ? (
          <ContentState
            variant={hasFilters ? 'no-results' : 'empty'}
            title={hasFilters ? 'Nenhuma função encontrada' : 'Nenhuma função ativa'}
            action={
              hasFilters ? (
                <button className="text-button" onClick={clear}>
                  Limpar filtros
                </button>
              ) : (
                <button className="primary-button" onClick={() => openRole()}>
                  Cadastrar função
                </button>
              )
            }
          />
        ) : (
          <DataTable
            rows={resource.rows}
            columns={columns}
            getRowKey={(row) => row.id}
            ariaLabel="Funções de mão de obra"
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
            ariaLabel="Paginação de funções"
          />
        ) : null}
      </Panel>

      <RegistrationDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        kind="labor"
        eyebrow="Mão de obra"
        title={editingRole ? `Editar ${editingRole.name}` : 'Nova função'}
        isSubmitting={pending}
      >
        <div className="planning-tabs" role="tablist" aria-label="Cadastro da função">
          <button
            id="labor-dialog-role-tab"
            type="button"
            role="tab"
            aria-selected={dialogTab === 'role'}
            aria-controls="labor-dialog-role-panel"
            tabIndex={dialogTab === 'role' ? 0 : -1}
            onClick={() => switchDialogTab('role')}
            onKeyDown={handleTabKeyDown}
          >
            Função de mão de obra
          </button>
          <button
            id="labor-dialog-cost-tab"
            type="button"
            role="tab"
            aria-selected={dialogTab === 'cost'}
            aria-controls="labor-dialog-cost-panel"
            tabIndex={dialogTab === 'cost' ? 0 : -1}
            onClick={() => switchDialogTab('cost')}
            onKeyDown={handleTabKeyDown}
          >
            Custo por funcionário
          </button>
        </div>

        {dialogSuccess ? (
          <p className="message success" role="status">
            {dialogSuccess}
          </p>
        ) : null}
        {formError ? (
          <p className="message error" role="alert">
            {formError}
          </p>
        ) : null}

        {dialogTab === 'role' ? (
          <form
            id="labor-dialog-role-panel"
            className="planning-form"
            role="tabpanel"
            aria-labelledby="labor-dialog-role-tab"
            onSubmit={submitRole}
          >
            <label>
              Código
              <input
                required
                value={roleForm.code}
                onChange={(event) => setRoleForm({ ...roleForm, code: event.target.value })}
              />
            </label>
            <label>
              Função
              <input
                required
                value={roleForm.name}
                onChange={(event) => setRoleForm({ ...roleForm, name: event.target.value })}
              />
            </label>
            <label>
              Descrição
              <textarea
                rows={3}
                value={roleForm.description}
                onChange={(event) => setRoleForm({ ...roleForm, description: event.target.value })}
              />
            </label>
            <label>
              Modo de cálculo
              <select
                value={roleForm.costingMode}
                onChange={(event) =>
                  setRoleForm({
                    ...roleForm,
                    costingMode: event.target.value as LaborRole['costingMode'],
                  })
                }
              >
                <option value="MANUAL">Custo/hora manual</option>
                <option value="EMPLOYEE_AVERAGE">Média dos funcionários</option>
              </select>
            </label>
            {roleForm.costingMode === 'MANUAL' ? (
              <NumberField
                label="Custo por hora"
                value={roleForm.manualHourlyCost}
                onChange={(value) => setRoleForm({ ...roleForm, manualHourlyCost: value })}
              />
            ) : null}
            <button className="primary-button" disabled={pending}>
              {pending ? 'Salvando...' : 'Salvar função'}
            </button>
          </form>
        ) : (
          <form
            id="labor-dialog-cost-panel"
            className="planning-form"
            role="tabpanel"
            aria-labelledby="labor-dialog-cost-tab"
            onSubmit={submitCost}
          >
            <p className="planning-dialog-help">
              {editingRole
                ? `Adicione o custo de um funcionário à função ${editingRole.name}.`
                : 'Preencha os dados da função na outra aba. Ao adicionar o custo, a função será salva automaticamente.'}
            </p>
            {employeeError ? (
              <p className="message error" role="alert">
                {employeeError}
              </p>
            ) : null}
            <label>
              Funcionário
              <select
                required
                value={costForm.employeeId}
                onChange={(event) => setCostForm({ ...costForm, employeeId: event.target.value })}
              >
                <option value="">Selecione</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.employeeNumber} · {employee.fullName}
                  </option>
                ))}
              </select>
            </label>
            <NumberField
              label="Horas produtivas/mês"
              value={costForm.productiveHoursMonth}
              min="0.01"
              onChange={(value) => setCostForm({ ...costForm, productiveHoursMonth: value })}
            />
            <NumberField
              label="Dias trabalhados/mês"
              value={costForm.workDaysMonth}
              required={false}
              onChange={(value) => setCostForm({ ...costForm, workDaysMonth: value })}
            />
            <NumberField
              label="Encargos (%)"
              value={costForm.employerChargesPercent}
              onChange={(value) => setCostForm({ ...costForm, employerChargesPercent: value })}
            />
            <NumberField
              label="Benefícios mensais"
              value={costForm.monthlyBenefits}
              onChange={(value) => setCostForm({ ...costForm, monthlyBenefits: value })}
            />
            <NumberField
              label="Outros custos mensais"
              value={costForm.otherMonthlyCosts}
              onChange={(value) => setCostForm({ ...costForm, otherMonthlyCosts: value })}
            />
            <button
              className="primary-button"
              disabled={pending || Boolean(employeeError) || employees.length === 0}
            >
              {pending ? 'Adicionando...' : 'Adicionar custo'}
            </button>
          </form>
        )}
      </RegistrationDialog>

      {statusTarget ? (
        <ConfirmDialog
          open
          title={`${statusTarget.active ? 'Remover' : 'Ativar'} função?`}
          description={`${statusTarget.name} ficará ${statusTarget.active ? 'indisponível' : 'disponível'} para as composições.`}
          onOpenChange={(open) => {
            if (!open && !pending) setStatusTarget(null);
          }}
          onConfirm={toggleRole}
          confirmLabel={statusTarget.active ? 'Remover função' : 'Ativar função'}
          confirmingLabel="Salvando..."
          isConfirming={pending}
          error={formError}
        />
      ) : null}
    </main>
  );
}

interface NumberFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  required?: boolean;
}

function NumberField({ label, value, onChange, min = '0', required = true }: NumberFieldProps) {
  return (
    <label>
      {label}
      <input
        required={required}
        type="number"
        min={min}
        step="0.01"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

const money = (value: number) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
