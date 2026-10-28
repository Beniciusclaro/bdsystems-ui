import { Panel } from '../../../shared/components/ui/Panel';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { useMemo, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { ContentState } from '../../../shared/components/ui/ContentState';
import { DataTable } from '../../../shared/components/ui/DataTable';
import type { DataTableColumn } from '../../../shared/components/ui/DataTable';
import { IconActionButton, RowActions } from '../../../shared/components/ui/RowActions';
import { Pagination } from '../../../shared/components/ui/Pagination';
import { StatusBadge } from '../../../shared/components/ui/StatusBadge';
import {
  deleteEmployee,
  getEmployees,
  resendEmployeeInvitation,
} from '../services/employeeService';
import type { EmployeeFilters, EmployeeResponse, EmployeeStatus } from '../types/employee';
import { EmployeeDetailsDialog } from '../components/EmployeeDetailsDialog';
import {
  formatDate,
  formatEmployeeValue,
  getStatusLabel,
  getStatusTone,
  getUserAccessLabel,
  getUserAccessTone,
  isEmployeeStatus,
  statusLabels,
} from '../presentation';
import { usePaginatedResource } from '../../../shared/hooks/usePaginatedResource';
import './EmployeeListPage.scss';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function EmployeeListPage() {
  const navigate = useNavigate();

  const {
    rows: employees,
    totalElements,
    totalPages,
    page,
    pageSize,
    filters: appliedFilters,
    isLoading,
    error,
    applyFilters,
    goToPage,
    changePageSize,
    refresh,
  } = usePaginatedResource<EmployeeResponse, EmployeeFilters>(
    getEmployees,
    {},
    'Não foi possível carregar os funcionários.',
  );

  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | ''>('');

  const [positionFilter, setPositionFilter] = useState('');

  const [departmentFilter, setDepartmentFilter] = useState('');

  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeResponse | null>(null);

  const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(null);

  const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeResponse | null>(null);

  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [invitationFeedback, setInvitationFeedback] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);

  const [resendingEmployeeId, setResendingEmployeeId] = useState<string | null>(null);

  const positions = useMemo(
    () =>
      [
        ...new Set(employees.flatMap((employee) => (employee.position ? [employee.position] : []))),
      ].sort((a, b) => a.localeCompare(b, 'pt')),
    [employees],
  );

  const departments = useMemo(
    () =>
      [
        ...new Set(
          employees.flatMap((employee) => (employee.department ? [employee.department] : [])),
        ),
      ].sort((a, b) => a.localeCompare(b, 'pt')),
    [employees],
  );

  const clearFilters = () => {
    setStatusFilter('');
    setPositionFilter('');
    setDepartmentFilter('');
    applyFilters({});
  };

  const searchEmployees = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyFilters({
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(positionFilter.trim() ? { position: positionFilter.trim() } : {}),
      ...(departmentFilter.trim() ? { department: departmentFilter.trim() } : {}),
    });
  };

  const refreshEmployees = refresh;

  const retryLoading = refresh;

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
          <span className="employee-meta">
            {formatEmployeeValue(employee.employeeNumber)} · {employee.email}
          </span>
        </>
      ),
    },
    {
      key: 'position',
      header: 'Cargo',
      mobileLabel: 'Cargo',
      renderCell: (employee) => formatEmployeeValue(employee.position),
    },
    {
      key: 'department',
      header: 'Departamento',
      mobileLabel: 'Departamento',
      renderCell: (employee) => formatEmployeeValue(employee.department),
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
      key: 'access',
      header: 'Acesso',
      mobileLabel: 'Acesso',
      renderCell: (employee) => (
        <StatusBadge tone={getUserAccessTone(employee.userAccessStatus)}>
          {getUserAccessLabel(employee.userAccessStatus, employee.userRole)}
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
          {employee.userAccessStatus === 'PENDING' || employee.userAccessStatus === 'EXPIRED' ? (
            <IconActionButton
              label={`Reenviar convite para ${employee.fullName}`}
              variant="accent"
              onClick={() => void handleResendInvitation(employee)}
              disabled={resendingEmployeeId === employee.id}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                <path d="M21 12a9 9 0 0 1-15.2 6.5L3 16" />
                <path d="M3 21v-5h5" />
                <path d="M3 12A9 9 0 0 1 18.2 5.5L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
            </IconActionButton>
          ) : null}
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

  const handleResendInvitation = async (employee: EmployeeResponse) => {
    setInvitationFeedback(null);
    setResendingEmployeeId(employee.id);

    try {
      await resendEmployeeInvitation(employee.id);
      setInvitationFeedback({
        tone: 'success',
        message: `Convite reenviado para ${employee.email}.`,
      });
      refreshEmployees();
    } catch (requestError) {
      setInvitationFeedback({
        tone: 'error',
        message:
          requestError instanceof Error
            ? requestError.message
            : 'Não foi possível reenviar o convite.',
      });
    } finally {
      setResendingEmployeeId(null);
    }
  };

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
        goToPage(page - 1);
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

  return (
    <section className="dashboard-content employee-list-page">
      <PageHeader
        eyebrow="Equipe"
        title="Funcionários"
        action={
          <span className="employee-total">
            {totalElements} {totalElements === 1 ? 'funcionário' : 'funcionários'}
          </span>
        }
      />

      <Panel className="employee-list-card" labelledBy="employee-list-heading">
        {invitationFeedback ? (
          <div
            className={`message ${invitationFeedback.tone} employee-invitation-feedback`}
            role={invitationFeedback.tone === 'error' ? 'alert' : 'status'}
          >
            {invitationFeedback.message}
          </div>
        ) : null}

        <div className="employee-list-heading">
          <div>
            <h2 id="employee-list-heading">Lista de funcionários</h2>
          </div>
          <span className="employee-page-count" aria-live="polite">
            {employees.length} {employees.length === 1 ? 'funcionário' : 'funcionários'} nesta
            página
          </span>
        </div>

        <form
          className="employee-filters"
          aria-label="Filtros de funcionários"
          onSubmit={searchEmployees}
        >
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
                <option key={value} value={value}>
                  {label}
                </option>
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
              {positions.map((position) => (
                <option key={position} value={position} />
              ))}
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
              {departments.map((department) => (
                <option key={department} value={department} />
              ))}
            </datalist>
          </label>
          <button type="submit" className="primary-button employee-search-filters">
            Buscar
          </button>
          <button
            type="button"
            className="text-button employee-clear-filters"
            onClick={clearFilters}
          >
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
            action={
              <button type="button" className="text-button" onClick={retryLoading}>
                Tentar novamente
              </button>
            }
          />
        ) : employees.length === 0 &&
          totalElements === 0 &&
          Object.keys(appliedFilters).length === 0 ? (
          <ContentState
            variant="empty"
            title="Nenhum funcionário cadastrado"
            description="Cadastre um funcionário para começar a montar sua equipe."
            action={
              <Link to="/employees/new" className="primary-button">
                Cadastrar funcionário
              </Link>
            }
            className="employee-list-state"
          />
        ) : employees.length === 0 ? (
          <ContentState
            variant="no-results"
            title="Nenhum funcionário encontrado"
            description="Altere os filtros ou limpe a busca para ver outros funcionários."
            action={
              <button type="button" className="secondary-button" onClick={clearFilters}>
                Limpar busca
              </button>
            }
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
      </Panel>
      <Link to="/employees/new" className="employee-create-fab">
        <span aria-hidden="true">+</span>
        Cadastrar funcionário
      </Link>

      <Outlet context={{ refreshEmployees, employees, isLoading }} />

      <EmployeeDetailsDialog
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
      />

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
          description={
            <>
              Você está prestes a excluir <strong>{employeeToDelete.fullName}</strong>. Essa ação é
              permanente e não pode ser desfeita.
            </>
          }
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
    </section>
  );
}
