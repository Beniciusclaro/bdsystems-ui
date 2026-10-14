import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/sidebar/Sidebar';
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

const paymentMethodLabels = {
  MONTHLY: 'Mensal',
  WEEKLY: 'Semanal',
  DAILY: 'Diário',
  HOURLY: 'Hora',
} as const;

function getStatusLabel(status: EmployeeStatus | null): string {
  return status ? statusLabels[status] : 'Não informado';
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);

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

  useEffect(() => {
    const dialog = dialogRef.current;

    if (selectedEmployee && dialog && !dialog.open) {
      dialog.showModal();
    } else if (!selectedEmployee && dialog?.open) {
      dialog.close();
    }
  }, [selectedEmployee]);

  useEffect(() => {
    const dialog = deleteDialogRef.current;

    if (employeeToDelete && dialog && !dialog.open) {
      dialog.showModal();
    } else if (!employeeToDelete && dialog?.open) {
      dialog.close();
    }
  }, [employeeToDelete]);

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

          {error ? (
            <div className="message error employee-list-message" role="alert">
              <span>{error}</span>
              <button type="button" className="text-button" onClick={retryLoading}>
                Tentar novamente
              </button>
            </div>
          ) : null}

          {isLoading ? (
            <p className="employee-list-state" role="status">Carregando funcionários...</p>
          ) : error ? null : employees.length === 0 && totalElements === 0 &&
            Object.keys(appliedFilters).length === 0 ? (
            <div className="employee-list-state">
              <h3>Nenhum funcionário cadastrado</h3>
              <p>Cadastre um funcionário para começar a montar sua equipe.</p>
              <Link to="/employees/new" className="primary-button">Cadastrar funcionário</Link>
            </div>
          ) : employees.length === 0 ? (
            <div className="employee-list-state">
              <h3>Nenhum funcionário encontrado</h3>
              <p>Altere os filtros ou limpe a busca para ver outros funcionários.</p>
              <button type="button" className="secondary-button" onClick={clearFilters}>
                Limpar busca
              </button>
            </div>
          ) : (
            <div className="employee-table-wrap">
              <table className="employee-table">
                <thead>
                  <tr>
                    <th scope="col">Funcionário</th>
                    <th scope="col">Cargo</th>
                    <th scope="col">Departamento</th>
                    <th scope="col">Admissão</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="employee-actions-heading">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr
                      key={employee.id}
                      tabIndex={0}
                      aria-label={`Abrir detalhes de ${employee.fullName}`}
                      onClick={() => setSelectedEmployee(employee)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedEmployee(employee);
                        }
                      }}
                    >
                      <td data-label="Funcionário">
                        <span className="employee-name">{employee.fullName}</span>
                        <span className="employee-meta">{employee.employeeNumber} · {employee.email}</span>
                      </td>
                      <td data-label="Cargo">{employee.position}</td>
                      <td data-label="Departamento">{employee.department}</td>
                      <td data-label="Admissão">{formatDate(employee.admissionDate)}</td>
                      <td data-label="Status">
                        <span className={`employee-status employee-status-${employee.status?.toLowerCase() ?? 'unknown'}`}>
                          {getStatusLabel(employee.status)}
                        </span>
                      </td>
                      <td
                        data-label="Ações"
                        className="employee-actions-cell"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="employee-row-actions">
                          <button
                            type="button"
                            className="employee-row-action employee-row-action-edit"
                            aria-label={`Editar ${employee.fullName}`}
                            title={`Editar ${employee.fullName}`}
                            onClick={() => navigate(`/employees/${employee.id}/edit`)}
                          >
                            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                              <path d="M12 20h9" />
                              <path d="m16.5 3.5 4 4L9 19l-5 1 1-5L16.5 3.5Z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="employee-row-action employee-row-action-delete"
                            aria-label={`Excluir ${employee.fullName}`}
                            title={`Excluir ${employee.fullName}`}
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
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && !error && employees.length > 0 ? (
            <div className="employee-list-controls">
              <label className="employee-page-size">
                Itens por página
                <select
                  value={pageSize}
                  onChange={(event) => changePageSize(Number(event.target.value))}
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </label>
              {totalPages > 1 ? (
                <nav className="employee-pagination" aria-label="Paginação da lista de funcionários">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => goToPage(Math.max(0, page - 1))}
                    disabled={isLoading || page === 0}
                  >
                    Anterior
                  </button>
                  <span>Página {page + 1} de {totalPages}</span>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => goToPage(Math.min(totalPages - 1, page + 1))}
                    disabled={isLoading || page >= totalPages - 1}
                  >
                    Próxima
                  </button>
                </nav>
              ) : null}
            </div>
          ) : null}
        </section>
      </section>

      <Link to="/employees/new" className="employee-create-fab">
        <span aria-hidden="true">+</span>
        Cadastrar funcionário
      </Link>

      <Outlet context={{ refreshEmployees, employees, isLoading }} />

      <dialog
        ref={dialogRef}
        className="employee-details-dialog"
        aria-labelledby="employee-details-heading"
        onClose={() => setSelectedEmployee(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            setSelectedEmployee(null);
          }
        }}
      >
        {selectedEmployee ? (
          <>
            <header className="employee-details-header">
              <div>
                <p className="eyebrow">Detalhes do funcionário</p>
                <h2 id="employee-details-heading">{selectedEmployee.fullName}</h2>
              </div>
              <button
                type="button"
                className="employee-dialog-close"
                aria-label="Fechar detalhes"
                onClick={() => setSelectedEmployee(null)}
              >
                ×
              </button>
            </header>

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
          </>
        ) : null}
      </dialog>

      <dialog
        ref={deleteDialogRef}
        className="employee-delete-dialog"
        aria-labelledby="employee-delete-heading"
        aria-describedby="employee-delete-description"
        onClose={() => {
          setEmployeeToDelete(null);
          setDeleteError(null);
        }}
        onCancel={(event) => {
          if (deletingEmployeeId) {
            event.preventDefault();
          }
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget && !deletingEmployeeId) {
            setEmployeeToDelete(null);
          }
        }}
      >
        {employeeToDelete ? (
          <div className="employee-delete-content">
            <div className="employee-delete-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 8v5" />
                <path d="M12 17h.01" />
                <path d="M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3l-7.6-13.1a2 2 0 0 0-3.4 0Z" />
              </svg>
            </div>
            <p className="employee-delete-eyebrow">Confirmar exclusão</p>
            <h2 id="employee-delete-heading">Excluir funcionário?</h2>
            <p id="employee-delete-description" className="employee-delete-description">
              Você está prestes a excluir <strong>{employeeToDelete.fullName}</strong>.
              Essa ação é permanente e não pode ser desfeita.
            </p>

            {deleteError ? (
              <p className="message error employee-delete-error" role="alert">
                {deleteError}
              </p>
            ) : null}

            <div className="employee-delete-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setEmployeeToDelete(null)}
                disabled={Boolean(deletingEmployeeId)}
                autoFocus
              >
                Cancelar
              </button>
              <button
                type="button"
                className="employee-delete-confirm"
                onClick={() => void handleConfirmDeleteEmployee()}
                disabled={Boolean(deletingEmployeeId)}
              >
                {deletingEmployeeId ? 'Excluindo...' : 'Excluir funcionário'}
              </button>
            </div>
          </div>
        ) : null}
      </dialog>
    </main>
  );
}
