import { useCallback, useEffect, useState, type FormEvent } from 'react';
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
import {
  getLaborReferencePositions,
  getLaborRolesPage,
  saveLaborRole,
} from '../services/planningService';
import type { LaborRole, LaborRoleFilters } from '../types/planning';
import './Planning.scss';

const roleDefaults = {
  code: '',
  name: '',
  description: '',
  costingMode: 'MANUAL' as LaborRole['costingMode'],
  referencePosition: '',
  manualHourlyCost: '',
  active: true,
};

export function LaborPage() {
  const resource = usePaginatedResource<LaborRole, LaborRoleFilters>(
    getLaborRolesPage,
    { active: true },
    'Não foi possível carregar as funções de mão de obra.',
  );

  const [draft, setDraft] = useState({ search: '', active: 'true' });

  const [referencePositions, setReferencePositions] = useState<string[]>([]);

  const [positionsLoading, setPositionsLoading] = useState(true);

  const [positionsError, setPositionsError] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);

  const [editingRole, setEditingRole] = useState<LaborRole | null>(null);

  const [roleForm, setRoleForm] = useState(roleDefaults);

  const [statusTarget, setStatusTarget] = useState<LaborRole | null>(null);

  const [pending, setPending] = useState(false);

  const [formError, setFormError] = useState('');

  const [dialogSuccess, setDialogSuccess] = useState('');

  const [success, setSuccess] = useState('');

  const hasFilters = Boolean(resource.filters.search || resource.filters.active !== true);

  const loadReferencePositions = useCallback(() => {
    let active = true;

    setPositionsLoading(true);
    setPositionsError('');
    getLaborReferencePositions()
      .then((result) => {
        if (active) setReferencePositions(result);
      })
      .catch((cause: unknown) => {
        if (active) {
          setPositionsError(
            cause instanceof Error ? cause.message : 'Não foi possível carregar os cargos.',
          );
        }
      })
      .finally(() => {
        if (active) setPositionsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    getLaborReferencePositions()
      .then((result) => {
        if (active) setReferencePositions(result);
      })
      .catch((cause: unknown) => {
        if (active) {
          setPositionsError(
            cause instanceof Error ? cause.message : 'Não foi possível carregar os cargos.',
          );
        }
      })
      .finally(() => {
        if (active) setPositionsLoading(false);
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
            referencePosition: role.referencePosition ?? '',
            manualHourlyCost: role.manualHourlyCost == null ? '' : String(role.manualHourlyCost),
            active: role.active,
          }
        : roleDefaults,
    );
    setFormError('');
    setDialogSuccess('');
    setSuccess('');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (!pending) setDialogOpen(false);
  };

  const submitRole = async (event: FormEvent) => {
    event.preventDefault();
    if (pending) return;

    setFormError('');
    setDialogSuccess('');

    const referencePosition = roleForm.referencePosition.trim();

    if (roleForm.costingMode === 'EMPLOYEE_AVERAGE' && !referencePosition) {
      setFormError('Selecione o cargo de referência.');
      return;
    }

    if (roleForm.costingMode === 'MANUAL' && !roleForm.manualHourlyCost) {
      setFormError('Informe o custo por hora.');
      return;
    }

    setPending(true);

    try {
      const saved = await saveLaborRole(
        {
          code: roleForm.code,
          name: roleForm.name,
          description: roleForm.description,
          costingMode: roleForm.costingMode,
          referencePosition: roleForm.costingMode === 'EMPLOYEE_AVERAGE' ? referencePosition : null,
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
        referencePosition: saved.referencePosition ?? '',
        manualHourlyCost: saved.manualHourlyCost == null ? '' : String(saved.manualHourlyCost),
        active: saved.active,
      });
      setDialogSuccess('Função salva com sucesso.');
      resource.refresh();
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
          referencePosition: statusTarget.referencePosition,
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
      key: 'referencePosition',
      header: 'Cargo de referência',
      mobileLabel: 'Cargo de referência',
      renderCell: (row) => row.referencePosition ?? '—',
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
            <p>Gerencie as funções e os custos por hora usados nas composições.</p>
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

        <form className="planning-form" onSubmit={submitRole}>
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
              onChange={(event) => {
                const costingMode = event.target.value as LaborRole['costingMode'];

                setFormError('');
                setRoleForm({
                  ...roleForm,
                  costingMode,
                  referencePosition:
                    costingMode === 'EMPLOYEE_AVERAGE' ? roleForm.referencePosition : '',
                  manualHourlyCost: costingMode === 'MANUAL' ? roleForm.manualHourlyCost : '',
                });
              }}
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
          ) : (
            <div className="planning-reference-position">
              <label>
                Cargo de referência
                <select
                  required
                  value={roleForm.referencePosition}
                  disabled={positionsLoading || Boolean(positionsError)}
                  aria-describedby="labor-reference-position-help"
                  onChange={(event) =>
                    setRoleForm({ ...roleForm, referencePosition: event.target.value })
                  }
                >
                  <option value="">
                    {positionsLoading ? 'Carregando cargos...' : 'Selecione um cargo'}
                  </option>
                  {referencePositions.map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              </label>
              {positionsLoading ? (
                <p
                  id="labor-reference-position-help"
                  className="planning-dialog-help"
                  role="status"
                >
                  Carregando cargos elegíveis...
                </p>
              ) : positionsError ? (
                <div id="labor-reference-position-help" className="planning-inline-feedback">
                  <p className="message error" role="alert">
                    {positionsError}
                  </p>
                  <button type="button" className="text-button" onClick={loadReferencePositions}>
                    Tentar novamente
                  </button>
                </div>
              ) : referencePositions.length === 0 ? (
                <p id="labor-reference-position-help" className="planning-dialog-help">
                  Nenhum cargo elegível. Cadastre um funcionário de campo sem acesso ao sistema, com
                  cargo e pagamento preenchidos.
                </p>
              ) : (
                <p id="labor-reference-position-help" className="planning-dialog-help">
                  O custo/hora será a média atual dos funcionários elegíveis neste cargo.
                </p>
              )}
            </div>
          )}
          <button
            className="primary-button"
            disabled={
              pending ||
              (roleForm.costingMode === 'EMPLOYEE_AVERAGE' &&
                (positionsLoading || Boolean(positionsError) || referencePositions.length === 0))
            }
          >
            {pending ? 'Salvando...' : 'Salvar função'}
          </button>
        </form>
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
