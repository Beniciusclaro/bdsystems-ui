import { useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/sidebar/Sidebar';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ContentState } from '../components/ui/ContentState';
import { DataTable } from '../components/ui/DataTable';
import type { DataTableColumn } from '../components/ui/DataTable';
import { DetailsDialog } from '../components/ui/DetailsDialog';
import { IconActionButton, RowActions } from '../components/ui/RowActions';
import { Pagination } from '../components/ui/Pagination';
import { StatusBadge } from '../components/ui/StatusBadge';
import { clearAuthToken, getAuthToken } from '../lib/session';
import { deleteEmployee, getEmployees } from '../services/employeeService';
import type { EmployeeFilters, EmployeeResponse, EmployeeStatus } from '../types/employee';
import './EmployeeListPage.scss';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const statusLabels: Record<EmployeeStatus, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  TERMINATED: 'Desligado',
  LEASED: 'Alocado',
};

const statusTones: Record<EmployeeStatus, 'success' | 'warning' | 'danger' | 'info'> = {
  ACTIVE: 'success',
  INACTIVE: 'warning',
  TERMINATED: 'danger',
  LEASED: 'info',
};

const paymentMethodLabels = {
  MONTHLY: 'Mensal',
  WEEKLY: 'Semanal',
  DAILY: 'Diário',
  HOURLY: 'Hora',
} as const;

function getStatusLabel(status: EmployeeStatus | null): string {
  return status ? statusLabels[status] : 'Não informado';
}

function getStatusTone(status: EmployeeStatus | null) {
  return status ? statusTones[status] : 'neutral';
}

function isEmployeeStatus(value: string): value is EmployeeStatus {
  return Object.prototype.hasOwnProperty.call(statusLabels, value);
}

