import { useState, type FormEvent, type KeyboardEvent } from 'react';
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
import {
  getLaborProfiles,
  getLaborRolesPage,
  saveLaborProfile,
  saveLaborRole,
} from '../services/planningService';
import type {
  LaborCostProfile,
  LaborCostProfileFilters,
  LaborRole,
  LaborRoleFilters,
} from '../types/planning';
import './Planning.scss';

type Tab = 'profiles' | 'roles';
const profileDefaults = {
  employeeId: '',
  laborRoleId: '',
  productiveHoursMonth: '160',
  workDaysMonth: '22',
  employerChargesPercent: '0',
  monthlyBenefits: '0',
  otherMonthlyCosts: '0',
};

const roleDefaults = {
  code: '',
  name: '',
  description: '',
  costingMode: 'MANUAL' as LaborRole['costingMode'],
  manualHourlyCost: '',
  active: true,
};

export function LaborPage() {
  const [tab, setTab] = useState<Tab>('profiles');

  const profiles = usePaginatedResource<LaborCostProfile, LaborCostProfileFilters>(
    getLaborProfiles,
    {},
    'Não foi possível carregar os custos por funcionário.',
  );

  const roles = usePaginatedResource<LaborRole, LaborRoleFilters>(
    getLaborRolesPage,
    { active: true },
    'Não foi possível carregar as funções de mão de obra.',
  );

  const [profileDraft, setProfileDraft] = useState({ search: '', configured: '' });

  const [roleDraft, setRoleDraft] = useState({ search: '', active: 'true' });

  const [profileForm, setProfileForm] = useState(profileDefaults);

  const [roleForm, setRoleForm] = useState(roleDefaults);

  const [profileDialog, setProfileDialog] = useState(false);

  const [roleDialog, setRoleDialog] = useState(false);

  const [editingRole, setEditingRole] = useState<LaborRole | null>(null);

  const [statusTarget, setStatusTarget] = useState<LaborRole | null>(null);

  const [pending, setPending] = useState(false);

  const [formError, setFormError] = useState('');

  const [success, setSuccess] = useState('');

  const activeRoles = roles.rows.filter((role) => role.active);

  const profileHasFilters = Boolean(
    profiles.filters.search || profiles.filters.configured !== undefined,
  );

  const roleHasFilters = Boolean(roles.filters.search || roles.filters.active !== true);

  const selectTab = (next: Tab) => {
    setTab(next);
    setSuccess('');
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      selectTab(tab === 'profiles' ? 'roles' : 'profiles');
      document
        .getElementById(tab === 'profiles' ? 'labor-roles-tab' : 'labor-profiles-tab')
        ?.focus();
    }
  };

  const editProfile = (profile: LaborCostProfile) => {
    setFormError('');
    setProfileForm({
      employeeId: profile.employeeId,
      laborRoleId: profile.laborRoleId ?? '',
      productiveHoursMonth: String(profile.productiveHoursMonth ?? 160),
      workDaysMonth: String(profile.workDaysMonth ?? 22),
      employerChargesPercent: String(profile.employerChargesPercent ?? 0),
      monthlyBenefits: String(profile.monthlyBenefits ?? 0),
      otherMonthlyCosts: String(profile.otherMonthlyCosts ?? 0),
    });
    setProfileDialog(true);
  };

  const editRole = (role?: LaborRole) => {
    setFormError('');
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
    setRoleDialog(true);
  };

  const submitProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setFormError('');
    try {
      await saveLaborProfile(profileForm.employeeId, {
        laborRoleId: profileForm.laborRoleId,
        productiveHoursMonth: Number(profileForm.productiveHoursMonth),
        workDaysMonth: profileForm.workDaysMonth ? Number(profileForm.workDaysMonth) : null,
        employerChargesPercent: Number(profileForm.employerChargesPercent),
        monthlyBenefits: Number(profileForm.monthlyBenefits),
        otherMonthlyCosts: Number(profileForm.otherMonthlyCosts),
      });
      setProfileDialog(false);
      setSuccess('Custo do funcionário atualizado com sucesso.');
      profiles.refresh();
      roles.refresh();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Não foi possível salvar o custo.');
    } finally {
      setPending(false);
    }
  };

  const submitRole = async (event: FormEvent) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setFormError('');
    try {
      await saveLaborRole(
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
      setRoleDialog(false);
      setSuccess(editingRole ? 'Função atualizada com sucesso.' : 'Função cadastrada com sucesso.');
      roles.refresh();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Não foi possível salvar a função.');
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
      setSuccess(`Função ${statusTarget.active ? 'desativada' : 'ativada'} com sucesso.`);
      setStatusTarget(null);
      roles.refresh();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Não foi possível alterar a função.');
    } finally {
      setPending(false);
    }
  };

  const profileColumns: DataTableColumn<LaborCostProfile>[] = [
    {
      key: 'number',
      header: 'Número',
      mobileLabel: 'Número',
      renderCell: (row) => row.employeeNumber,
    },
    {
      key: 'employee',
      header: 'Funcionário',
      mobileLabel: 'Funcionário',
      renderCell: (row) => <strong>{row.employeeName}</strong>,
    },
    { key: 'position', header: 'Cargo', mobileLabel: 'Cargo', renderCell: (row) => row.position },
    {
      key: 'payment',
      header: 'Pagamento',
      mobileLabel: 'Pagamento',
      renderCell: (row) =>
        row.paymentAmount == null
          ? 'Não informado'
          : `${paymentLabels[row.paymentMethod ?? 'MONTHLY']} · ${money(row.paymentAmount)}`,
    },
    {
      key: 'role',
      header: 'Função',
      mobileLabel: 'Função',
      renderCell: (row) => row.laborRoleName ?? 'Não vinculada',
    },
    {
      key: 'cost',
      header: 'Custo/h',
      mobileLabel: 'Custo/h',
      renderCell: (row) => (row.effectiveHourlyCost == null ? '—' : money(row.effectiveHourlyCost)),
    },
    {
      key: 'status',
      header: 'Status',
      mobileLabel: 'Status',
      renderCell: (row) => (
        <StatusBadge tone={row.configured ? 'success' : 'warning'}>
          {row.configured ? 'Configurado' : 'Não configurado'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      mobileLabel: 'Ações',
      renderCell: (row) => (
        <button type="button" className="text-button" onClick={() => editProfile(row)}>
          {row.configured ? 'Editar' : 'Configurar'}
        </button>
      ),
    },
  ];

  const roleColumns: DataTableColumn<LaborRole>[] = [
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
      renderCell: (row) => (row.costingMode === 'MANUAL' ? 'Manual' : 'Média dos funcionários'),
    },
    {
      key: 'eligible',
      header: 'Elegíveis',
      mobileLabel: 'Elegíveis',
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
            onClick={() => editRole(row)}
          >
            <span aria-hidden="true">✎</span>
          </IconActionButton>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setFormError('');
              setStatusTarget(row);
            }}
          >
            {row.active ? 'Desativar' : 'Ativar'}
          </button>
        </RowActions>
      ),
    },
  ];

  return (
    <main className="dashboard-content planning-page labor-page">
      <PageHeader eyebrow="Planeamento" title="Mão de obra" />
      {success ? (
        <p className="message success" role="status">
          {success}
        </p>
      ) : null}
      <div className="labor-tabs" role="tablist" aria-label="Gestão de mão de obra">
        <button
          id="labor-profiles-tab"
          role="tab"
          aria-selected={tab === 'profiles'}
          aria-controls="labor-profiles-panel"
          tabIndex={tab === 'profiles' ? 0 : -1}
          onClick={() => selectTab('profiles')}
          onKeyDown={onTabKeyDown}
        >
          Custos por funcionário
        </button>
        <button
          id="labor-roles-tab"
          role="tab"
          aria-selected={tab === 'roles'}
          aria-controls="labor-roles-panel"
          tabIndex={tab === 'roles' ? 0 : -1}
          onClick={() => selectTab('roles')}
          onKeyDown={onTabKeyDown}
        >
          Funções de mão de obra
        </button>
      </div>
      {tab === 'profiles' ? (
        <Panel
          id="labor-profiles-panel"
          role="tabpanel"
          aria-labelledby="labor-profiles-tab"
          labelledBy="labor-profiles-heading"
        >
          <div className="planning-list-heading">
            <div>
              <h2 id="labor-profiles-heading">Custos por funcionário</h2>
              <p>Configure os custos de todos os funcionários ativos.</p>
            </div>
            <span>{profiles.totalElements} funcionários</span>
          </div>
          {!roles.isLoading && activeRoles.length === 0 ? (
            <p className="message warning" role="status">
              Cadastre ou ative uma função de mão de obra antes de configurar funcionários.
            </p>
          ) : null}
          <form
            className="planning-filters"
            aria-label="Filtros de custos por funcionário"
            onSubmit={(event) => {
              event.preventDefault();
              profiles.applyFilters({
                search: profileDraft.search.trim() || undefined,
                configured:
                  profileDraft.configured === '' ? undefined : profileDraft.configured === 'true',
              });
            }}
          >
            <label>
              Nome ou número
              <input
                type="search"
                value={profileDraft.search}
                onChange={(event) =>
                  setProfileDraft({ ...profileDraft, search: event.target.value })
                }
              />
            </label>
            <label>
              Status
              <select
                value={profileDraft.configured}
                onChange={(event) =>
                  setProfileDraft({ ...profileDraft, configured: event.target.value })
                }
              >
                <option value="">Todos</option>
                <option value="true">Configurados</option>
                <option value="false">Não configurados</option>
              </select>
            </label>
            <button className="primary-button">Buscar</button>
            {(profileHasFilters || profileDraft.search || profileDraft.configured) && (
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setProfileDraft({ search: '', configured: '' });
                  profiles.applyFilters({});
                }}
              >
                Limpar filtros
              </button>
            )}
          </form>
          {profiles.error ? (
            <ContentState
              variant="error"
              title={profiles.error}
              action={
                <button className="text-button" onClick={profiles.refresh}>
                  Tentar novamente
                </button>
              }
            />
          ) : profiles.isLoading ? (
            <ContentState variant="loading" title="Carregando funcionários..." />
          ) : profiles.rows.length === 0 ? (
            <ContentState
              variant={profileHasFilters ? 'no-results' : 'empty'}
              title={
                profileHasFilters ? 'Nenhum funcionário encontrado' : 'Nenhum funcionário ativo'
              }
            />
          ) : (
            <DataTable
              rows={profiles.rows}
              columns={profileColumns}
              getRowKey={(row) => row.employeeId}
              ariaLabel="Custos por funcionário"
            />
          )}
          {!profiles.isLoading && !profiles.error && profiles.rows.length > 0 ? (
            <Pagination
              currentPage={profiles.page}
              totalPages={profiles.totalPages}
              pageSize={profiles.pageSize}
              pageSizeOptions={[10, 20, 50]}
              onPageChange={profiles.goToPage}
              onPageSizeChange={profiles.changePageSize}
              ariaLabel="Paginação de custos por funcionário"
            />
          ) : null}
        </Panel>
      ) : (
        <Panel
          id="labor-roles-panel"
          role="tabpanel"
          aria-labelledby="labor-roles-tab"
          labelledBy="labor-roles-heading"
        >
          <div className="planning-list-heading">
            <div>
              <h2 id="labor-roles-heading">Funções de mão de obra</h2>
              <p>Gerencie as funções usadas nas composições.</p>
            </div>
            <button className="primary-button" onClick={() => editRole()}>
              Nova função
            </button>
          </div>
          <form
            className="planning-filters"
            aria-label="Filtros de funções"
            onSubmit={(event) => {
              event.preventDefault();
              roles.applyFilters({
                search: roleDraft.search.trim() || undefined,
                active: roleDraft.active === '' ? undefined : roleDraft.active === 'true',
              });
            }}
          >
            <label>
              Código ou função
              <input
                type="search"
                value={roleDraft.search}
                onChange={(event) => setRoleDraft({ ...roleDraft, search: event.target.value })}
              />
            </label>
            <label>
              Status
              <select
                value={roleDraft.active}
                onChange={(event) => setRoleDraft({ ...roleDraft, active: event.target.value })}
              >
                <option value="true">Ativas</option>
                <option value="false">Inativas</option>
                <option value="">Todas</option>
              </select>
            </label>
            <button className="primary-button">Buscar</button>
            {(roleHasFilters || roleDraft.search || roleDraft.active !== 'true') && (
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setRoleDraft({ search: '', active: 'true' });
                  roles.applyFilters({ active: true });
                }}
              >
                Limpar filtros
              </button>
            )}
          </form>
          {roles.error ? (
            <ContentState
              variant="error"
              title={roles.error}
              action={
                <button className="text-button" onClick={roles.refresh}>
                  Tentar novamente
                </button>
              }
            />
          ) : roles.isLoading ? (
            <ContentState variant="loading" title="Carregando funções..." />
          ) : roles.rows.length === 0 ? (
            <ContentState
              variant={roleHasFilters ? 'no-results' : 'empty'}
              title={roleHasFilters ? 'Nenhuma função encontrada' : 'Nenhuma função ativa'}
              action={
                !roleHasFilters ? (
                  <button className="primary-button" onClick={() => editRole()}>
                    Cadastrar função
                  </button>
                ) : undefined
              }
            />
          ) : (
            <DataTable
              rows={roles.rows}
              columns={roleColumns}
              getRowKey={(row) => row.id}
              ariaLabel="Funções de mão de obra"
            />
          )}
          {!roles.isLoading && !roles.error && roles.rows.length > 0 ? (
            <Pagination
              currentPage={roles.page}
              totalPages={roles.totalPages}
              pageSize={roles.pageSize}
              pageSizeOptions={[10, 20, 50]}
              onPageChange={roles.goToPage}
              onPageSizeChange={roles.changePageSize}
              ariaLabel="Paginação de funções"
            />
          ) : null}
        </Panel>
      )}
      <RegistrationDialog
        open={profileDialog}
        onOpenChange={(open) => !pending && setProfileDialog(open)}
        kind="labor"
        eyebrow="Mão de obra"
        title="Configurar custo do funcionário"
        isSubmitting={pending}
      >
        <form className="planning-form" onSubmit={submitProfile}>
          {formError ? (
            <p className="message error" role="alert">
              {formError}
            </p>
          ) : null}
          <label>
            Função
            <select
              required
              value={profileForm.laborRoleId}
              onChange={(event) =>
                setProfileForm({ ...profileForm, laborRoleId: event.target.value })
              }
            >
              <option value="">Selecione</option>
              {activeRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.code} · {role.name}
                </option>
              ))}
            </select>
          </label>
          <NumberField
            label="Horas produtivas/mês"
            value={profileForm.productiveHoursMonth}
            onChange={(value) => setProfileForm({ ...profileForm, productiveHoursMonth: value })}
            min="0.01"
          />
          <NumberField
            label="Dias trabalhados/mês"
            value={profileForm.workDaysMonth}
            onChange={(value) => setProfileForm({ ...profileForm, workDaysMonth: value })}
            required={false}
          />
          <NumberField
            label="Encargos (%)"
            value={profileForm.employerChargesPercent}
            onChange={(value) => setProfileForm({ ...profileForm, employerChargesPercent: value })}
          />
          <NumberField
            label="Benefícios mensais"
            value={profileForm.monthlyBenefits}
            onChange={(value) => setProfileForm({ ...profileForm, monthlyBenefits: value })}
          />
          <NumberField
            label="Outros custos mensais"
            value={profileForm.otherMonthlyCosts}
            onChange={(value) => setProfileForm({ ...profileForm, otherMonthlyCosts: value })}
          />
          <button className="primary-button" disabled={pending || activeRoles.length === 0}>
            {pending ? 'Salvando...' : 'Salvar configuração'}
          </button>
        </form>
      </RegistrationDialog>
      <RegistrationDialog
        open={roleDialog}
        onOpenChange={(open) => !pending && setRoleDialog(open)}
        kind="labor"
        eyebrow="Mão de obra"
        title={editingRole ? 'Editar função' : 'Nova função'}
        isSubmitting={pending}
      >
        <form className="planning-form" onSubmit={submitRole}>
          {formError ? (
            <p className="message error" role="alert">
              {formError}
            </p>
          ) : null}
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
              value={roleForm.description}
              onChange={(event) => setRoleForm({ ...roleForm, description: event.target.value })}
            />
          </label>
          <label>
            Modo
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
      </RegistrationDialog>
      {statusTarget ? (
        <ConfirmDialog
          open
          title={`${statusTarget.active ? 'Desativar' : 'Ativar'} função?`}
          description={`${statusTarget.name} ficará ${statusTarget.active ? 'indisponível' : 'disponível'} para as composições.`}
          onOpenChange={(open) => !open && !pending && setStatusTarget(null)}
          onConfirm={toggleRole}
          confirmLabel={statusTarget.active ? 'Desativar função' : 'Ativar função'}
          confirmingLabel="Salvando..."
          isConfirming={pending}
          error={formError}
        />
      ) : null}
    </main>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min = '0',
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  required?: boolean;
}) {
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
const paymentLabels = { MONTHLY: 'Mensal', WEEKLY: 'Semanal', DAILY: 'Diário', HOURLY: 'Hora' };

const money = (value: number) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