function formatDate(value: string | null): string {
  if (!value) {
    return '—';
  }

  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

export function EmployeeListPage() {
  const navigate = useNavigate();
  const token = getAuthToken();
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | ''>('');
  const [positionFilter, setPositionFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<EmployeeFilters>({});
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeResponse | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    let ignore = false;

    getEmployees(page, pageSize, appliedFilters)
      .then((result) => {
        if (!ignore) {
          setEmployees(result.content);
          setTotalElements(result.page.totalElements);
          setTotalPages(result.page.totalPages);
        }
      })
      .catch((requestError: unknown) => {
        if (!ignore) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Não foi possível carregar os funcionários.',
          );
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [appliedFilters, navigate, page, pageSize, reloadCount, token]);

  const handleLogout = () => {
    clearAuthToken();
    navigate('/login');
  };

  const positions = useMemo(
    () => [...new Set(employees.map((employee) => employee.position))].sort((a, b) => a.localeCompare(b, 'pt')),
    [employees],
  );
  const departments = useMemo(
    () => [...new Set(employees.map((employee) => employee.department))].sort((a, b) => a.localeCompare(b, 'pt')),
    [employees],
  );

  const clearFilters = () => {
    setStatusFilter('');
    setPositionFilter('');
    setDepartmentFilter('');
    setAppliedFilters({});
    setError(null);
    setIsLoading(true);
    setPage(0);
  };

  const searchEmployees = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const filters: EmployeeFilters = {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(positionFilter.trim() ? { position: positionFilter.trim() } : {}),
      ...(departmentFilter.trim() ? { department: departmentFilter.trim() } : {}),
    };

    setError(null);
    setIsLoading(true);
    setAppliedFilters(filters);
    setPage(0);
  };

  const goToPage = (nextPage: number) => {
    setError(null);
    setIsLoading(true);
    setPage(nextPage);
  };

  const changePageSize = (nextPageSize: number) => {
    setError(null);
    setIsLoading(true);
    setPageSize(nextPageSize);
    setPage(0);
  };

  const retryLoading = () => {
    setError(null);
    setIsLoading(true);
    setReloadCount((current) => current + 1);
  };

  const refreshEmployees = () => {
    setError(null);
    setIsLoading(true);
    setReloadCount((current) => current + 1);
  };

  const employeeColumns: DataTableColumn<EmployeeResponse>[] = [
    {
      key: 'employee',
      header: 'Funcionário',
      mobileLabel: 'Funcionário',
      renderCell: (employee) => (
        <>
          <button
            type="button"
            className="employee-name employee-detail-trigger"
            aria-label={`Ver detalhes de ${employee.fullName}`}
            onClick={() => setSelectedEmployee(employee)}
          >
            {employee.fullName}
          </button>
          <span className="employee-meta">{employee.employeeNumber} · {employee.email}</span>
        </>
      ),
    },
    {
      key: 'position',
      header: 'Cargo',
      mobileLabel: 'Cargo',
      renderCell: (employee) => employee.position,
    },
    {
      key: 'department',
      header: 'Departamento',
      mobileLabel: 'Departamento',
      renderCell: (employee) => employee.department,
    },
    {
      key: 'admissionDate',
      header: 'Admissão',
      mobileLabel: 'Admissão',
      renderCell: (employee) => formatDate(employee.admissionDate),
    },
    {
      key: 'status',
      header: 'Status',
      mobileLabel: 'Status',
      renderCell: (employee) => (
        <StatusBadge tone={getStatusTone(employee.status)}>
          {getStatusLabel(employee.status)}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      mobileLabel: 'Ações',
      headerClassName: 'employee-actions-heading',
      cellClassName: 'employee-actions-cell',
      renderCell: (employee) => (
        <RowActions>
          <IconActionButton
            label={`Editar ${employee.fullName}`}
            variant="accent"
            onClick={() => navigate(`/employees/${employee.id}/edit`)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path d="M12 20h9" />
              <path d="m16.5 3.5 4 4L9 19l-5 1 1-5L16.5 3.5Z" />
            </svg>
          </IconActionButton>
          <IconActionButton
            label={`Excluir ${employee.fullName}`}
            variant="danger"
            onClick={() => {
              setDeleteError(null);
              setEmployeeToDelete(employee);
            }}
            disabled={deletingEmployeeId === employee.id}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18" />
              <path d="M8 6V4h8v2" />
              <path d="m19 6-1 14H6L5 6" />
              <path d="M10 11v5M14 11v5" />
            </svg>
          </IconActionButton>
        </RowActions>
      ),
    },
  ];

  const handleConfirmDeleteEmployee = async () => {
    if (!employeeToDelete) {
      return;
    }

    const employee = employeeToDelete;
    setDeleteError(null);
    setDeletingEmployeeId(employee.id);

    try {
      await deleteEmployee(employee.id);
      setEmployeeToDelete(null);
      setSelectedEmployee(null);

      if (employees.length === 1 && page > 0) {
        setPage(page - 1);
      }

      refreshEmployees();
    } catch (requestError: unknown) {
      setDeleteError(
        requestError instanceof Error
          ? requestError.message
          : 'Não foi possível excluir o funcionário.',
      );
    } finally {
      setDeletingEmployeeId(null);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <main className="dashboard-page employee-list-page">
      <Sidebar onLogout={handleLogout} />

      <section className="dashboard-content">
        <header className="topbar">
          <div>
            <p className="dashboard-eyebrow">Equipe</p>
            <h1>Funcionários</h1>
          </div>
          <span className="employee-total">
            {totalElements} {totalElements === 1 ? 'funcionário' : 'funcionários'}
          </span>
        </header>

        <section className="panel-card employee-list-card" aria-labelledby="employee-list-heading">
          <div className="employee-list-heading">
            <div>
              <h2 id="employee-list-heading">Lista de funcionários</h2>
            </div>
            <span className="employee-page-count" aria-live="polite">
              {employees.length} {employees.length === 1 ? 'funcionário' : 'funcionários'} nesta página
            </span>
          </div>

          <form className="employee-filters" aria-label="Filtros de funcionários" onSubmit={searchEmployees}>
            <label>
              Status
              <select
                value={statusFilter}
                onChange={(event) => {
                  const { value } = event.target;
                  setStatusFilter(isEmployeeStatus(value) ? value : '');
                }}
              >
                <option value="">Todos os status</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label>
              Cargo
              <input
                type="search"
                list="employee-position-options"
                value={positionFilter}
                onChange={(event) => setPositionFilter(event.target.value)}
                placeholder="Todos os cargos"
              />
              <datalist id="employee-position-options">
                {positions.map((position) => <option key={position} value={position} />)}
              </datalist>
            </label>
            <label>
              Departamento
              <input
                type="search"
                list="employee-department-options"
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
                placeholder="Todos os departamentos"
              />
              <datalist id="employee-department-options">
                {departments.map((department) => <option key={department} value={department} />)}
              </datalist>
            </label>
            <button type="submit" className="primary-button employee-search-filters">
              Buscar
            </button>
            <button type="button" className="text-button employee-clear-filters" onClick={clearFilters}>
              Limpar filtros
            </button>
          </form>

          {isLoading ? (
            <ContentState
              variant="loading"
              title="Carregando funcionários..."
              className="employee-list-state"
            />
          ) : error ? (
            <ContentState
              variant="error"
              title={error}
              action={(
                <button type="button" className="text-button" onClick={retryLoading}>
                  Tentar novamente
                </button>
              )}
            />
          ) : employees.length === 0 && totalElements === 0 &&
            Object.keys(appliedFilters).length === 0 ? (
            <ContentState
              variant="empty"
              title="Nenhum funcionário cadastrado"
              description="Cadastre um funcionário para começar a montar sua equipe."
              action={<Link to="/employees/new" className="primary-button">Cadastrar funcionário</Link>}
              className="employee-list-state"
            />
          ) : employees.length === 0 ? (
            <ContentState
              variant="no-results"
              title="Nenhum funcionário encontrado"
              description="Altere os filtros ou limpe a busca para ver outros funcionários."
              action={(
                <button type="button" className="secondary-button" onClick={clearFilters}>
                  Limpar busca
                </button>
              )}
              className="employee-list-state"
            />
          ) : (
            <DataTable
              rows={employees}
              columns={employeeColumns}
              getRowKey={(employee) => employee.id}
              getRowLabel={(employee) => `Abrir detalhes de ${employee.fullName}`}
              onRowActivate={setSelectedEmployee}
              ariaLabel="Lista de funcionários"
              className="employee-table"
              wrapperClassName="employee-table-wrap"
            />
          )}

          {!isLoading && !error && employees.length > 0 ? (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageChange={goToPage}
              onPageSizeChange={changePageSize}
              ariaLabel="Paginação da lista de funcionários"
              className="employee-list-controls"
            />
          ) : null}
        </section>
      </section>

      <Link to="/employees/new" className="employee-create-fab">
        <span aria-hidden="true">+</span>
        Cadastrar funcionário
      </Link>

      <Outlet context={{ refreshEmployees, employees, isLoading }} />

      <DetailsDialog
        open={Boolean(selectedEmployee)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedEmployee(null);
          }
        }}
        eyebrow="Detalhes do funcionário"
        heading={selectedEmployee?.fullName ?? ''}
      >
        {selectedEmployee ? (
          <dl className="employee-details-grid">
            <div><dt>Matrícula</dt><dd>{selectedEmployee.employeeNumber}</dd></div>
            <div><dt>Status</dt><dd>{getStatusLabel(selectedEmployee.status)}</dd></div>
            <div><dt>Email</dt><dd>{selectedEmployee.email}</dd></div>
            <div><dt>Telefone</dt><dd>{selectedEmployee.phoneNumber || '—'}</dd></div>
            <div><dt>Documento</dt><dd>{selectedEmployee.documentNumber || '—'}</dd></div>
            <div><dt>Data de nascimento</dt><dd>{formatDate(selectedEmployee.birthDate)}</dd></div>
            <div><dt>Cargo</dt><dd>{selectedEmployee.position}</dd></div>
            <div><dt>Departamento</dt><dd>{selectedEmployee.department}</dd></div>
            <div><dt>Admissão</dt><dd>{formatDate(selectedEmployee.admissionDate)}</dd></div>
            <div><dt>Forma de pagamento</dt><dd>{selectedEmployee.paymentMethod ? paymentMethodLabels[selectedEmployee.paymentMethod] : '—'}</dd></div>
            <div><dt>Valor</dt><dd>{selectedEmployee.paymentAmount == null ? '—' : selectedEmployee.paymentAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</dd></div>
            <div><dt>Desligamento</dt><dd>{formatDate(selectedEmployee.terminationDate)}</dd></div>
            <div className="employee-address-detail">
              <dt>Endereço</dt>
              <dd>
                {selectedEmployee.address.street}, {selectedEmployee.address.city} —{' '}
                {selectedEmployee.address.state}, {selectedEmployee.address.zipCode}
              </dd>
            </div>
          </dl>
        ) : null}
      </DetailsDialog>

      {employeeToDelete ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open && !deletingEmployeeId) {
              setEmployeeToDelete(null);
              setDeleteError(null);
            }
          }}
          eyebrow="Confirmar exclusão"
          title="Excluir funcionário?"
          description={(
            <>
              Você está prestes a excluir <strong>{employeeToDelete.fullName}</strong>.
              Essa ação é permanente e não pode ser desfeita.
            </>
          )}
          error={deleteError}
          isConfirming={Boolean(deletingEmployeeId)}
          confirmLabel="Excluir funcionário"
          confirmingLabel="Excluindo..."
          onConfirm={handleConfirmDeleteEmployee}
        >
          <div className="employee-delete-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 8v5" />
              <path d="M12 17h.01" />
              <path d="M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3l-7.6-13.1a2 2 0 0 0-3.4 0Z" />
            </svg>
          </div>
        </ConfirmDialog>
      ) : null}
    </main>
  );
}
